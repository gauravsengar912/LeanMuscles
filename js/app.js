// ============================================================
// App Bootstrap
// ============================================================

async function bootApp() {
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('auth-overlay').classList.add('hidden');

  // Load local state first (offline support)
  loadLocalState();

  // Load from Supabase
  if (STATE.user) {
    await loadUserData();
  }

  // Init all modules
  initFoodLog();
  initWaterTracker();
  initRestTimer();
  initAIChat();
  initProfileActions();

  // Render plans
  renderWorkoutPlan();
  renderDietPlan();

  // Render current tab
  switchTab('home');
  updateNavIndicator('home');

  // Setup midnight reset
  scheduleMidnightReset();

  // Init PWA updates
  registerServiceWorker();

  showToast(`Welcome back, ${STATE.profile?.username || 'Athlete'}! 💪`, 'success');
}

async function loadUserData() {
  try {
    // Profile
    const { data: profile } = await sbGetProfile(STATE.user.id);
    if (profile) {
      STATE.profile = profile;
      STATE.streak = profile.streak || 0;
      STATE.points = profile.points || 0;
      STATE.totalWorkoutDays = profile.total_workout_days || 0;
    }

    // Plans
    const [{ data: wpData }, { data: dpData }] = await Promise.all([
      sbGetPlan(STATE.user.id, 'workout'),
      sbGetPlan(STATE.user.id, 'diet'),
    ]);

    if (wpData?.plan_data) STATE.workoutPlan = wpData.plan_data;
    if (dpData?.plan_data) STATE.dietPlan = dpData.plan_data;

    // Today's food log
    const today = getTodayDate();
    const { data: todayLog } = await sbGetFoodLog(STATE.user.id, today);
    if (todayLog?.log_data) STATE.foodLog[today] = todayLog.log_data;

    // Workout logs (for heatmap + streak)
    const { data: wLogs } = await sbGetWorkoutLogs(STATE.user.id, 13);
    STATE.workoutLogs = wLogs || [];

    // Meal templates
    const { data: templates } = await sbGetTemplates(STATE.user.id);
    STATE.templates = (templates || []).map(t => ({
      id: t.id,
      name: t.name,
      totalCals: t.template_data?.totalCals || 0,
      template_data: t.template_data,
    }));

    saveLocalState();
  } catch(e) {
    console.warn('Data load error (offline?):', e);
  }
}

// ---- Midnight Reset ----
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 1, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    // Archive yesterday's log then reset
    if (STATE.user && STATE.foodLog[getTodayDate()]) {
      sbSaveFoodLog(STATE.user.id, getTodayDate(), STATE.foodLog[getTodayDate()]);
    }
    renderFoodLog();
    renderWaterTracker();
    refreshHome();
    scheduleMidnightReset(); // schedule next
  }, msUntilMidnight);
}

// ---- Service Worker ----
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => {
      console.log('SW registration failed:', e);
    });
  }
}

// ---- App Init ----
document.addEventListener('DOMContentLoaded', async () => {
  // Init particles
  initParticles();

  // Init Supabase
  initSupabase();

  // Check for existing session
  const session = await sbGetSession();
  if (session?.user) {
    await handleAuthSuccess(session.user);
  } else {
    // Show auth
    initAuth();
    document.getElementById('auth-overlay').classList.remove('hidden');
  }

  // Always init auth listeners
  initAuth();

  // Reveal animations on initial load
  setTimeout(() => triggerReveal(), 200);
});
