// ============================================================
// Onboarding
// ============================================================

let currentSlide = 1;
const totalSlides = 4;

function initOnboarding() {
  currentSlide = 1;
  showSlide(1);

  document.getElementById('ob-next').addEventListener('click', handleObNext);
  document.getElementById('ob-back').addEventListener('click', handleObBack);

  // Goal selection
  document.querySelectorAll('.goal-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      STATE.selectedGoal = card.dataset.goal;
    });
  });

  // Training days
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.selectedTrainingDays = parseInt(btn.dataset.days);
    });
  });

  // Pre-select
  STATE.selectedGoal = 'muscle_gain';
  document.querySelector('.goal-card[data-goal="muscle_gain"]')?.classList.add('selected');
}

function showSlide(n) {
  document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
  document.getElementById(`onboarding`)
    ?.querySelectorAll('.onboarding-slide')[n - 1]?.classList.add('active');

  // Dots
  document.querySelectorAll('.progress-dots .dot').forEach((d, i) => {
    d.classList.toggle('active', i < n);
  });

  // Back/next visibility
  const backBtn = document.getElementById('ob-back');
  const nextBtn = document.getElementById('ob-next');
  backBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
  nextBtn.textContent = n === totalSlides ? '🚀 Generate My Plan' : 'Next →';
}

function handleObBack() {
  if (currentSlide > 1) {
    currentSlide--;
    showSlide(currentSlide);
  }
}

async function handleObNext() {
  if (currentSlide < totalSlides) {
    // Validate current slide
    if (!validateObSlide(currentSlide)) return;
    currentSlide++;
    showSlide(currentSlide);
    return;
  }

  // Final step — generate plans
  const profileData = gatherOnboardingData();
  if (!profileData) return;

  showLoading('Generating your personalized plan with AI...');

  try {
    // Save profile
    const profile = {
      id: STATE.user.id,
      username: STATE.user.user_metadata?.username || STATE.user.email.split('@')[0],
      email: STATE.user.email,
      age: profileData.age,
      gender: profileData.gender,
      height_cm: profileData.height,
      weight_kg: profileData.weight,
      activity_level: profileData.activity,
      goal: profileData.goal,
      diet_preference: profileData.diet,
      training_days: profileData.trainingDays,
      split: profileData.split,
      experience: profileData.experience,
      equipment: profileData.equipment,
      notes: profileData.notes,
      is_onboarded: true,
      streak: 0,
      longest_streak: 0,
      total_workout_days: 0,
      points: 0,
      updated_at: new Date().toISOString()
    };

    await sbUpsertProfile(profile);
    STATE.profile = profile;

    // Generate plans
    const [workout, diet] = await Promise.all([
      generateWorkoutPlan(profile),
      generateDietPlan(profile),
    ]);

    STATE.workoutPlan = workout;
    STATE.dietPlan = diet;
    saveLocalState();

    await sbSavePlan(STATE.user.id, 'workout', workout);
    await sbSavePlan(STATE.user.id, 'diet', diet);

    hideLoading();
    document.getElementById('onboarding').classList.add('hidden');
    await bootApp();
    showToast('🎉 Your personalized plan is ready!', 'success');
  } catch(e) {
    hideLoading();
    showToast('Failed to generate plan: ' + e.message, 'error');
    console.error(e);
  }
}

function validateObSlide(n) {
  if (n === 1) {
    const age = document.getElementById('ob-age').value;
    const height = document.getElementById('ob-height').value;
    const weight = document.getElementById('ob-weight').value;
    if (!age || !height || !weight) {
      showToast('Please fill in all fields', 'error');
      return false;
    }
  }
  if (n === 2 && !STATE.selectedGoal) {
    showToast('Please select a goal', 'error');
    return false;
  }
  return true;
}

function gatherOnboardingData() {
  const age = parseInt(document.getElementById('ob-age').value);
  const gender = document.getElementById('ob-gender').value;
  const height = parseFloat(document.getElementById('ob-height').value);
  const weight = parseFloat(document.getElementById('ob-weight').value);
  const activity = document.getElementById('ob-activity').value;
  const goal = STATE.selectedGoal || 'muscle_gain';
  const diet = document.getElementById('ob-diet').value;
  const split = document.getElementById('ob-split').value;
  const experience = document.getElementById('ob-experience').value;
  const equipment = document.getElementById('ob-equipment').value;
  const notes = document.getElementById('ob-notes').value;
  const trainingDays = STATE.selectedTrainingDays;

  if (!age || !height || !weight) return null;
  return { age, gender, height, weight, activity, goal, diet, trainingDays, split, experience, equipment, notes };
}
