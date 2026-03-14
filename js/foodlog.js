// ============================================================
// Food Log
// ============================================================

const INDIAN_FOODS = [
  { name: 'Dal Tadka', calories: 116, protein: 6.8, carbs: 18.2, fat: 2.8, fiber: 4.1, per: '100g' },
  { name: 'Paneer (Cottage Cheese)', calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8, fiber: 0, per: '100g', gramsPerPiece: 30 },
  { name: 'Boiled White Rice', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, per: '100g' },
  { name: 'Brown Rice (Cooked)', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, fiber: 1.8, per: '100g' },
  { name: 'Chapati / Roti', calories: 297, protein: 7.9, carbs: 55.5, fat: 5.0, fiber: 2.7, per: '100g', gramsPerPiece: 30 },
  { name: 'Moong Dal', calories: 105, protein: 7.0, carbs: 17.5, fat: 0.8, fiber: 3.5, per: '100g' },
  { name: 'Chana Masala', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.1, per: '100g' },
  { name: 'Aloo Paratha', calories: 200, protein: 4.5, carbs: 32.0, fat: 7.0, fiber: 2.0, per: '100g', gramsPerPiece: 80 },
  { name: 'Dahi / Curd (Full Fat)', calories: 61, protein: 3.1, carbs: 4.7, fat: 3.3, fiber: 0, per: '100g' },
  { name: 'Dahi / Curd (Low Fat)', calories: 38, protein: 3.5, carbs: 5.1, fat: 0.4, fiber: 0, per: '100g' },
  { name: 'Egg (Boiled)', calories: 155, protein: 13.0, carbs: 1.1, fat: 10.6, fiber: 0, per: '100g', gramsPerPiece: 50 },
  { name: 'Egg White', calories: 52, protein: 10.9, carbs: 0.7, fat: 0.2, fiber: 0, per: '100g', gramsPerPiece: 33 },
  { name: 'Omelette (2 egg)', calories: 154, protein: 11.0, carbs: 1.0, fat: 11.5, fiber: 0, per: '100g', gramsPerPiece: 90 },
  { name: 'Chicken Breast (Cooked)', calories: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, per: '100g' },
  { name: 'Chicken Curry', calories: 175, protein: 18.0, carbs: 5.0, fat: 9.5, fiber: 1.2, per: '100g' },
  { name: 'Tandoori Chicken', calories: 150, protein: 24.0, carbs: 3.5, fat: 4.8, fiber: 0.5, per: '100g' },
  { name: 'Mutton Curry', calories: 210, protein: 22.0, carbs: 4.0, fat: 12.0, fiber: 0.8, per: '100g' },
  { name: 'Fish Curry', calories: 130, protein: 16.0, carbs: 5.0, fat: 5.5, fiber: 0.6, per: '100g' },
  { name: 'Rajma (Kidney Beans)', calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4, per: '100g' },
  { name: 'Chole (Chickpeas)', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, per: '100g' },
  { name: 'Idli', calories: 58, protein: 2.5, carbs: 11.5, fat: 0.3, fiber: 0.8, per: '100g', gramsPerPiece: 50 },
  { name: 'Dosa (Plain)', calories: 165, protein: 3.9, carbs: 29.5, fat: 3.7, fiber: 1.5, per: '100g', gramsPerPiece: 70 },
  { name: 'Sambar', calories: 45, protein: 2.5, carbs: 7.0, fat: 0.8, fiber: 2.1, per: '100g' },
  { name: 'Upma', calories: 163, protein: 4.2, carbs: 26.0, fat: 5.2, fiber: 2.3, per: '100g' },
  { name: 'Poha', calories: 130, protein: 3.0, carbs: 26.5, fat: 2.1, fiber: 1.5, per: '100g' },
  { name: 'Oats (Cooked)', calories: 71, protein: 2.5, carbs: 12.0, fat: 1.4, fiber: 1.7, per: '100g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6, per: '100g', gramsPerPiece: 120 },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4, per: '100g', gramsPerPiece: 150 },
  { name: 'Milk (Full Fat)', calories: 65, protein: 3.2, carbs: 4.8, fat: 3.9, fiber: 0, per: '100g' },
  { name: 'Milk (Toned)', calories: 44, protein: 3.1, carbs: 4.7, fat: 1.5, fiber: 0, per: '100g' },
  { name: 'Whey Protein (Scoop)', calories: 120, protein: 24.0, carbs: 3.0, fat: 2.0, fiber: 0, per: '100g', gramsPerPiece: 33 },
  { name: 'Almonds', calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, per: '100g', gramsPerPiece: 1 },
  { name: 'Peanut Butter', calories: 588, protein: 25.1, carbs: 20.1, fat: 50.4, fiber: 6.0, per: '100g' },
  { name: 'Greek Yogurt', calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, per: '100g' },
  { name: 'Moong Dal Chilla', calories: 120, protein: 8.0, carbs: 18.0, fat: 2.5, fiber: 3.0, per: '100g', gramsPerPiece: 60 },
  { name: 'Paneer Bhurji', calories: 225, protein: 14.0, carbs: 5.0, fat: 16.5, fiber: 1.2, per: '100g' },
  { name: 'Sprouts Salad', calories: 52, protein: 3.8, carbs: 9.2, fat: 0.5, fiber: 3.8, per: '100g' },
  { name: 'Sweet Potato (Boiled)', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, per: '100g' },
  { name: 'Palak Paneer', calories: 182, protein: 10.2, carbs: 7.5, fat: 12.8, fiber: 2.5, per: '100g' },
  { name: 'Butter Chicken', calories: 187, protein: 17.5, carbs: 8.0, fat: 9.5, fiber: 1.0, per: '100g' },
  { name: 'Biryani (Chicken)', calories: 190, protein: 12.0, carbs: 23.5, fat: 5.5, fiber: 1.2, per: '100g' },
  { name: 'Quinoa (Cooked)', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, per: '100g' },
  { name: 'Lemon Water', calories: 4, protein: 0.1, carbs: 1.0, fat: 0, fiber: 0.1, per: '100g' },
  { name: 'Coconut Water', calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, per: '100g' },
  { name: 'Masala Oats', calories: 148, protein: 5.5, carbs: 22.0, fat: 4.5, fiber: 3.2, per: '100g' },
  { name: 'Besan (Chickpea Flour)', calories: 387, protein: 22.4, carbs: 57.8, fat: 6.7, fiber: 10.8, per: '100g' },
  { name: 'Toor Dal', calories: 118, protein: 7.2, carbs: 20.4, fat: 0.7, fiber: 3.5, per: '100g' },
  { name: 'Masoor Dal', calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9, per: '100g' },
  { name: 'Urad Dal', calories: 105, protein: 7.6, carbs: 17.0, fat: 0.6, fiber: 3.8, per: '100g' },
  { name: 'Tofu', calories: 76, protein: 8.0, carbs: 1.9, fat: 4.8, fiber: 0.3, per: '100g' },
];

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', snacks: '🍎', dinner: '🌙' };

let selectedFoodItem = null;

function initFoodLog() {
  // Date navigation
  document.getElementById('fl-prev-day')?.addEventListener('click', () => {
    const d = new Date(STATE.currentFoodLogDate);
    d.setDate(d.getDate() - 1);
    STATE.currentFoodLogDate = d.toISOString().split('T')[0];
    renderFoodLog();
  });

  document.getElementById('fl-next-day')?.addEventListener('click', () => {
    const d = new Date(STATE.currentFoodLogDate);
    d.setDate(d.getDate() + 1);
    const today = getTodayDate();
    if (d.toISOString().split('T')[0] > today) return;
    STATE.currentFoodLogDate = d.toISOString().split('T')[0];
    renderFoodLog();
  });

  // Food search
  document.getElementById('food-search-btn')?.addEventListener('click', searchFood);
  document.getElementById('food-search-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchFood();
  });

  // Food quantity/unit change updates macros
  document.getElementById('food-qty')?.addEventListener('input', updateCalculatedMacros);
  document.getElementById('food-unit')?.addEventListener('change', updateCalculatedMacros);

  // Add food to log
  document.getElementById('add-food-btn')?.addEventListener('click', addSelectedFoodToLog);

  // Save template
  document.getElementById('save-template-btn')?.addEventListener('click', saveCurrentAsTemplate);

  // Export food log
  document.getElementById('export-foodlog-btn')?.addEventListener('click', exportFoodLog);
}

