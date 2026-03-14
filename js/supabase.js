// ============================================================
// Supabase Client & Database Operations
// ============================================================

let supabaseClient = null;

function initSupabase() {
  try {
    supabaseClient = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY
    );
    return supabaseClient;
  } catch (e) {
    console.error('Supabase init failed:', e);
    return null;
  }
}

// ---- Auth ----
async function sbSignUp(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  return { data, error };
}

async function sbSignIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function sbSignOut() {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
}

async function sbResetPassword(email) {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  return { error };
}

async function sbGetUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function sbGetSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

// ---- Profile ----
async function sbGetProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

async function sbUpsertProfile(profile) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });
  setSynced();
  return { data, error };
}

// ---- Plans ----
async function sbGetPlan(userId, type) {
  const { data, error } = await supabaseClient
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

async function sbSavePlan(userId, type, planData) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('plans')
    .upsert({
      user_id: userId,
      type,
      plan_data: planData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,type' });
  setSynced();
  return { data, error };
}

// ---- Food Log ----
async function sbGetFoodLog(userId, date) {
  const { data, error } = await supabaseClient
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .single();
  return { data, error };
}

async function sbSaveFoodLog(userId, date, logData) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('food_logs')
    .upsert({
      user_id: userId,
      log_date: date,
      log_data: logData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,log_date' });
  setSynced();
  return { data, error };
}

async function sbGetFoodLogRange(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabaseClient
    .from('food_logs')
    .select('log_date, log_data')
    .eq('user_id', userId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date', { ascending: false });
  return { data, error };
}

// ---- Workout Tracking ----
async function sbLogWorkout(userId, date, dayKey) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('workout_logs')
    .upsert({
      user_id: userId,
      workout_date: date,
      day_key: dayKey,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,workout_date' });
  setSynced();
  return { data, error };
}

async function sbGetWorkoutLogs(userId, weeks = 13) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);
  const { data, error } = await supabaseClient
    .from('workout_logs')
    .select('workout_date')
    .eq('user_id', userId)
    .gte('workout_date', since.toISOString().split('T')[0])
    .order('workout_date', { ascending: true });
  return { data, error };
}

// ---- Personal Records ----
async function sbGetPRs(userId) {
  const { data, error } = await supabaseClient
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

async function sbAddPR(userId, exercise, weight, reps) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('personal_records')
    .insert({
      user_id: userId,
      exercise,
      weight_kg: weight,
      reps,
      created_at: new Date().toISOString()
    });
  setSynced();
  return { data, error };
}

async function sbDeletePR(id) {
  setSyncing();
  const { error } = await supabaseClient
    .from('personal_records')
    .delete()
    .eq('id', id);
  setSynced();
  return { error };
}

// ---- Friends ----
async function sbSearchUser(username) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', username)
    .single();
  return { data, error };
}

async function sbSendFriendRequest(fromId, toId) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('friendships')
    .insert({ user_id: fromId, friend_id: toId, status: 'pending' });
  setSynced();
  return { data, error };
}

async function sbGetFriends(userId) {
  const { data, error } = await supabaseClient
    .from('friendships')
    .select(`
      id, status, user_id, friend_id,
      friend:profiles!friendships_friend_id_fkey(id, username, avatar_url),
      requester:profiles!friendships_user_id_fkey(id, username, avatar_url)
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');
  return { data, error };
}

async function sbGetFriendRequests(userId) {
  const { data, error } = await supabaseClient
    .from('friendships')
    .select(`
      id, user_id,
      requester:profiles!friendships_user_id_fkey(id, username)
    `)
    .eq('friend_id', userId)
    .eq('status', 'pending');
  return { data, error };
}

async function sbRespondToRequest(id, accept) {
  setSyncing();
  const { error } = await supabaseClient
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', id);
  setSynced();
  return { error };
}

// ---- Leaderboard ----
async function sbGetLeaderboard(userIds) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, username, streak, points, total_workout_days, avatar_url')
    .in('id', userIds);
  return { data, error };
}

// ---- Workout Photos (Stories) ----
async function sbUploadStory(userId, file) {
  setSyncing();
  const fileName = `${userId}/${Date.now()}.jpg`;
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('workout-stories')
    .upload(fileName, file, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) { setSynced(); return { error: uploadError }; }

  const { data: urlData } = supabaseClient.storage
    .from('workout-stories')
    .getPublicUrl(fileName);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabaseClient
    .from('workout_stories')
    .insert({
      user_id: userId,
      image_url: urlData.publicUrl,
      storage_path: fileName,
      expires_at: expiresAt.toISOString()
    });
  setSynced();
  return { data, error, url: urlData.publicUrl };
}

async function sbGetStories(userId) {
  const { data, error } = await supabaseClient
    .from('workout_stories')
    .select('*')
    .eq('user_id', userId)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return { data, error };
}

async function sbGetFriendStories(friendIds) {
  const { data, error } = await supabaseClient
    .from('workout_stories')
    .select('*, user:profiles!workout_stories_user_id_fkey(username, avatar_url)')
    .in('user_id', friendIds)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return { data, error };
}

// ---- Avatar ----
async function sbUploadAvatar(userId, file) {
  setSyncing();
  const fileName = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabaseClient.storage
    .from('avatars')
    .upload(fileName, file, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) { setSynced(); return { error: uploadError }; }

  const { data: urlData } = supabaseClient.storage
    .from('avatars')
    .getPublicUrl(fileName);

  setSynced();
  return { url: urlData.publicUrl + '?t=' + Date.now() };
}

// ---- Delete Account ----
async function sbDeleteAccount(userId) {
  setSyncing();
  const { error } = await supabaseClient.rpc('delete_user_data', { p_user_id: userId });
  setSynced();
  return { error };
}

// ---- Meal Templates ----
async function sbGetTemplates(userId) {
  const { data, error } = await supabaseClient
    .from('meal_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);
  return { data, error };
}

async function sbSaveTemplate(userId, name, templateData) {
  setSyncing();
  const { data, error } = await supabaseClient
    .from('meal_templates')
    .insert({ user_id: userId, name, template_data: templateData });
  setSynced();
  return { data, error };
}

async function sbDeleteTemplate(id) {
  const { error } = await supabaseClient.from('meal_templates').delete().eq('id', id);
  return { error };
}

// ---- Stats helpers ----
function setSyncing() {
  const dot = document.getElementById('sync-indicator');
  const dotMini = document.getElementById('sync-dot-mini');
  const text = document.getElementById('sync-text');
  if (dot) dot.querySelector('.sync-dot')?.className && (dot.querySelector('.sync-dot').className = 'sync-dot syncing');
  if (dotMini) dotMini.className = 'sync-dot-mini syncing';
  if (text) text.textContent = 'Syncing...';
}

function setSynced() {
  const dot = document.getElementById('sync-indicator');
  const dotMini = document.getElementById('sync-dot-mini');
  const text = document.getElementById('sync-text');
  if (dot) dot.querySelector('.sync-dot')?.className && (dot.querySelector('.sync-dot').className = 'sync-dot synced');
  if (dotMini) dotMini.className = 'sync-dot-mini';
  if (text) text.textContent = 'Synced';
}
