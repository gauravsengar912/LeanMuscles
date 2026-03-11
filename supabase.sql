-- ═══════════════════════════════════════════════════════════════════
-- SweatItOut — Supabase Database Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ── Enable required extensions ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════════

-- ── User Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username     TEXT UNIQUE,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── App-wide config (stores AI key, etc.) ─────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── User fitness data ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_data (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_key    TEXT NOT NULL,
  data_value  JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data_key)
);

-- ── Food logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','snacks','dinner')),
  food_name   TEXT NOT NULL,
  quantity    NUMERIC(8,2) NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'serving',
  calories    NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein     NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs       NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat         NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Workout completion log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Progress photos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  caption     TEXT,
  taken_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Personal records ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise     TEXT NOT NULL,
  value        NUMERIC(10,2) NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'kg',
  recorded_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- profiles: users can only read/write their own row
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_data: private per user
CREATE POLICY "user_data_self" ON user_data
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- food_logs: private per user
CREATE POLICY "food_logs_self" ON food_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- workout_logs: private per user
CREATE POLICY "workout_logs_self" ON workout_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- progress_photos: private per user
CREATE POLICY "progress_photos_self" ON progress_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- personal_records: private per user
CREATE POLICY "personal_records_self" ON personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_config: readable by all authenticated users (AI key loaded here)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_config_read" ON app_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date   ON food_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_user_data_user_key    ON user_data (user_id, data_key);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user  ON progress_photos (user_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records (user_id, exercise);

-- ══════════════════════════════════════════════════════════════════
-- DELETE ACCOUNT RPC (called from Profile panel)
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Delete all user data (RLS cascade handles most, but belt-and-suspenders)
  DELETE FROM food_logs        WHERE user_id = auth.uid();
  DELETE FROM workout_logs     WHERE user_id = auth.uid();
  DELETE FROM progress_photos  WHERE user_id = auth.uid();
  DELETE FROM personal_records WHERE user_id = auth.uid();
  DELETE FROM user_data        WHERE user_id = auth.uid();
  DELETE FROM profiles         WHERE id      = auth.uid();
  -- Delete the auth user itself
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET (run separately or via Supabase dashboard)
-- ══════════════════════════════════════════════════════════════════

-- Create storage bucket for avatars and progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sweatitout', 'sweatitout', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "storage_self_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sweatitout' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'sweatitout');

-- Allow users to delete their own files
CREATE POLICY "storage_self_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sweatitout' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ══════════════════════════════════════════════════════════════════
-- SEED AI KEY (optional — recommended over config.js)
-- Replace 'your-cerebras-api-key' with your actual key
-- ══════════════════════════════════════════════════════════════════

-- INSERT INTO app_config (key, value)
-- VALUES ('cerebras_api_key', 'your-cerebras-api-key')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();