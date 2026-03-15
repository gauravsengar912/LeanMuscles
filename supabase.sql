-- ============================================================
-- SWEAT IT OUT — Complete Supabase Database Setup
-- Run this entire file in Supabase SQL Editor (one shot)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
-- One row per user, created on first sign-in / onboarding
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT        UNIQUE,
  avatar_url        TEXT,

  -- Body metrics
  age               INT,
  gender            TEXT,
  height_cm         NUMERIC(5,1),
  weight_kg         NUMERIC(5,1),
  activity_level    TEXT,       -- sedentary | light | moderate | active | athlete

  -- Goals & preferences
  goal              TEXT,       -- fat_loss | muscle_gain | recomp | strength | endurance | health
  diet_preference   TEXT,       -- non_veg | veg | vegan | eggetarian
  training_days     INT,
  split             TEXT,       -- auto | full_body | upper_lower | ppl | bro_split | custom
  experience        TEXT,       -- beginner | intermediate | advanced
  equipment         TEXT,       -- full_gym | home_dumbbells | home_only | barbell
  notes             TEXT,

  -- Progress / gamification
  streak            INT         DEFAULT 0,
  longest_streak    INT         DEFAULT 0,
  total_workout_days INT        DEFAULT 0,
  points            INT         DEFAULT 0,

  -- State flags
  is_onboarded      BOOLEAN     DEFAULT FALSE,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to read friends' public profile fields (for leaderboard/social)
CREATE POLICY "Users can view public profile fields"
  ON public.profiles FOR SELECT
  USING (true);   -- reads are filtered in-app; no private data on profiles


-- ────────────────────────────────────────────────────────────
-- 2. PLANS
-- Stores the generated workout & diet plan JSON per user
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,   -- 'workout' | 'diet'
  plan_data  JSONB       NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type)
);

DROP TRIGGER IF EXISTS plans_updated_at ON public.plans;
CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS plans_user_id_idx ON public.plans(user_id);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plans"
  ON public.plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 3. FOOD LOGS
-- Daily food log — one row per user per date
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.food_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date   DATE        NOT NULL,
  log_data   JSONB       NOT NULL,   -- { breakfast:[], lunch:[], snacks:[], dinner:[], water:{} }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

DROP TRIGGER IF EXISTS food_logs_updated_at ON public.food_logs;
CREATE TRIGGER food_logs_updated_at
  BEFORE UPDATE ON public.food_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS food_logs_user_date_idx ON public.food_logs(user_id, log_date);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food logs"
  ON public.food_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 4. WORKOUT LOGS
-- One row per completed workout session
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_date  DATE        NOT NULL,
  day_key       TEXT,                  -- e.g. 'day_0', 'day_3'
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, workout_date)
);

CREATE INDEX IF NOT EXISTS workout_logs_user_idx ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_date_idx ON public.workout_logs(user_id, workout_date);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout logs"
  ON public.workout_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 5. PERSONAL RECORDS
-- Lifetime bests per exercise
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.personal_records (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise    TEXT        NOT NULL,
  weight_kg   NUMERIC(6,2),
  reps        INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prs_user_idx ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS prs_exercise_idx ON public.personal_records(user_id, exercise);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own PRs"
  ON public.personal_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 6. FRIENDSHIPS
-- Bidirectional friend graph with pending/accepted/rejected states
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friendships (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- sender
  friend_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- receiver
  status     TEXT        NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS friendships_user_idx   ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON public.friendships(friend_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can respond to requests they received"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = friend_id OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);


-- ────────────────────────────────────────────────────────────
-- 7. WORKOUT STORIES
-- 24-hour ephemeral stories (Instagram-style)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_stories (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url     TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stories_user_idx    ON public.workout_stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expiry_idx  ON public.workout_stories(expires_at);

ALTER TABLE public.workout_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all non-expired stories"
  ON public.workout_stories FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Users manage own stories"
  ON public.workout_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stories"
  ON public.workout_stories FOR DELETE
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 8. MEAL TEMPLATES
-- User-saved custom meal templates
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  template_data JSONB       NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_templates_user_idx ON public.meal_templates(user_id);

ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own meal templates"
  ON public.meal_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 9. APP CONFIG
-- Key-value store for server-side config (AI key, feature flags)
-- Readable only by authenticated users
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (done via Supabase dashboard or CLI)


-- ────────────────────────────────────────────────────────────
-- 10. STORAGE BUCKETS
-- Run these in the Supabase SQL editor — creates buckets
-- ────────────────────────────────────────────────────────────

-- Avatar bucket (public read, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Workout stories bucket (public read, auth write, 24hr expiry handled in app)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-stories',
  'workout-stories',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — avatars
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS — workout-stories
CREATE POLICY "Story images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-stories');

CREATE POLICY "Users can upload their own stories"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'workout-stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own stories"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'workout-stories' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ────────────────────────────────────────────────────────────
-- 11. AI KEY — insert your Cerebras key here
-- ────────────────────────────────────────────────────────────
INSERT INTO public.app_config (key, value)
VALUES ('openai_key', 'csk-YOUR-CEREBRAS-KEY-HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ────────────────────────────────────────────────────────────
-- 12. AUTO-CREATE PROFILE ON SIGN-UP
-- Triggered when a new user registers via Supabase Auth
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 13. EXPIRED STORY CLEANUP (optional — run as a cron job)
-- In Supabase: Database → Extensions → pg_cron → enable
-- Then schedule: SELECT cron.schedule('0 * * * *', $$
--   DELETE FROM public.workout_stories WHERE expires_at < NOW();
--   DELETE FROM storage.objects WHERE bucket_id = 'workout-stories'
--     AND created_at < NOW() - INTERVAL '25 hours';
-- $$);
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- DONE — Verify with:
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
-- ────────────────────────────────────────────────────────────