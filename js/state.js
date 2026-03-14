// ============================================================
// App State Management
// ============================================================

const STATE = {
  user: null,
  profile: null,
  workoutPlan: null,
  dietPlan: null,
  foodLog: {}, // { 'YYYY-MM-DD': { breakfast: [], lunch: [], snacks: [], dinner: [] } }
  currentFoodLogDate: new Date().toISOString().split('T')[0],
  workoutCompleted: {}, // { 'YYYY-MM-DD': dayKey }
  water: {}, // { 'YYYY-MM-DD': { cups: 0 } }
  prs: [],
  friends: [],
  friendRequests: [],
  templates: [],
  stories: [],
  workoutLogs: [],
  currentWorkoutDay: 0,
  currentDietDay: 0,
  currentTab: 'home',
  aiChatContext: 'workout',
  aiChatHistory: { workout: [], diet: [], foodlog: [] },
  streak: 0,
  longestStreak: 0,
  totalWorkoutDays: 0,
  points: 0,
  isOnboarded: false,
  selectedGoal: null,
  selectedTrainingDays: 4,
  lruCache: new Map(), // food search LRU
  cacheMaxSize: 60,
  cacheTTL: 5 * 60 * 1000, // 5 min
};

// Save state to localStorage for offline
function saveLocalState() {
  try {
    const localData = {
      workoutPlan: STATE.workoutPlan,
      dietPlan: STATE.dietPlan,
      foodLog: STATE.foodLog,
      water: STATE.water,
      workoutCompleted: STATE.workoutCompleted,
      currentWorkoutDay: STATE.currentWorkoutDay,
      currentDietDay: STATE.currentDietDay,
      lastSaved: Date.now(),
    };
    localStorage.setItem('fitai_state', JSON.stringify(localData));
  } catch(e) {}
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem('fitai_state');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.workoutPlan) STATE.workoutPlan = d.workoutPlan;
    if (d.dietPlan) STATE.dietPlan = d.dietPlan;
    if (d.foodLog) STATE.foodLog = d.foodLog;
    if (d.water) STATE.water = d.water;
    if (d.workoutCompleted) STATE.workoutCompleted = d.workoutCompleted;
    if (d.currentWorkoutDay !== undefined) STATE.currentWorkoutDay = d.currentWorkoutDay;
    if (d.currentDietDay !== undefined) STATE.currentDietDay = d.currentDietDay;
  } catch(e) {}
}

// LRU Cache helpers
function cacheGet(key) {
  const item = STATE.lruCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > STATE.cacheTTL) {
    STATE.lruCache.delete(key);
    return null;
  }
  // Move to end (most recently used)
  STATE.lruCache.delete(key);
  STATE.lruCache.set(key, item);
  return item.value;
}

function cacheSet(key, value) {
  if (STATE.lruCache.has(key)) STATE.lruCache.delete(key);
  if (STATE.lruCache.size >= STATE.cacheMaxSize) {
    const firstKey = STATE.lruCache.keys().next().value;
    STATE.lruCache.delete(firstKey);
  }
  STATE.lruCache.set(key, { value, timestamp: Date.now() });
}

// Today's helpers
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getDayOfWeek() {
  return new Date().getDay(); // 0=Sun
}

function getTodayFoodLog() {
  const today = getTodayDate();
  if (!STATE.foodLog[today]) {
    STATE.foodLog[today] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  }
  return STATE.foodLog[today];
}

function getTodayWater() {
  const today = getTodayDate();
  if (!STATE.water[today]) STATE.water[today] = { cups: 0 };
  return STATE.water[today];
}

function calcTDEE(profile) {
  if (!profile) return 2000;
  const { age, gender, height_cm, weight_kg, activity_level } = profile;
  let bmr;
  if (gender === 'female') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  }
  const multipliers = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9
  };
  return Math.round(bmr * (multipliers[activity_level] || 1.55));
}

function calcBMI(profile) {
  if (!profile) return null;
  const { height_cm, weight_kg } = profile;
  if (!height_cm || !weight_kg) return null;
  return +(weight_kg / Math.pow(height_cm / 100, 2)).toFixed(1);
}

function getBMICategory(bmi) {
  if (!bmi) return { label: '--', color: 'var(--text-muted)' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--protein-color)' };
  if (bmi < 25) return { label: 'Normal', color: 'var(--accent-green)' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--accent-orange)' };
  return { label: 'Obese', color: 'var(--fat-color)' };
}

function calcWaterGoal(weightKg) {
  const ml = Math.round(weightKg * 35);
  const cups = Math.round(ml / 250);
  return { ml, cups };
}

function calcStreak(workoutLogs) {
  if (!workoutLogs || workoutLogs.length === 0) return { streak: 0, longest: 0 };
  const dates = workoutLogs.map(l => l.workout_date).sort().reverse();
  const today = getTodayDate();
  let streak = 0, longest = 0, cur = 0;
  let prev = null;
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    if (prev === null) {
      const daysDiff = Math.round((new Date(today) - new Date(d)) / 86400000);
      if (daysDiff <= 1) { cur = 1; }
    } else {
      const diff = Math.round((new Date(prev) - new Date(d)) / 86400000);
      if (diff === 1) cur++; else cur = 1;
    }
    if (i === 0 && cur > 0) streak = cur;
    if (cur > longest) longest = cur;
    prev = d;
  }
  return { streak: i === 0 ? streak : 0, longest }; // simplified
}

// Motivational quotes
const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Progress, not perfection.",
  "Every rep is a step closer to your goal.",
  "Discipline is doing it even when you don't feel like it.",
  "The body achieves what the mind believes.",
  "Strive for progress, not perfection.",
  "Sweat is fat crying.",
  "Results happen over time, not overnight. Work hard, stay consistent.",
  "Make yourself proud.",
  "Strong mind, strong body.",
  "Your only competition is the person you were yesterday.",
  "It always seems impossible until it's done.",
  "The harder you work, the greater the reward.",
  "Champions aren't made in gyms. They're made from something they have deep inside.",
];

function getDailyQuote() {
  const idx = new Date().getDate() % QUOTES.length;
  return QUOTES[idx];
}
