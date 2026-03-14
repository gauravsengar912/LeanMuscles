// Onboarding - works with new index.html structure
let _obSlide = 1;

function showOnboarding() {
  const ob = $('onboarding');
  ob.style.display = 'flex';
  ob.innerHTML = buildOnboardingHTML();
  wireOnboarding();
  showObSlide(1);
}

function buildOnboardingHTML() {
  return `
    <div id="ob-slides" style="flex:1;overflow:hidden;position:relative;">
      <!-- Slide 1 -->
      <div class="ob-slide" id="obs1" style="position:absolute;inset:0;padding:24px 24px 0;overflow-y:auto;display:none;">
        <div style="text-align:center;margin-bottom:22px;"><span style="font-size:2.8rem;display:block;margin-bottom:10px;">👤</span><h2 style="font-family:'Space Grotesk',sans-serif;">Personal Info</h2><p style="color:rgba(255,255,255,0.5);font-size:0.86rem;margin-top:4px;">Let's get to know you</p></div>
        <div style="display:flex;gap:11px;">
          ${mkField('Age','ob-age','number','25')}
          ${mkSelect('Gender','ob-gender',[['male','Male'],['female','Female'],['other','Other']])}
        </div>
        <div style="display:flex;gap:11px;">
          ${mkField('Height (cm)','ob-height','number','175')}
          ${mkField('Weight (kg)','ob-weight','number','70')}
        </div>
        ${mkSelect('Activity Level','ob-activity',[['sedentary','Sedentary (desk job)'],['light','Lightly Active (1-3 days)'],['moderate','Moderately Active (3-5 days)'],['active','Very Active (6-7 days)'],['athlete','Athlete (2x/day)']],2)}
      </div>
      <!-- Slide 2 -->
      <div class="ob-slide" id="obs2" style="position:absolute;inset:0;padding:24px 24px 0;overflow-y:auto;display:none;">
        <div style="text-align:center;margin-bottom:20px;"><span style="font-size:2.8rem;display:block;margin-bottom:10px;">🎯</span><h2 style="font-family:'Space Grotesk',sans-serif;">Your Goals</h2><p style="color:rgba(255,255,255,0.5);font-size:0.86rem;margin-top:4px;">What are you training for?</p></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:14px;">
          ${[['fat_loss','🔥','Fat Loss'],['muscle_gain','💪','Muscle Gain'],['recomp','⚖️','Body Recomp'],['strength','🏋️','Strength'],['endurance','🏃','Endurance'],['health','❤️','Health']].map(([g,ic,lb])=>`<button class="goal-card" data-goal="${g}" onclick="selectGoal('${g}')" style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:13px 8px;background:rgba(255,255,255,0.05);border:2px solid rgba(255,255,255,0.09);border-radius:14px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.77rem;color:rgba(255,255,255,0.55);transition:all 0.25s;"><span style="font-size:1.4rem;">${ic}</span>${lb}</button>`).join('')}
        </div>
        ${mkSelect('Diet Preference','ob-diet',[['non_veg','Non-Vegetarian'],['veg','Vegetarian'],['vegan','Vegan'],['eggetarian','Eggetarian']])}
      </div>
      <!-- Slide 3 -->
      <div class="ob-slide" id="obs3" style="position:absolute;inset:0;padding:24px 24px 0;overflow-y:auto;display:none;">
        <div style="text-align:center;margin-bottom:20px;"><span style="font-size:2.8rem;display:block;margin-bottom:10px;">📅</span><h2 style="font-family:'Space Grotesk',sans-serif;">Training Schedule</h2><p style="color:rgba(255,255,255,0.5);font-size:0.86rem;margin-top:4px;">How many days per week?</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;" id="days-row">
          ${[3,4,5,6].map(d=>`<button class="day-chip${d===4?' sel':''}" data-d="${d}" onclick="selectDays(${d})" style="flex:1;min-width:64px;padding:11px 8px;background:${d===4?'rgba(108,99,255,0.14)':'rgba(255,255,255,0.05)'};border:2px solid ${d===4?'#6c63ff':'rgba(255,255,255,0.09)'};border-radius:12px;color:${d===4?'#a29bfe':'rgba(255,255,255,0.55)'};font-family:'DM Sans',sans-serif;font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.25s;text-align:center;">${d} Days</button>`).join('')}
        </div>
        ${mkSelect('Training Split','ob-split',[['ppl','Push/Pull/Legs'],['upper_lower','Upper/Lower'],['full_body','Full Body'],['bro_split','Arnold Split']])}
        ${mkSelect('Experience Level','ob-experience',[['beginner','Beginner (<1 year)'],['intermediate','Intermediate (1-3 yrs)'],['advanced','Advanced (3+ yrs)']],1)}
        ${mkSelect('Equipment','ob-equipment',[['full_gym','Full Gym'],['home_dumbbells','Home + Dumbbells'],['home_only','Home Only'],['barbell','Barbell + Rack']])}
      </div>
      <!-- Slide 4 -->
      <div class="ob-slide" id="obs4" style="position:absolute;inset:0;padding:24px 24px 0;overflow-y:auto;display:none;">
        <div style="text-align:center;margin-bottom:20px;"><span style="font-size:2.8rem;display:block;margin-bottom:10px;">🤖</span><h2 style="font-family:'Space Grotesk',sans-serif;">AI Plan Generation</h2><p style="color:rgba(255,255,255,0.5);font-size:0.86rem;margin-top:4px;">Ready to create your personalized plan</p></div>
        <div style="display:flex;flex-direction:column;gap:9px;margin-bottom:16px;">
          ${[['🏋️','Workout Plan','Evidence-based, periodized training'],['🥗','Diet Plan','Indian cuisine, carb periodized'],['📊','Progress Tracking','AI-powered biweekly analysis']].map(([ic,t,d])=>`<div style="display:flex;align-items:center;gap:13px;padding:13px 14px;background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.09);border-radius:16px;"><span style="font-size:1.4rem;">${ic}</span><div><strong style="display:block;font-size:0.88rem;">${t}</strong><p style="font-size:0.77rem;color:rgba(255,255,255,0.45);margin-top:2px;">${d}</p></div></div>`).join('')}
        </div>
        <div>
          <label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Special Notes / Injuries (optional)</label>
          <textarea id="ob-notes" placeholder="e.g. knee injury, no barbell squats..." style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:12px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;resize:vertical;min-height:72px;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'"></textarea>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.08);background:#07070d;padding-bottom:max(16px,env(safe-area-inset-bottom));">
      <div style="display:flex;gap:5px;" id="ob-dots">
        <span style="width:6px;height:6px;border-radius:3px;background:#6c63ff;width:18px;transition:all 0.3s;"></span>
        <span style="width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,0.18);transition:all 0.3s;"></span>
        <span style="width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,0.18);transition:all 0.3s;"></span>
        <span style="width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,0.18);transition:all 0.3s;"></span>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ob-back" onclick="obBack()" style="visibility:hidden;padding:10px 18px;background:none;border:none;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:0.9rem;cursor:pointer;border-radius:11px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">Back</button>
        <button id="ob-next" onclick="obNext()" style="padding:11px 22px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:12px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;box-shadow:0 3px 14px rgba(108,99,255,0.35);">Next →</button>
      </div>
    </div>
  `;
}

function mkField(lbl, id, type, ph) {
  return `<div style="flex:1;margin-bottom:11px;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${lbl}</label><input id="${id}" type="${type}" placeholder="${ph}" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;" onfocus="this.style.borderColor='#6c63ff';this.style.boxShadow='0 0 0 3px rgba(108,99,255,0.16)'" onblur="this.style.borderColor='rgba(255,255,255,0.09)';this.style.boxShadow='none'"></div>`;
}

function mkSelect(lbl, id, opts, selIdx) {
  selIdx = selIdx || 0;
  return `<div style="margin-bottom:11px;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${lbl}</label><select id="${id}" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;cursor:pointer;appearance:none;">${opts.map((o,i)=>`<option value="${o[0]}"${i===selIdx?' selected':''}>${o[1]}</option>`).join('')}</select></div>`;
}

function wireOnboarding() {
  STATE.selectedGoal = 'muscle_gain';
  STATE.selectedTrainingDays = 4;
  // Pre-select muscle_gain
  setTimeout(() => { selectGoal('muscle_gain'); }, 50);
}

function showObSlide(n) {
  _obSlide = n;
  for (let i = 1; i <= 4; i++) {
    const s = $(`obs${i}`);
    if (s) s.style.display = i === n ? 'block' : 'none';
  }
  // Dots
  const dots = $('ob-dots')?.children;
  if (dots) {
    Array.from(dots).forEach((d, i) => {
      d.style.background = i < n ? '#6c63ff' : 'rgba(255,255,255,0.18)';
      d.style.width = i === n - 1 ? '18px' : '6px';
    });
  }
  const back = $('ob-back');
  if (back) back.style.visibility = n === 1 ? 'hidden' : 'visible';
  const next = $('ob-next');
  if (next) next.textContent = n === 4 ? '🚀 Generate Plan' : 'Next →';
}

function selectGoal(g) {
  STATE.selectedGoal = g;
  document.querySelectorAll('.goal-card').forEach(c => {
    const isThis = c.dataset.goal === g;
    c.style.background = isThis ? 'rgba(108,99,255,0.14)' : 'rgba(255,255,255,0.05)';
    c.style.borderColor = isThis ? '#6c63ff' : 'rgba(255,255,255,0.09)';
    c.style.color = isThis ? '#a29bfe' : 'rgba(255,255,255,0.55)';
    c.style.transform = isThis ? 'scale(1.03)' : '';
  });
}

function selectDays(d) {
  STATE.selectedTrainingDays = d;
  document.querySelectorAll('.day-chip').forEach(b => {
    const isThis = parseInt(b.dataset.d) === d;
    b.style.background = isThis ? 'rgba(108,99,255,0.14)' : 'rgba(255,255,255,0.05)';
    b.style.borderColor = isThis ? '#6c63ff' : 'rgba(255,255,255,0.09)';
    b.style.color = isThis ? '#a29bfe' : 'rgba(255,255,255,0.55)';
  });
}

function obBack() { if (_obSlide > 1) showObSlide(_obSlide - 1); }

async function obNext() {
  if (!validateObSlide(_obSlide)) return;
  if (_obSlide < 4) { showObSlide(_obSlide + 1); return; }
  // Generate!
  const data = gatherObData();
  if (!data) return;
  showLoading('Generating your AI-powered plan...');
  try {
    const profile = {
      id: STATE.user.id,
      username: STATE.user.user_metadata?.username || STATE.user.email.split('@')[0],
      email: STATE.user.email,
      age: data.age, gender: data.gender, height_cm: data.height, weight_kg: data.weight,
      activity_level: data.activity, goal: data.goal, diet_preference: data.diet,
      training_days: data.trainingDays, split: data.split, experience: data.experience,
      equipment: data.equipment, notes: data.notes, is_onboarded: true,
      streak: 0, longest_streak: 0, total_workout_days: 0, points: 0,
      updated_at: new Date().toISOString()
    };
    await getSB().from('profiles').upsert(profile, { onConflict: 'id' });
    STATE.profile = profile;
    const [workout, diet] = await Promise.all([
      generateWorkoutPlan(profile),
      generateDietPlan(profile),
    ]);
    STATE.workoutPlan = workout;
    STATE.dietPlan = diet;
    saveLocal();
    await Promise.all([
      getSB().from('plans').upsert({ user_id: STATE.user.id, type: 'workout', plan_data: workout, updated_at: new Date().toISOString() }, { onConflict: 'user_id,type' }),
      getSB().from('plans').upsert({ user_id: STATE.user.id, type: 'diet', plan_data: diet, updated_at: new Date().toISOString() }, { onConflict: 'user_id,type' }),
    ]);
    hideLoading();
    $('onboarding').style.display = 'none';
    await bootMainApp();
    showToast('🎉 Your personalized plan is ready!', 'success');
  } catch (e) {
    hideLoading();
    showToast('Error: ' + e.message, 'error');
    console.error(e);
  }
}

function validateObSlide(n) {
  if (n === 1) {
    const age = $('ob-age')?.value, h = $('ob-height')?.value, w = $('ob-weight')?.value;
    if (!age || !h || !w) { showToast('Please fill all fields', 'error'); return false; }
  }
  if (n === 2 && !STATE.selectedGoal) { showToast('Select a goal', 'error'); return false; }
  return true;
}

function gatherObData() {
  return {
    age: parseInt($('ob-age')?.value),
    gender: $('ob-gender')?.value,
    height: parseFloat($('ob-height')?.value),
    weight: parseFloat($('ob-weight')?.value),
    activity: $('ob-activity')?.value,
    goal: STATE.selectedGoal || 'muscle_gain',
    diet: $('ob-diet')?.value,
    trainingDays: STATE.selectedTrainingDays || 4,
    split: $('ob-split')?.value,
    experience: $('ob-experience')?.value,
    equipment: $('ob-equipment')?.value,
    notes: $('ob-notes')?.value || '',
  };
}

function initOnboarding() { /* called from index.html but showOnboarding() is the real entry */ }
