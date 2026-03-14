// ============================================================
// Workout Tab
// ============================================================

function renderWorkoutPlan() {
  const plan = STATE.workoutPlan;
  if (!plan || !plan.days) {
    document.getElementById('workout-day-content').innerHTML = '<p class="muted-text center-text">No workout plan. Generate one in Profile.</p>';
    return;
  }

  // Build day tabs
  const tabsContainer = document.getElementById('workout-day-tabs');
  tabsContainer.innerHTML = '';
  plan.days.forEach((day, i) => {
    const btn = document.createElement('button');
    btn.className = `day-tab${i === STATE.currentWorkoutDay ? ' active' : ''}`;
    const isCompleted = STATE.workoutCompleted[getDayDateForIndex(i)];
    if (isCompleted) btn.classList.add('completed');
    btn.innerHTML = `Day ${day.day}<br><small>${day.name}</small>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#workout-day-tabs .day-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.currentWorkoutDay = i;
      renderWorkoutDay(i);
    });
    tabsContainer.appendChild(btn);
  });

  renderWorkoutDay(STATE.currentWorkoutDay);
  renderVolumeChart();
}

function renderWorkoutDay(idx) {
  const plan = STATE.workoutPlan;
  if (!plan || !plan.days) return;
  const day = plan.days[idx];
  if (!day) return;

  const container = document.getElementById('workout-day-content');

  if (day.type === 'rest') {
    container.innerHTML = `
      <div class="glass-card reveal">
        <div style="text-align:center; padding: 40px 20px;">
          <div style="font-size:4rem; margin-bottom: 16px;">😴</div>
          <h3>${day.name}</h3>
          <p class="muted-text" style="margin-top: 8px;">Rest and recover. Sleep is where gains happen.</p>
        </div>
      </div>`;
    setTimeout(() => triggerReveal(), 100);
    return;
  }

  let html = `
    <div class="workout-day-header">
      <h3>${day.name}</h3>
      <p>Focus: ${day.focus || ''}</p>
    </div>`;

  if (day.warmup) {
    html += `<div class="warmup-card">🔥 <strong>Warmup:</strong> ${day.warmup}</div>`;
  }

  if (day.deload_note) {
    html += `<div class="deload-card">⚡ <strong>Deload Week:</strong> ${day.deload_note}</div>`;
  }

  day.exercises?.forEach((ex, exIdx) => {
    const setsDisplay = Array.from({ length: ex.sets }, (_, s) =>
      `<span class="set-pill">Set ${s + 1}: ${ex.reps}</span>`
    ).join('');

    html += `
      <div class="exercise-card reveal" id="ex-${idx}-${exIdx}">
        <div class="exercise-header">
          <div>
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-muscle">${ex.muscle || ''}</div>
          </div>
          <div class="exercise-actions">
            <button class="sub-btn" title="Substitutions" onclick="showSubstitutions('${escHTML(ex.name)}', ${idx}, ${exIdx})">🔄</button>
            <button class="timer-btn" title="Rest Timer" onclick="openRestTimer(${ex.rest_seconds || 120})">⏱️</button>
          </div>
        </div>
        <div class="exercise-sets-row">${setsDisplay}</div>
        <div class="exercise-meta">
          <span class="meta-chip">📊 ${ex.sets} sets × ${ex.reps} reps</span>
          ${ex.rir !== undefined ? `<span class="meta-chip">🎯 RIR: ${ex.rir}</span>` : ''}
          ${ex.tempo ? `<span class="meta-chip">🕐 Tempo: ${ex.tempo}</span>` : ''}
          ${ex.rest_seconds ? `<span class="meta-chip">😴 Rest: ${formatTime(ex.rest_seconds)}</span>` : ''}
        </div>
        ${ex.notes ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">💡 ${ex.notes}</p>` : ''}
        ${ex.youtube_id ? `
          <div class="exercise-video">
            <iframe src="https://www.youtube.com/embed/${ex.youtube_id}?rel=0&modestbranding=1" allowfullscreen loading="lazy"></iframe>
          </div>` : ''}
      </div>`;
  });

  const dateKey = getDayDateForIndex(idx);
  const isCompleted = STATE.workoutCompleted[dateKey];

  html += `
    <button class="complete-workout-btn ${isCompleted ? 'completed' : ''}" onclick="markWorkoutComplete(${idx})">
      ${isCompleted ? '✅ Workout Completed!' : '🎯 Mark Workout Complete'}
    </button>`;

  container.innerHTML = html;
  setTimeout(() => triggerReveal(), 100);
}

function getDayDateForIndex(idx) {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const d = new Date(today);
  d.setDate(d.getDate() - currentDayOfWeek + idx);
  return d.toISOString().split('T')[0];
}

async function markWorkoutComplete(idx) {
  const dateKey = getDayDateForIndex(idx);
  if (STATE.workoutCompleted[dateKey]) {
    showToast('Already completed!', 'info');
    return;
  }

  STATE.workoutCompleted[dateKey] = `day_${idx}`;
  STATE.totalWorkoutDays++;
  STATE.points += 30;

  // Award points & update profile
  if (STATE.user) {
    await sbLogWorkout(STATE.user.id, dateKey, `day_${idx}`);
    await sbUpsertProfile({
      id: STATE.user.id,
      points: STATE.points,
      total_workout_days: STATE.totalWorkoutDays,
      updated_at: new Date().toISOString()
    });
  }

  saveLocalState();

  // Re-render day
  renderWorkoutDay(idx);
  renderWorkoutPlan(); // update tab indicator

  // Show celebration
  $('celebration-modal').style.display='flex';
  document.getElementById('celebration-emoji').textContent = '🎉';
  document.getElementById('celebration-title').textContent = 'Workout Complete!';
  document.getElementById('celebration-msg').textContent = `Amazing! +30 points. Keep it up! 💪`;
  launchConfetti(document.getElementById('confetti-container'));
}

function renderVolumeChart() {
  const plan = STATE.workoutPlan;
  if (!plan?.weekly_volume) return;
  const container = document.getElementById('volume-bars');
  if (!container) return;
  const maxVol = Math.max(...Object.values(plan.weekly_volume));
  container.innerHTML = Object.entries(plan.weekly_volume).map(([muscle, sets]) => `
    <div class="volume-bar-row">
      <div class="volume-muscle">${muscle}</div>
      <div class="volume-bar-track">
        <div class="volume-bar-fill" style="width: ${(sets/maxVol*100)}%"></div>
      </div>
      <div class="volume-count">${sets}</div>
    </div>
  `).join('');
}

// ---- Substitutions ----
async function showSubstitutions(exerciseName, dayIdx, exIdx) {
  document.getElementById('sub-for-text').textContent = `Alternatives for: ${exerciseName}`;
  document.getElementById('sub-list').innerHTML = '<div class="loading-spinner"></div>';
  $('sub-modal').style.display='flex';

  try {
    const subs = await getExerciseSubstitutions(exerciseName, STATE.profile);
    document.getElementById('sub-list').innerHTML = subs.map((s, i) => `
      <div class="sub-item" onclick="applySubstitution(${dayIdx}, ${exIdx}, '${escHTML(s.name)}', '${escHTML(s.muscle)}')">
        <div>
          <div class="sub-item-name">${s.name}</div>
          <div class="sub-item-reason">${s.muscle} — ${s.reason}</div>
        </div>
        <span class="apply-sub-btn">Apply →</span>
      </div>
    `).join('');
  } catch(e) {
    document.getElementById('sub-list').innerHTML = '<p class="muted-text">Failed to load. Try again.</p>';
  }
}

function applySubstitution(dayIdx, exIdx, name, muscle) {
  if (!STATE.workoutPlan?.days?.[dayIdx]?.exercises?.[exIdx]) return;
  STATE.workoutPlan.days[dayIdx].exercises[exIdx].name = name;
  STATE.workoutPlan.days[dayIdx].exercises[exIdx].muscle = muscle;
  STATE.workoutPlan.days[dayIdx].exercises[exIdx].youtube_id = '';
  $('sub-modal').style.display='none';
  renderWorkoutDay(dayIdx);
  saveLocalState();
  sbSavePlan(STATE.user?.id, 'workout', STATE.workoutPlan);
  showToast(`Substituted with ${name}`, 'success');
}

// ---- Rest Timer ----
let timerInterval = null;
let timerTotal = 120;
let timerRemaining = 120;
let timerRunning = false;
const TIMER_CIRCUMFERENCE = 327; // 2πr for r=52

function openRestTimer(seconds = 120) {
  setTimer(seconds);
  document.getElementById('rest-timer-overlay').classList.remove('hidden');
  startTimer();
}

function setTimer(seconds) {
  clearInterval(timerInterval);
  timerRunning = false;
  timerTotal = seconds;
  timerRemaining = seconds;
  updateTimerDisplay();
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.onclick?.toString().match(/\d+/)?.[0]) === seconds);
  });
  if (document.getElementById('timer-pause-btn')) {
    document.getElementById('timer-pause-btn').textContent = '▶ Start';
  }
}

function startTimer() {
  timerRunning = true;
  document.getElementById('timer-pause-btn').textContent = '⏸ Pause';
  timerInterval = setInterval(() => {
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-pause-btn').textContent = '▶ Restart';
      new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA').play().catch(()=>{});
      showToast('Rest done! 💪 Back to work!', 'success');
      return;
    }
    timerRemaining--;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent = formatTime(timerRemaining);
  const progress = timerRemaining / timerTotal;
  const offset = TIMER_CIRCUMFERENCE * progress;
  document.getElementById('timer-ring-fill').style.strokeDashoffset = TIMER_CIRCUMFERENCE - offset;
}

function initRestTimer() {
  document.getElementById('timer-pause-btn')?.addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-pause-btn').textContent = '▶ Resume';
    } else {
      if (timerRemaining <= 0) setTimer(timerTotal);
      startTimer();
    }
  });

  document.getElementById('timer-reset-btn')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerTotal;
    updateTimerDisplay();
    document.getElementById('timer-pause-btn').textContent = '▶ Start';
  });

  document.getElementById('timer-close-btn')?.addEventListener('click', () => {
    clearInterval(timerInterval);
    document.getElementById('rest-timer-overlay').classList.add('hidden');
  });
}

// ---- Regenerate ----
async function regenWorkoutPlan() {
  const notes = document.getElementById('regen-notes')?.value || '';
  if (!STATE.profile) return;
  showLoading('Regenerating workout plan...');
  try {
    const plan = await generateWorkoutPlan({ ...STATE.profile, regen_notes: notes });
    STATE.workoutPlan = plan;
    saveLocalState();
    await sbSavePlan(STATE.user.id, 'workout', plan);
    renderWorkoutPlan();
    hideLoading();
    showToast('Workout plan updated!', 'success');
    switchTab('workout');
  } catch(e) {
    hideLoading();
    showToast('Failed: ' + e.message, 'error');
  }
}

function escHTML(str) {
  return str?.replace(/'/g, "\\'").replace(/"/g, '&quot;') || '';
}
