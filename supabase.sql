-- ═══════════════════════════════════════════════════════════════════
-- SweatItOut — Supabase SQL Setup
-- Run the entire script in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── Enable UUID extension (already on in Supabase, kept for safety) ──
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════════

-- User profiles (one row per auth.users row)
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT UNIQUE,
  avatar_url          TEXT,
  current_streak      INT  DEFAULT 0,
  longest_streak      INT  DEFAULT 0,
  total_days          INT  DEFAULT 0,
  total_score         INT  DEFAULT 0,      -- ← required by rewards system
  last_completed_date DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Workout logs / story photos (24-hour expiry handled client-side)
CREATE TABLE IF NOT EXISTS workout_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date  DATE        NOT NULL,
  photo_url       TEXT,
  photo_path      TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Personal records
CREATE TABLE IF NOT EXISTS personal_records (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise   TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food / calorie logs (one row per user — stores today's JSON log)
-- id equals auth.users id. Synced by syncToSupabase(); deleted by deleteAccount().
CREATE TABLE IF NOT EXISTS food_logs (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date   DATE        DEFAULT CURRENT_DATE,
  log_data   JSONB,      -- full meal log: {"breakfast":[...],"lunch":[...],...}
  totals     JSONB,      -- {cal, protein, carbs, fat} for the day
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main app state — stores plan, diet, ai history, user profile data etc.
-- One row per user; upserted by syncToSupabase(), read by loadFromSupabase().
CREATE TABLE IF NOT EXISTS user_data (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships (directional; accepted = bidirectional pair stored as two rows)
CREATE TABLE IF NOT EXISTS friendships (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- Daily reward ledger (prevents double-awarding the same action on the same day)
CREATE TABLE IF NOT EXISTS daily_rewards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  reward_type TEXT        NOT NULL,   -- 'food_log' | 'nutrition_goal' | 'workout_complete'
  points      INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, reward_date, reward_type)
);


-- ═══════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id    ON workout_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_expires_at ON workout_logs (expires_at);
CREATE INDEX IF NOT EXISTS idx_personal_records_user   ON personal_records (user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user        ON friendships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend      ON friendships (friend_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_date ON daily_rewards (user_id, reward_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username  ON user_profiles (username);   -- for ilike search


-- ═══════════════════════════════════════════════════════════════════
-- 3. ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on every table
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards    ENABLE ROW LEVEL SECURITY;


-- ── user_profiles ────────────────────────────────────────────────
-- Users can read any profile (needed for friend search & leaderboard)
CREATE POLICY "profiles_read_all"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can only insert / update their own profile
CREATE POLICY "profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON user_profiles FOR DELETE
  USING (id = auth.uid());


-- ── workout_logs ─────────────────────────────────────────────────
-- Users can read their own logs AND logs belonging to their accepted friends
CREATE POLICY "workout_logs_read"
  ON workout_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "workout_logs_insert_own"
  ON workout_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_logs_update_own"
  ON workout_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "workout_logs_delete_own"
  ON workout_logs FOR DELETE
  USING (user_id = auth.uid());


-- ── personal_records ─────────────────────────────────────────────
-- Users can read their own PRs AND their accepted friends' PRs
CREATE POLICY "pr_read"
  ON personal_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "pr_insert_own"
  ON personal_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pr_delete_own"
  ON personal_records FOR DELETE
  USING (user_id = auth.uid());


-- ── food_logs ────────────────────────────────────────────────────
-- Private — only the owner can read/write
CREATE POLICY "food_logs_owner"
  ON food_logs FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── user_data ─────────────────────────────────────────────────────
-- Private — only the owner can read/write their app state
CREATE POLICY "user_data_owner"
  ON user_data FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── friendships ──────────────────────────────────────────────────
-- Users can read rows where they are sender or recipient
CREATE POLICY "friendships_read"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only the recipient can update (accept/reject); only sender/recipient can delete
CREATE POLICY "friendships_update"
  ON friendships FOR UPDATE
  USING (friend_id = auth.uid());

CREATE POLICY "friendships_delete"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- ── daily_rewards ────────────────────────────────────────────────
CREATE POLICY "rewards_owner"
  ON daily_rewards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════
-- 4. STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════════
-- Run this in the SQL editor (Supabase Storage is also configurable via
-- the dashboard under Storage → New Bucket).

INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-photos', 'workout-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — allow authenticated users to upload to their own folder
CREATE POLICY "storage_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read (bucket is public, but belt-and-suspenders)
CREATE POLICY "storage_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-photos');

-- Allow users to delete their own files
CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Also allow upsert (update) to own folder (for avatar overwrites)
CREATE POLICY "storage_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ═══════════════════════════════════════════════════════════════════
-- 5. OPTIONAL: Auto-cleanup expired workout photos (pg_cron)
-- ═══════════════════════════════════════════════════════════════════
-- Enable pg_cron via Supabase dashboard → Extensions, then uncomment:

-- SELECT cron.schedule(
--   'cleanup-expired-photos',
--   '0 * * * *',   -- every hour
--   $$
--     UPDATE workout_logs
--     SET photo_url = NULL, photo_path = NULL
--     WHERE expires_at IS NOT NULL AND expires_at < NOW();
--   $$
-- );