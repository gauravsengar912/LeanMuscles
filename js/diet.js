// ============================================================
// Diet Tab
// ============================================================

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function renderDietPlan() {
  const plan = STATE.dietPlan;
  if (!plan || !plan.days) {
    document.getElementById('diet-day-content').innerHTML = '<p class="muted-text center-text">No diet plan. Generate one in Profile.</p>';
    return;
  }

  // Day tabs
  const tabsContainer = document.getElementById('diet-day-tabs');
  tabsContainer.innerHTML = '';
  plan.days.forEach((day, i) => {
    const btn = document.createElement('button');
    btn.className = `day-tab${i === STATE.currentDietDay ? ' active' : ''}`;
    btn.innerHTML = `${day.day_name || `Day ${day.day}`}<br><small>${day.is_training ? '🏋️' : '😴'}</small>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#diet-day-tabs .day-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.currentDietDay = i;
      renderDietDay(i);
    });
    tabsContainer.appendChild(btn);
  });

  renderDietDay(STATE.currentDietDay);
  renderWeeklySwaps();
}

function renderDietDay(idx) {
  const plan = STATE.dietPlan;
  const day = plan?.days?.[idx];
  if (!day) return;

  const container = document.getElementById('diet-day-content');
  let html = '';

  // Rest day banner
  if (!day.is_training) {
    html += `
      <div class="rest-day-banner">
        <span>😴</span>
        <div>
          <strong>Rest Day</strong>
          <p>Lower carbs today: ${plan.macro_targets?.carbs_rest || '--'}g. Focus on protein and veggies.</p>
        </div>
      </div>`;
  }

  // Day summary
  html += `
    <div class="glass-card reveal" style="padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${day.day_name || 'Day ' + day.day}</strong>
          <p class="muted-text" style="font-size:0.8rem; margin-top: 4px;">${day.total_calories || '--'} kcal</p>
        </div>
        <div class="meal-macros-row">
          <span class="macro-pill p">P: ${day.macros?.protein || '--'}g</span>
          <span class="macro-pill c">C: ${day.macros?.carbs || '--'}g</span>
          <span class="macro-pill f">F: ${day.macros?.fat || '--'}g</span>
        </div>
      </div>
    </div>`;

  // Meals
  day.meals?.forEach((meal, mealIdx) => {
    html += `
      <div class="meal-accordion reveal">
        <div class="meal-accordion-header" onclick="toggleDietMeal(${idx}, ${mealIdx})">
          <div class="meal-name-wrap">
            <div class="meal-name">${getMealIcon(meal.name)} ${meal.name}</div>
            <div class="meal-calories">${meal.total_calories || '--'} kcal • ${meal.time || ''}</div>
          </div>
          <div class="meal-macros-row">
            <span class="macro-pill p">${meal.macros?.protein || '--'}g</span>
            <span class="macro-pill c">${meal.macros?.carbs || '--'}g</span>
            <span class="macro-pill f">${meal.macros?.fat || '--'}g</span>
          </div>
          <span style="margin-left:8px; color: var(--text-muted); font-size: 0.8rem; flex-shrink:0;">▼</span>
        </div>
        <div class="meal-accordion-body hidden" id="diet-meal-${idx}-${mealIdx}">
          ${meal.items?.map((item, itemIdx) => `
            <div class="meal-item">
              <div>
                <div class="meal-item-name">${item.name}</div>
                <div class="meal-item-portion">${item.portion || ''}</div>
              </div>
              <span class="meal-item-cals">${item.calories || '--'} kcal</span>
              <button class="log-meal-btn" onclick="logDietItem('${escHTML(item.name)}', ${item.calories || 0}, ${JSON.stringify(item.macros || {}).replace(/"/g, "'")}, '${getMealSlot(meal.name)}')">
                + Log
              </button>
            </div>
          `).join('') || '<p class="muted-text" style="padding: 8px 0">No items</p>'}
          <button class="btn-ghost" style="width:100%; margin-top:8px; font-size:0.8rem;" 
            onclick="logFullMeal(${idx}, ${mealIdx})">
            + Log Entire Meal
          </button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  setTimeout(() => triggerReveal(), 100);
}

function toggleDietMeal(dayIdx, mealIdx) {
  const body = document.getElementById(`diet-meal-${dayIdx}-${mealIdx}`);
  if (!body) return;
  body.classList.toggle('hidden');
}

function getMealIcon(name) {
  const n = name?.toLowerCase() || '';
  if (n.includes('breakfast')) return '🌅';
  if (n.includes('lunch')) return '☀️';
  if (n.includes('dinner')) return '🌙';
  if (n.includes('snack')) return '🍎';
  return '🍽️';
}

function getMealSlot(mealName) {
  const n = mealName?.toLowerCase() || '';
  if (n.includes('breakfast')) return 'breakfast';
  if (n.includes('lunch')) return 'lunch';
  if (n.includes('snack')) return 'snacks';
  if (n.includes('dinner')) return 'dinner';
  return 'snacks';
}

function logDietItem(name, calories, macros, slot) {
  const today = getTodayDate();
  if (!STATE.foodLog[today]) STATE.foodLog[today] = { breakfast: [], lunch: [], snacks: [], dinner: [] };

  STATE.foodLog[today][slot].push({
    id: Date.now().toString(),
    name,
    quantity: 100,
    unit: 'g',
    calories,
    protein: macros?.protein || 0,
    carbs: macros?.carbs || 0,
    fat: macros?.fat || 0,
  });

  saveLocalState();
  if (STATE.user) sbSaveFoodLog(STATE.user.id, today, STATE.foodLog[today]);
  showToast(`${name} logged to ${slot}!`, 'success');

  // Award points if nutrition goal hit
  checkNutritionGoal();
}

function logFullMeal(dayIdx, mealIdx) {
  const meal = STATE.dietPlan?.days?.[dayIdx]?.meals?.[mealIdx];
  if (!meal) return;
  const slot = getMealSlot(meal.name);
  meal.items?.forEach(item => {
    logDietItem(item.name, item.calories || 0, item.macros || {}, slot);
  });
  showToast(`Full ${meal.name} logged!`, 'success');
}

function checkNutritionGoal() {
  const today = getTodayDate();
  const log = STATE.foodLog[today];
  if (!log) return;
  let totalCals = 0;
  Object.values(log).forEach(meal => meal.forEach(item => totalCals += item.calories || 0));
  const target = calcTDEE(STATE.profile);
  if (totalCals >= target * 0.9 && totalCals <= target * 1.1) {
    // Within 10% of goal
    const todayKey = `goal_${today}`;
    if (!localStorage.getItem(todayKey)) {
      STATE.points += 20;
      localStorage.setItem(todayKey, '1');
      showToast('🎯 Nutrition goal hit! +20 points', 'success');
    }
  }
}

function renderWeeklySwaps() {
  const plan = STATE.dietPlan;
  const container = document.getElementById('swaps-body');
  if (!container || !plan?.weekly_swaps) return;

  container.innerHTML = plan.weekly_swaps.map(swap => `
    <div class="swap-item">
      <span class="swap-original">${swap.original}</span>
      <span class="swap-arrow">→</span>
      <div>
        <span class="swap-new">${swap.swap}</span>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${swap.reason}</div>
      </div>
    </div>
  `).join('');
}

// ---- Export Diet Plan ----
function exportDietPlan() {
  if (!STATE.dietPlan) { showToast('No diet plan to export', 'error'); return; }
  const wb = XLSX.utils.book_new();

  STATE.dietPlan.days?.forEach(day => {
    const rows = [['Meal', 'Item', 'Portion', 'Calories', 'Protein(g)', 'Carbs(g)', 'Fat(g)']];
    day.meals?.forEach(meal => {
      meal.items?.forEach(item => {
        rows.push([meal.name, item.name, item.portion || '', item.calories || 0,
          item.macros?.protein || 0, item.macros?.carbs || 0, item.macros?.fat || 0]);
      });
      rows.push(['', '', 'MEAL TOTAL', meal.total_calories || 0,
        meal.macros?.protein || 0, meal.macros?.carbs || 0, meal.macros?.fat || 0]);
      rows.push([]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, day.day_name || `Day ${day.day}`);
  });

  XLSX.writeFile(wb, 'FitAI_Diet_Plan.xlsx');
  showToast('Diet plan exported!', 'success');
}

async function regenDietPlan() {
  const notes = document.getElementById('regen-notes')?.value || '';
  if (!STATE.profile) return;
  showLoading('Regenerating diet plan...');
  try {
    const plan = await generateDietPlan({ ...STATE.profile, regen_notes: notes });
    STATE.dietPlan = plan;
    saveLocalState();
    await sbSavePlan(STATE.user.id, 'diet', plan);
    renderDietPlan();
    hideLoading();
    showToast('Diet plan updated!', 'success');
    switchTab('diet');
  } catch(e) {
    hideLoading();
    showToast('Failed: ' + e.message, 'error');
  }
}