function renderFoodLog() {
  const date = STATE.currentFoodLogDate;
  const today = getTodayDate();

  // Date display
  document.getElementById('fl-date-display').textContent = formatDate(date);

  // Ensure log entry exists
  if (!STATE.foodLog[date]) STATE.foodLog[date] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  const log = STATE.foodLog[date];

  // Calculate totals
  let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  Object.values(log).forEach(meal => meal.forEach(item => {
    totalCals += item.calories || 0;
    totalProtein += item.protein || 0;
    totalCarbs += item.carbs || 0;
    totalFat += item.fat || 0;
  }));

  const budget = calcTDEE(STATE.profile);

  // Update calorie card
  animateCountUp(document.getElementById('fl-cals-logged'), Math.round(totalCals));
  document.getElementById('fl-cals-budget').textContent = budget;

  const budgetPct = Math.min((totalCals / budget) * 100, 100);
  const fillBar = document.getElementById('budget-fill-bar');
  fillBar.style.width = budgetPct + '%';
  fillBar.classList.toggle('over', totalCals > budget * 1.1);

  // Macro chips
  const chipsContainer = document.getElementById('fl-macro-chips');
  chipsContainer.innerHTML = `
    <span class="macro-pill p${totalProtein > (STATE.profile?.weight_kg * 2.2 || 160) ? ' warning' : ''}">P: ${Math.round(totalProtein)}g</span>
    <span class="macro-pill c">C: ${Math.round(totalCarbs)}g</span>
    <span class="macro-pill f">F: ${Math.round(totalFat)}g</span>
  `;

  // Render meal slots
  const slotsContainer = document.getElementById('meal-slots');
  slotsContainer.innerHTML = Object.entries(log).map(([slot, items]) => {
    const slotCals = items.reduce((s, i) => s + (i.calories || 0), 0);
    const slotProtein = items.reduce((s, i) => s + (i.protein || 0), 0);
    return `
      <div class="meal-slot reveal">
        <div class="meal-slot-header" onclick="toggleMealSlot('${slot}')">
          <span class="meal-slot-icon">${MEAL_ICONS[slot] || '🍽️'}</span>
          <span class="meal-slot-name">${slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
          <span style="font-size:0.75rem; color:var(--accent-purple); margin-right:8px;">${Math.round(slotProtein)}g protein</span>
          <span class="meal-slot-cals">${Math.round(slotCals)} kcal</span>
          <span style="color:var(--text-muted); font-size:0.8rem; margin-left:6px;">▼</span>
        </div>
        <div class="meal-slot-body" id="slot-${slot}">
          ${items.length === 0
            ? '<p class="muted-text" style="padding:8px 0; font-size:0.82rem;">No foods logged yet</p>'
            : items.map(item => `
              <div class="logged-food-item">
                <div style="flex:1;">
                  <div class="lfi-name">${item.name}</div>
                  <div class="lfi-qty">${item.quantity}${item.unit} · ${Math.round(item.protein || 0)}g P · ${Math.round(item.carbs || 0)}g C · ${Math.round(item.fat || 0)}g F</div>
                </div>
                <div class="lfi-cals">${Math.round(item.calories)} kcal</div>
                <button class="lfi-delete" onclick="deleteFoodItem('${slot}', '${item.id}')">🗑️</button>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Render templates
  renderTemplates();

  setTimeout(() => triggerReveal(), 100);

  // Also update home macro rings
  updateMacroRingsHome(totalProtein, totalCarbs, totalFat);
}

function toggleMealSlot(slot) {
  const body = document.getElementById(`slot-${slot}`);
  if (body) body.classList.toggle('hidden');
}

// ---- Food Search ----
async function searchFood() {
  const query = document.getElementById('food-search-input').value.trim();
  if (!query || query.length < 2) return;

  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = cacheGet(cacheKey);

  const resultsContainer = document.getElementById('food-search-results');
  resultsContainer.classList.remove('hidden');
  resultsContainer.innerHTML = '<div class="loading-spinner"></div>';

  let results = [];

  if (cached) {
    results = cached;
  } else {
    // 1. Local Indian database (instant)
    const localMatches = INDIAN_FOODS.filter(f =>
      f.name.toLowerCase().includes(query.toLowerCase())
    ).map(f => ({ ...f, source: 'local' }));
    results.push(...localMatches);

    // 2. OpenFoodFacts API (packaged foods)
    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,quantity`
      );
      const offData = await offRes.json();
      const offItems = (offData.products || [])
        .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
        .map(p => ({
          name: p.product_name,
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein: +(p.nutriments['proteins_100g'] || 0).toFixed(1),
          carbs: +(p.nutriments['carbohydrates_100g'] || 0).toFixed(1),
          fat: +(p.nutriments['fat_100g'] || 0).toFixed(1),
          fiber: +(p.nutriments['fiber_100g'] || 0).toFixed(1),
          per: '100g',
          source: 'api',
        }));
      results.push(...offItems);
    } catch (e) { /* silent */ }

    // 3. AI estimate as fallback if < 3 results
    if (results.length < 3) {
      try {
        const aiFood = await getAIFoodEstimate(query);
        if (aiFood) results.push({ ...aiFood, source: 'ai' });
      } catch (e) { /* silent */ }
    }

    cacheSet(cacheKey, results);
  }

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="muted-text" style="padding:12px 8px;">No results found. Try AI estimate by searching again.</p>';
    return;
  }

  const badgeLabels = { local: 'Indian DB', api: 'Product', ai: 'AI Est.' };
  const badgeClasses = { local: 'badge-local', api: 'badge-api', ai: 'badge-ai' };

  resultsContainer.innerHTML = results.slice(0, 15).map((f, i) => `
    <div class="food-result-item" onclick="selectFood(${i}, '${escFoodName(f.name)}')">
      <div style="flex:1;">
        <div class="food-result-name">${f.name}</div>
        <div class="food-result-meta">${f.calories} kcal · P:${f.protein}g C:${f.carbs}g F:${f.fat}g per ${f.per}</div>
      </div>
      <span class="food-result-badge ${badgeClasses[f.source] || 'badge-local'}">${badgeLabels[f.source] || 'DB'}</span>
      <span style="color:var(--text-muted); font-size:0.8rem;">+</span>
    </div>
  `).join('');

  // Store results for selection
  window._searchResults = results;
}

function escFoodName(name) {
  return name.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function selectFood(idx, name) {
  const food = window._searchResults?.[idx];
  if (!food) return;

  selectedFoodItem = food;

  document.getElementById('food-detail-name').textContent = food.name;
  document.getElementById('food-macros-preview').innerHTML = `
    <span class="food-macro-chip">🔥 ${food.calories} kcal</span>
    <span class="food-macro-chip">💪 ${food.protein}g P</span>
    <span class="food-macro-chip">🌾 ${food.carbs}g C</span>
    <span class="food-macro-chip">🥑 ${food.fat}g F</span>
  `;

  // Set unit options based on food properties
  const unitSelect = document.getElementById('food-unit');
  unitSelect.innerHTML = '<option value="g">grams (g)</option>';
  if (food.gramsPerPiece) unitSelect.innerHTML += '<option value="piece">piece</option>';
  unitSelect.innerHTML += '<option value="ml">ml</option>';

  document.getElementById('food-qty').value = 100;
  updateCalculatedMacros();
  $('food-detail-modal').style.display='flex';
  document.getElementById('food-search-results').classList.add('hidden');
}

function updateCalculatedMacros() {
  if (!selectedFoodItem) return;
  const qty = parseFloat(document.getElementById('food-qty').value) || 100;
  const unit = document.getElementById('food-unit').value;

  let grams = qty;
  if (unit === 'piece' && selectedFoodItem.gramsPerPiece) {
    grams = qty * selectedFoodItem.gramsPerPiece;
  } else if (unit === 'ml') {
    grams = qty * (selectedFoodItem.density || 1);
  }

  const ratio = grams / 100;
  const cals = Math.round(selectedFoodItem.calories * ratio);
  const protein = +(selectedFoodItem.protein * ratio).toFixed(1);
  const carbs = +(selectedFoodItem.carbs * ratio).toFixed(1);
  const fat = +(selectedFoodItem.fat * ratio).toFixed(1);

  document.getElementById('food-calculated-macros').innerHTML = `
    <span>🔥 <strong>${cals}</strong> kcal</span>
    <span>💪 <strong>${protein}g</strong> protein</span>
    <span>🌾 <strong>${carbs}g</strong> carbs</span>
    <span>🥑 <strong>${fat}g</strong> fat</span>
  `;
  window._calculatedNutrition = { cals, protein, carbs, fat, grams };
}

function addSelectedFoodToLog() {
  if (!selectedFoodItem || !window._calculatedNutrition) return;

  const slot = document.getElementById('search-meal-target').value;
  const date = STATE.currentFoodLogDate;
  const qty = parseFloat(document.getElementById('food-qty').value) || 100;
  const unit = document.getElementById('food-unit').value;
  const { cals, protein, carbs, fat } = window._calculatedNutrition;

  if (!STATE.foodLog[date]) STATE.foodLog[date] = { breakfast: [], lunch: [], snacks: [], dinner: [] };

  STATE.foodLog[date][slot].push({
    id: Date.now().toString(),
    name: selectedFoodItem.name,
    quantity: qty,
    unit,
    calories: cals,
    protein,
    carbs,
    fat,
  });

  saveLocalState();
  if (STATE.user) sbSaveFoodLog(STATE.user.id, date, STATE.foodLog[date]);

  $('food-detail-modal').style.display='none';
  document.getElementById('food-search-input').value = '';
  selectedFoodItem = null;
  renderFoodLog();
  showToast(`${selectedFoodItem?.name || 'Food'} added to ${slot}!`, 'success');

  // Points
  STATE.points += 5;
  checkNutritionGoal();
}

function deleteFoodItem(slot, itemId) {
  const date = STATE.currentFoodLogDate;
  if (!STATE.foodLog[date]?.[slot]) return;
  STATE.foodLog[date][slot] = STATE.foodLog[date][slot].filter(i => i.id !== itemId);
  saveLocalState();
  if (STATE.user) sbSaveFoodLog(STATE.user.id, date, STATE.foodLog[date]);
  renderFoodLog();
}

// ---- Macro Rings (home page) ----
function updateMacroRingsHomeHome(protein, carbs, fat) {
  const profile = STATE.profile;
  const tdee = calcTDEE(profile);
  const proteinTarget = (profile?.weight_kg || 70) * 2;
  const carbsTarget = (tdee * 0.45) / 4;
  const fatTarget = (tdee * 0.25) / 9;

  const CIRCUMFERENCE = 201;

  const setRing = (id, valId, current, target) => {
    const ring = document.getElementById(id);
    const val = document.getElementById(valId);
    if (ring) {
      const pct = Math.min(current / target, 1);
      ring.style.strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * pct);
    }
    if (val) val.textContent = Math.round(current);
  };

  setRing('protein-ring', 'protein-val', protein, proteinTarget);
  setRing('carbs-ring', 'carbs-val', carbs, carbsTarget);
  setRing('fat-ring', 'fat-val', fat, fatTarget);

  const totalCals = protein * 4 + carbs * 4 + fat * 9;
  document.getElementById('home-cals-logged').textContent = Math.round(totalCals);
  document.getElementById('home-cals-target').textContent = Math.round(tdee);
}

// ---- Water Tracker ----
function initWaterTracker() {
  renderWater();
}

function renderWater() {
  const profile = STATE.profile;
  const weight = profile?.weight_kg || 70;
  const { ml, cups } = calcWaterGoal(weight);
  const todayWater = getTodayWater();

  document.getElementById('water-goal-display').textContent = (ml / 1000).toFixed(1) + 'L';
  document.getElementById('water-cups-logged').textContent = todayWater.cups;
  document.getElementById('water-cups-total').textContent = cups;

  const pct = Math.min((todayWater.cups / cups) * 100, 100);
  document.getElementById('water-fill-bar').style.width = pct + '%';

  const grid = document.getElementById('cups-grid');
  grid.innerHTML = '';
  for (let i = 0; i < cups; i++) {
    const btn = document.createElement('button');
    btn.className = `cup-btn${i < todayWater.cups ? ' filled' : ''}`;
    btn.textContent = '💧';
    btn.addEventListener('click', () => toggleCup(i, cups));
    grid.appendChild(btn);
  }
}

function toggleCup(idx, total) {
  const today = getTodayDate();
  if (!STATE.water[today]) STATE.water[today] = { cups: 0 };
  // If clicking a filled cup that's the last filled one, unfill it
  if (idx < STATE.water[today].cups) {
    STATE.water[today].cups = idx;
  } else {
    STATE.water[today].cups = idx + 1;
  }
  saveLocalState();
  renderWater();
}

// ---- Meal Templates ----
function renderTemplates() {
  const container = document.getElementById('templates-list');
  if (!container) return;
  const templates = STATE.templates || [];
  if (!templates.length) {
    container.innerHTML = '<p class="muted-text" style="font-size:0.82rem; padding: 4px 0;">No templates saved yet</p>';
    return;
  }
  container.innerHTML = templates.map(t => `
    <div class="template-item">
      <div class="template-name">${t.name}</div>
      <div class="template-cals">${t.totalCals || '--'} kcal</div>
      <button class="template-load-btn" onclick="loadTemplate('${t.id}')">Load</button>
      <button class="template-del-btn" onclick="deleteTemplate('${t.id}')">✕</button>
    </div>
  `).join('');
}

async function saveCurrentAsTemplate() {
  if (STATE.templates?.length >= 8) {
    showToast('Max 8 templates. Delete one first.', 'error');
    return;
  }
  const name = prompt('Template name (e.g. "Bulk Day"):');
  if (!name?.trim()) return;

  const date = STATE.currentFoodLogDate;
  const log = STATE.foodLog[date] || {};
  let totalCals = 0;
  Object.values(log).forEach(m => m.forEach(i => totalCals += i.calories || 0));

  const template = {
    id: Date.now().toString(),
    name: name.trim(),
    totalCals: Math.round(totalCals),
    template_data: log,
  };

  if (!STATE.templates) STATE.templates = [];
  STATE.templates.unshift(template);

  if (STATE.user) {
    await sbSaveTemplate(STATE.user.id, template.name, { ...template.template_data, totalCals: template.totalCals });
  }

  renderTemplates();
  showToast('Template saved!', 'success');
}

function loadTemplate(templateId) {
  const template = STATE.templates?.find(t => t.id === templateId);
  if (!template) return;
  const date = STATE.currentFoodLogDate;
  STATE.foodLog[date] = JSON.parse(JSON.stringify(template.template_data));
  // Re-stamp IDs
  Object.values(STATE.foodLog[date]).forEach(meal => {
    meal.forEach(item => item.id = Date.now().toString() + Math.random());
  });
  saveLocalState();
  if (STATE.user) sbSaveFoodLog(STATE.user.id, date, STATE.foodLog[date]);
  renderFoodLog();
  showToast('Template loaded!', 'success');
}

async function deleteTemplate(templateId) {
  STATE.templates = STATE.templates?.filter(t => t.id !== templateId) || [];
  if (STATE.user) await sbDeleteTemplate(templateId);
  renderTemplates();
  showToast('Template deleted', 'info');
}

// ---- Export ----
function exportFoodLog() {
  const wb = XLSX.utils.book_new();
  const rows = [['Date', 'Meal', 'Food', 'Quantity', 'Unit', 'Calories', 'Protein(g)', 'Carbs(g)', 'Fat(g)']];

  Object.entries(STATE.foodLog).sort().forEach(([date, log]) => {
    Object.entries(log).forEach(([slot, items]) => {
      items.forEach(item => {
        rows.push([date, slot, item.name, item.quantity, item.unit,
          Math.round(item.calories), item.protein, item.carbs, item.fat]);
      });
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Food Log');
  XLSX.writeFile(wb, 'FitAI_Food_Log.xlsx');
  showToast('Food log exported!', 'success');
}
