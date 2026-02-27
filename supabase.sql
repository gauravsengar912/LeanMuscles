-- ── Existing Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── New Tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  avatar_url TEXT,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_days INT DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  value TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_data' AND policyname = 'user_data_self') THEN
    CREATE POLICY "user_data_self" ON user_data FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_logs' AND policyname = 'food_logs_self') THEN
    CREATE POLICY "food_logs_self" ON food_logs FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_self') THEN
    CREATE POLICY "user_profiles_self" ON user_profiles FOR ALL USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'workout_logs_self') THEN
    CREATE POLICY "workout_logs_self" ON workout_logs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'personal_records_self') THEN
    CREATE POLICY "personal_records_self" ON personal_records FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Indexes ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
  ON workout_logs (user_id, completed_date DESC);

CREATE INDEX IF NOT EXISTS idx_personal_records_user
  ON personal_records (user_id, created_at DESC);

-- ── Storage Bucket ───────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-photos', 'workout-photos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'auth_upload_workout_photos') THEN
    CREATE POLICY "auth_upload_workout_photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'workout-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'public_read_workout_photos') THEN
    CREATE POLICY "public_read_workout_photos" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'workout-photos');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'auth_delete_workout_photos') THEN
    CREATE POLICY "auth_delete_workout_photos" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'workout-photos' AND auth.uid()::text = (storage.foldername(name))[2]);
  END IF;
END $$;

ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;