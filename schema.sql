-- ============================================================
-- FitAI Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- PROFILES
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  activity_level TEXT DEFAULT 'moderate',
  goal TEXT DEFAULT 'muscle_gain',
  diet_preference TEXT DEFAULT 'non_veg',
  training_days INTEGER DEFAULT 4,
  split TEXT DEFAULT 'ppl',
  experience TEXT DEFAULT 'intermediate',
  equipment TEXT DEFAULT 'full_gym',
  notes TEXT,
  avatar_url TEXT,
  is_onboarded BOOLEAN DEFAULT false,
  streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workout_days INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- PLANS (workout & diet)
-- ========================
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('workout', 'diet')),
  plan_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type)
);

-- ========================
-- FOOD LOGS
-- ========================
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  log_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

-- ========================
-- WORKOUT LOGS
-- ========================
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  day_key TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, workout_date)
);

-- ========================
-- PERSONAL RECORDS
-- ========================
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- FRIENDSHIPS
-- ========================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- ========================
-- WORKOUT STORIES
-- ========================
CREATE TABLE IF NOT EXISTS workout_stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- MEAL TEMPLATES
-- ========================
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- ROW LEVEL SECURITY
-- ========================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Allow leaderboard: friends can see each other's basic stats
CREATE POLICY "Users can view all profiles for leaderboard" ON profiles FOR SELECT USING (true);

-- Plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plans" ON plans FOR ALL USING (auth.uid() = user_id);

-- Food Logs
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own food logs" ON food_logs FOR ALL USING (auth.uid() = user_id);

-- Workout Logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own workout logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);

-- Personal Records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own PRs" ON personal_records FOR ALL USING (auth.uid() = user_id);

-- Friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships where they are the recipient" ON friendships FOR UPDATE USING (auth.uid() = friend_id);

-- Workout Stories
ALTER TABLE workout_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own stories" ON workout_stories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Friends can see stories" ON workout_stories FOR SELECT USING (true); -- refine via application logic

-- Meal Templates
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own templates" ON meal_templates FOR ALL USING (auth.uid() = user_id);

-- ========================
-- STORAGE BUCKETS
-- ========================
-- Run in Supabase Dashboard > Storage:
-- Create bucket: "avatars" (public)
-- Create bucket: "workout-stories" (public)

-- ========================
-- DELETE USER FUNCTION
-- ========================
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM meal_templates WHERE user_id = p_user_id;
  DELETE FROM workout_stories WHERE user_id = p_user_id;
  DELETE FROM friendships WHERE user_id = p_user_id OR friend_id = p_user_id;
  DELETE FROM personal_records WHERE user_id = p_user_id;
  DELETE FROM workout_logs WHERE user_id = p_user_id;
  DELETE FROM food_logs WHERE user_id = p_user_id;
  DELETE FROM plans WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;
  -- Note: auth.users deletion must be done via Supabase Admin API or Dashboard
END;
$$;

-- ========================
-- INDEXES for performance
-- ========================
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON workout_stories(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
