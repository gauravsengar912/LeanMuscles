// ============================================================
// Home Tab
// ============================================================

async function refreshHome() {
  updateGreeting();

  // Quote
  const quoteEl = document.getElementById('quote-text');
  if (quoteEl) quoteEl.textContent = `"${getDailyQuote()}"`;

  // BMI
  const bmi = calcBMI(STATE.profile);
  const bmiEl = document.getElementById('bmi-value');
  const bmiCat = document.getElementById('bmi-category');
  const bmiMarker = document.getElementById('bmi-marker');
  if (bmi) {
    if (bmiEl) bmiEl.textContent = bmi;
    const { label, color } = getBMICategory(bmi);
    if (bmiCat) { bmiCat.textContent = label; bmiCat.style.color = color; }
    // Position marker: 15 = left edge, 35 = right edge of scale
    const pct = Math.max(0, Math.min(100, ((bmi - 15) / 20) * 100));
    if (bmiMarker) bmiMarker.style.left = pct + '%';
  }

  // Water
  renderWaterTracker();

  // Macro rings from today's food log
  const today = getTodayDate();
  const log = STATE.foodLog[today] || {};
  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  Object.values(log).forEach(meal => meal.forEach(item => {
    totalProtein += item.protein || 0;
    totalCarbs += item.carbs || 0;
    totalFat += item.fat || 0;
  }));
  updateMacroRings(totalProtein, totalCarbs, totalFat);

  // Workout snapshot
  renderWorkoutSnapshot();

  // Diet snapshot
  renderDietSnapshot();

  // Biweekly review check
  const totalSessions = STATE.workoutLogs?.length || 0;
  if (totalSessions >= 7 && totalSessions % 14 < 2) {
    const reviewCard = document.getElementById('ai-review-card');
    if (reviewCard) {
      reviewCard.classList.remove('hidden');
      const reviewContent = document.getElementById('ai-review-content');
      if (reviewContent && !reviewContent.textContent) {
        reviewContent.textContent = 'Generating your biweekly review...';
        try {
          const review = await generateBiweeklyReview();
          reviewContent.textContent = review;
        } catch(e) {
          reviewContent.textContent = 'Review unavailable. Check your API connection.';
        }
      }
    }
  }

  setTimeout(() => triggerReveal(), 100);
}

function renderWorkoutSnapshot() {
  const plan = STATE.workoutPlan;
  const container = document.getElementById('workout-snapshot-content');
  if (!container) return;
  if (!plan?.days) { container.innerHTML = '<p class="muted-text">Generate a plan to see your workout</p>'; return; }

  const today = new Date().getDay(); // 0=Sun
  const dayIdx = Math.min(today === 0 ? 6 : today - 1, plan.days.length - 1);
  const day = plan.days[dayIdx];
  if (!day) { container.innerHTML = '<p class="muted-text">No workout today</p>'; return; }

  if (day.type === 'rest') {
    container.innerHTML = '<div style="text-align:center; padding:16px 0;"><div style="font-size:2rem;">😴</div><p>Rest Day</p></div>';
    return;
  }

  const exList = (day.exercises || []).slice(0, 4).map(ex =>
    `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem;">
      <span>${ex.name}</span>
      <span style="color:var(--text-muted)">${ex.sets}×${ex.reps}</span>
    </div>`
  ).join('');

  const more = (day.exercises?.length || 0) > 4 ? `<p class="muted-text" style="margin-top:8px; font-size:0.78rem;">+${day.exercises.length - 4} more exercises</p>` : '';

  container.innerHTML = `
    <div style="margin-bottom:10px;">
      <strong>${day.name}</strong>
      <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px;">${day.focus || ''}</span>
    </div>
    ${exList}
    ${more}
  `;
}

function renderDietSnapshot() {
  const plan = STATE.dietPlan;
  const container = document.getElementById('diet-snapshot-content');
  if (!container) return;
  if (!plan?.days) { container.innerHTML = '<p class="muted-text">Generate a plan to see your meals</p>'; return; }

  const today = new Date().getDay();
  const dayIdx = today === 0 ? 6 : today - 1;
  const day = plan.days[Math.min(dayIdx, plan.days.length - 1)];
  if (!day) return;

  const mealList = (day.meals || []).map(meal =>
    `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="font-size:0.85rem;">${getMealIcon(meal.name)} ${meal.name}</span>
      <span style="color:var(--text-muted); font-size:0.8rem;">${meal.total_calories || '--'} kcal</span>
    </div>`
  ).join('');

  container.innerHTML = `
    <div style="margin-bottom:10px;">
      <strong>${day.total_calories || '--'} kcal</strong>
      <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px;">${day.is_training ? '🏋️ Training Day' : '😴 Rest Day'}</span>
    </div>
    ${mealList}
  `;
}
