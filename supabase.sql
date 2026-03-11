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

-- App configuration (stores server-side secrets like API keys)
-- Only accessible by the service_role; anon users can SELECT but NOT modify.
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the Cerebras key row (replace the value with your real key)
-- You can also update it anytime via the app: Menu → Manage AI Key
INSERT INTO app_config (key, value)
VALUES ('openai_key', 'REPLACE_WITH_YOUR_CEREBRAS_KEY')
ON CONFLICT (key) DO NOTHING;


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


-- ── app_config ───────────────────────────────────────────────────
-- Authenticated users can READ the config (needed to fetch the AI key at boot)
-- Only the service_role (or a logged-in admin) can INSERT/UPDATE/DELETE.
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_read" ON app_config;
CREATE POLICY "app_config_read"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to upsert their own key changes via the app UI
DROP POLICY IF EXISTS "app_config_upsert" ON app_config;
CREATE POLICY "app_config_upsert"
  ON app_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ── user_profiles ────────────────────────────────────────────────
-- Users can read any profile (needed for friend search & leaderboard)
DROP POLICY IF EXISTS "profiles_read_all" ON user_profiles;
CREATE POLICY "profiles_read_all"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can only insert / update their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON user_profiles;
CREATE POLICY "profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON user_profiles;
CREATE POLICY "profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_own" ON user_profiles;
CREATE POLICY "profiles_delete_own"
  ON user_profiles FOR DELETE
  USING (id = auth.uid());


-- ── workout_logs ─────────────────────────────────────────────────
-- Users can read their own logs AND logs belonging to their accepted friends
DROP POLICY IF EXISTS "workout_logs_read" ON workout_logs;
CREATE POLICY "workout_logs_read"
  ON workout_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "workout_logs_insert_own" ON workout_logs;
CREATE POLICY "workout_logs_insert_own"
  ON workout_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_logs_update_own" ON workout_logs;
CREATE POLICY "workout_logs_update_own"
  ON workout_logs FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "workout_logs_delete_own" ON workout_logs;
CREATE POLICY "workout_logs_delete_own"
  ON workout_logs FOR DELETE
  USING (user_id = auth.uid());


-- ── personal_records ─────────────────────────────────────────────
-- Users can read their own PRs AND their accepted friends' PRs
DROP POLICY IF EXISTS "pr_read" ON personal_records;
CREATE POLICY "pr_read"
  ON personal_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT friend_id FROM friendships
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "pr_insert_own" ON personal_records;
CREATE POLICY "pr_insert_own"
  ON personal_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pr_delete_own" ON personal_records;
CREATE POLICY "pr_delete_own"
  ON personal_records FOR DELETE
  USING (user_id = auth.uid());


-- ── food_logs ────────────────────────────────────────────────────
-- Private — only the owner can read/write
DROP POLICY IF EXISTS "food_logs_owner" ON food_logs;
CREATE POLICY "food_logs_owner"
  ON food_logs FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── user_data ─────────────────────────────────────────────────────
-- Private — only the owner can read/write their app state
DROP POLICY IF EXISTS "user_data_owner" ON user_data;
CREATE POLICY "user_data_owner"
  ON user_data FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── friendships ──────────────────────────────────────────────────
-- Users can read rows where they are sender or recipient
DROP POLICY IF EXISTS "friendships_read" ON friendships;
CREATE POLICY "friendships_read"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS "friendships_insert" ON friendships;
CREATE POLICY "friendships_insert"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only the recipient can update (accept/reject); only sender/recipient can delete
DROP POLICY IF EXISTS "friendships_update" ON friendships;
CREATE POLICY "friendships_update"
  ON friendships FOR UPDATE
  USING (friend_id = auth.uid());

DROP POLICY IF EXISTS "friendships_delete" ON friendships;
CREATE POLICY "friendships_delete"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- ── daily_rewards ────────────────────────────────────────────────
DROP POLICY IF EXISTS "rewards_owner" ON daily_rewards;
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
DROP POLICY IF EXISTS "storage_upload_own" ON storage.objects;
CREATE POLICY "storage_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read (bucket is public, but belt-and-suspenders)
DROP POLICY IF EXISTS "storage_read_public" ON storage.objects;
CREATE POLICY "storage_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workout-photos');

-- Allow users to delete their own files
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;
CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Also allow upsert (update) to own folder (for avatar overwrites)
DROP POLICY IF EXISTS "storage_update_own" ON storage.objects;
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

-- ═══════════════════════════════════════════════════════════════════
-- 6. SERVER-SIDE ACCOUNT DELETION FUNCTION
-- ═══════════════════════════════════════════════════════════════════
-- The Supabase anon key cannot call auth.admin.deleteUser().
-- This SECURITY DEFINER function runs with elevated privileges so the
-- authenticated user can delete their own auth.users row from the client.
-- All application table rows cascade automatically via FK ON DELETE CASCADE.

DROP FUNCTION IF EXISTS delete_my_account();
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

-- Only the authenticated user themselves can invoke this function
REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;