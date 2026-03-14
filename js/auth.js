// ============================================================
// Authentication
// ============================================================

function initAuth() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`auth-${tab.dataset.tab}`).classList.add('active');
      document.getElementById('auth-message').className = 'auth-message';
    });
  });

  // Sign in
  document.getElementById('signin-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    if (!email || !password) { showAuthMsg('Please fill all fields', 'error'); return; }

    const btn = document.getElementById('signin-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Signing in...';

    const { data, error } = await sbSignIn(email, password);
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Sign In';

    if (error) { showAuthMsg(error.message, 'error'); return; }
    if (data.user) handleAuthSuccess(data.user);
  });

  // Sign up
  document.getElementById('signup-btn')?.addEventListener('click', async () => {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    const emailHint = document.querySelector('#auth-signup .input-hint');
    const pwHint = document.querySelectorAll('#auth-signup .input-hint')[1];

    // Validation
    if (!username || username.length < 3) { showAuthMsg('Username must be at least 3 characters', 'error'); return; }
    if (!email || !email.includes('@')) {
      if (emailHint) { emailHint.textContent = 'Invalid email'; emailHint.className = 'input-hint error'; }
      return;
    }
    if (password.length < 8) {
      if (pwHint) { pwHint.textContent = 'Min 8 characters'; pwHint.className = 'input-hint error'; }
      return;
    }

    const btn = document.getElementById('signup-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Creating...';

    const { data, error } = await sbSignUp(email, password, username);
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Create Account';

    if (error) { showAuthMsg(error.message, 'error'); return; }
    showAuthMsg('Account created! Please check your email to verify.', 'success');
  });

  // Forgot password
  document.getElementById('forgot-password-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('signin-email').value.trim();
    if (!email) { showAuthMsg('Enter your email first', 'error'); return; }
    const { error } = await sbResetPassword(email);
    if (error) showAuthMsg(error.message, 'error');
    else showAuthMsg('Password reset email sent!', 'success');
  });

  // Listen for auth state changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      handleAuthSuccess(session.user);
    } else if (event === 'SIGNED_OUT') {
      showAuthOverlay();
    }
  });

  // Sign out
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    await sbSignOut();
    STATE.user = null;
    STATE.profile = null;
    showAuthOverlay();
    showToast('Signed out', 'info');
  });

  // Delete account
  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete your account and ALL data? This cannot be undone.')) return;
    const { error } = await sbDeleteAccount(STATE.user.id);
    if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    await sbSignOut();
    showAuthOverlay();
    showToast('Account deleted', 'info');
  });
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-message');
  el.textContent = msg;
  el.className = `auth-message ${type}`;
}

function showAuthOverlay() {
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('onboarding').classList.add('hidden');
}

async function handleAuthSuccess(user) {
  STATE.user = user;
  document.getElementById('auth-overlay').classList.add('hidden');

  // Load profile
  const { data: profile } = await sbGetProfile(user.id);

  if (!profile || !profile.is_onboarded) {
    // Show onboarding
    STATE.isOnboarded = false;
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    initOnboarding();
  } else {
    STATE.profile = profile;
    STATE.isOnboarded = true;
    await bootApp();
  }
}
