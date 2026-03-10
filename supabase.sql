-- SweatItOut Database Setup
-- Run this in your Supabase SQL Editor

-- Tables
create table if not exists user_profiles (
  id uuid references auth.users primary key,
  username text unique,
  display_name text,
  avatar_url text,
  streak int default 0,
  longest_streak int default 0,
  total_days int default 0,
  score int default 0,
  created_at timestamptz default now()
);

create table if not exists user_data (
  id uuid references auth.users primary key,
  data jsonb,
  updated_at timestamptz default now()
);

create table if not exists food_logs (
  id uuid references auth.users,
  date date,
  log jsonb,
  totals jsonb,
  updated_at timestamptz default now(),
  primary key (id, date)
);

create table if not exists workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  completed_date date,
  photo_url text,
  photo_path text,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists personal_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  exercise_name text,
  value text,
  notes text,
  date date,
  created_at timestamptz default now()
);

create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users,
  recipient_id uuid references auth.users,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists daily_rewards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  date date,
  type text,
  points int,
  created_at timestamptz default now(),
  unique(user_id, date, type)
);

create table if not exists app_config (
  key text primary key,
  value text
);

-- Insert your Cerebras API key
insert into app_config (key, value) values ('cerebras_key', 'YOUR_CEREBRAS_KEY_HERE') on conflict do nothing;

-- RLS Policies
alter table user_profiles enable row level security;
alter table user_data enable row level security;
alter table food_logs enable row level security;
alter table workout_logs enable row level security;
alter table personal_records enable row level security;
alter table friendships enable row level security;
alter table daily_rewards enable row level security;
alter table app_config enable row level security;

-- user_profiles: public read, own write
create policy "profiles_public_read" on user_profiles for select using (true);
create policy "profiles_own_insert" on user_profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on user_profiles for update using (auth.uid() = id);

-- user_data: own only
create policy "user_data_own" on user_data for all using (auth.uid() = id);

-- food_logs: own only
create policy "food_logs_own" on food_logs for all using (auth.uid() = id);

-- workout_logs: own + friends read
create policy "workout_logs_own" on workout_logs for all using (auth.uid() = user_id);

-- personal_records: own + friends read, own write
create policy "prs_own_write" on personal_records for all using (auth.uid() = user_id);

-- friendships
create policy "fs_read" on friendships for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "fs_insert" on friendships for insert with check (auth.uid() = sender_id);
create policy "fs_update" on friendships for update using (auth.uid() = recipient_id);
create policy "fs_delete" on friendships for delete using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- daily_rewards: own only
create policy "rewards_own" on daily_rewards for all using (auth.uid() = user_id);

-- app_config: authenticated read
create policy "config_read" on app_config for select using (auth.role() = 'authenticated');

-- Storage bucket
insert into storage.buckets (id, name, public) values ('workout-photos', 'workout-photos', true) on conflict do nothing;

-- Storage policies
create policy "photos_public_read" on storage.objects for select using (bucket_id = 'workout-photos');
create policy "photos_own_upload" on storage.objects for insert with check (bucket_id = 'workout-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "photos_own_delete" on storage.objects for delete using (bucket_id = 'workout-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- delete_my_account function
create or replace function delete_my_account()
returns void language plpgsql security definer as $$
begin
  delete from daily_rewards where user_id = auth.uid();
  delete from personal_records where user_id = auth.uid();
  delete from workout_logs where user_id = auth.uid();
  delete from friendships where sender_id = auth.uid() or recipient_id = auth.uid();
  delete from food_logs where id = auth.uid();
  delete from user_data where id = auth.uid();
  delete from user_profiles where id = auth.uid();
end;
$$;