// State helpers - STATE object defined in index.html
// LRU Cache helpers
function cacheGet(key) {
  const item = STATE._lru.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > 300000) { STATE._lru.delete(key); return null; }
  STATE._lru.delete(key); STATE._lru.set(key, item);
  return item.v;
}
function cacheSet(key, value) {
  if (STATE._lru.has(key)) STATE._lru.delete(key);
  if (STATE._lru.size >= 60) { const k = STATE._lru.keys().next().value; STATE._lru.delete(k); }
  STATE._lru.set(key, { v: value, ts: Date.now() });
}

const QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "Your body achieves what your mind believes.",
  "Progress, not perfection.",
  "Every rep is a step closer to your goal.",
  "Discipline is doing it when you don't feel like it.",
  "Champions are made from what they have deep inside.",
  "Make yourself proud.",
  "Strong mind, strong body.",
  "Your only competition is who you were yesterday.",
  "Results happen over time. Work hard, stay consistent.",
];
function getDailyQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }
function getTodayDate() { return new Date().toISOString().split('T')[0]; }
function getTodayLog() { const t=getTodayDate(); if(!STATE.foodLog[t])STATE.foodLog[t]={breakfast:[],lunch:[],snacks:[],dinner:[]}; return STATE.foodLog[t]; }
function getTodayWater() { const t=getTodayDate(); if(!STATE.water[t])STATE.water[t]={cups:0}; return STATE.water[t]; }
function saveLocal() { try{localStorage.setItem('fitai',JSON.stringify({workoutPlan:STATE.workoutPlan,dietPlan:STATE.dietPlan,foodLog:STATE.foodLog,water:STATE.water,workoutCompleted:STATE.workoutCompleted||{},currentWorkoutDay:STATE.currentWorkoutDay,currentDietDay:STATE.currentDietDay}));}catch(e){} }
function loadLocal() { try{const d=JSON.parse(localStorage.getItem('fitai')||'{}');if(d.workoutPlan)STATE.workoutPlan=d.workoutPlan;if(d.dietPlan)STATE.dietPlan=d.dietPlan;if(d.foodLog)STATE.foodLog=d.foodLog;if(d.water)STATE.water=d.water;if(d.workoutCompleted)STATE.workoutCompleted=d.workoutCompleted;if(d.currentWorkoutDay!==undefined)STATE.currentWorkoutDay=d.currentWorkoutDay;if(d.currentDietDay!==undefined)STATE.currentDietDay=d.currentDietDay;}catch(e){} }
// Aliases used by other modules
const saveLocalState = saveLocal;
const loadLocalState = loadLocal;
function calcTDEE(p){if(!p)return 2000;const{age,gender,height_cm:h,weight_kg:w,activity_level:a}=p;let bmr=gender==='female'?10*w+6.25*h-5*age-161:10*w+6.25*h-5*age+5;const m={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,athlete:1.9};return Math.round(bmr*(m[a]||1.55));}
function calcBMI(p){if(!p||!p.height_cm||!p.weight_kg)return null;return+(p.weight_kg/Math.pow(p.height_cm/100,2)).toFixed(1);}
function getBMICategory(b){if(!b)return{label:'--',color:'#aaa'};if(b<18.5)return{label:'Underweight',color:'#54a0ff'};if(b<25)return{label:'Normal',color:'#43d9ad'};if(b<30)return{label:'Overweight',color:'#ff9f43'};return{label:'Obese',color:'#ff6b6b'};}
function calcWaterGoal(w){const ml=Math.round(w*35);return{ml,cups:Math.round(ml/250)};}
