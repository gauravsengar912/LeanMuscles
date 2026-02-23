// ── Supabase Auth Module ──────────────────────────────────────
// Handles authentication and data sync with Supabase

// CONFIGURATION - User must add their own Supabase credentials
const SUPABASE_CONFIG = {
  url: '', // e.g., 'https://xxxxx.supabase.co'
  anonKey: '', // Your anon public key from Supabase
  
  // Set credentials via: window.setupSupabase(url, anonKey)
  setCredentials: function(url, key) {
    this.url = url;
    this.anonKey = key;
  },
  
  isConfigured: function() {
    return this.url && this.anonKey;
  }
};

// Current user session
let CURRENT_USER = null;

// ── Supabase API Helpers ───────────────────────────────────────

async function supabaseRequest(method, endpoint, data = null) {
  if (!SUPABASE_CONFIG.isConfigured()) {
    throw new Error('Supabase not configured. Call setupSupabase() first.');
  }
  
  const url = `${SUPABASE_CONFIG.url}/rest/v1${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.anonKey,
    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
  };
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ── Auth Functions ────────────────────────────────────────

async function supabaseSignUp(email, password, userData) {
  const url = `${SUPABASE_CONFIG.url}/auth/v1/signup`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify({
      email,
      password,
      data: userData
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error_description || result.message || 'Signup failed');
  }
  
  return result;
}

async function supabaseSignIn(email, password) {
  const url = `${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify({
      email,
      password
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error_description || result.message || 'Login failed');
  }
  
  return result;
}

async function supabaseSignOut() {
  CURRENT_USER = null;
  sessionStorage.removeItem('supabase_session');
  localStorage.removeItem('supabase_session');
}

// ── User Data Management ───────────────────────────────────────

async function saveUserData(userId, appData) {
  try {
    const existing = await supabaseRequest('GET', `/user_profiles?id=eq.${userId}&select=*`);
    
    const payload = {
      user_id: userId,
      profile_data: appData,
      updated_at: new Date().toISOString()
    };
    
    if (existing && existing.length > 0) {
      // Update existing
      await supabaseRequest('PATCH', `/user_profiles?id=eq.${userId}`, {
        profile_data: appData,
        updated_at: new Date().toISOString()
      });
    } else {
      // Insert new
      await supabaseRequest('POST', '/user_profiles', payload);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save user data:', error);
    return false;
  }
}

async function loadUserData(userId) {
  try {
    const result = await supabaseRequest('GET', `/user_profiles?id=eq.${userId}&select=profile_data`);
    
    if (result && result.length > 0) {
      return result[0].profile_data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
}

// ── Session Management ───────────────────────────────────────

function saveSession(session) {
  sessionStorage.setItem('supabase_session', JSON.stringify(session));
  CURRENT_USER = session;
}

function loadSession() {
  const session = sessionStorage.getItem('supabase_session');
  if (session) {
    try {
      CURRENT_USER = JSON.parse(session);
      return CURRENT_USER;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getCurrentUser() {
  return CURRENT_USER || loadSession();
}

// ── Auth UI Functions ───────────────────────────────────────

function showAuthModal(mode = 'login') {
  const existingModal = document.getElementById('auth-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,.8); 
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; backdrop-filter: blur(4px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: var(--bg2); border-radius: 16px; padding: 28px;
    max-width: 380px; width: 90%; border: 1px solid var(--border);
    box-shadow: 0 20px 60px rgba(0,0,0,.8);
  `;
  
  const isSignup = mode === 'signup';
  
  content.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-family: Syne, sans-serif; font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">
        ${isSignup ? 'Create Account' : 'Sign In'}
      </h2>
      <p style="color: var(--text2); font-size: 0.9rem;">
        ${isSignup ? 'Join SweatItOut to save your progress' : 'Access your fitness journey'}
      </p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
      <div>
        <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600;">Email</label>
        <input id="auth-email" type="email" placeholder="your@email.com" 
          style="width: 100%; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-size: 0.95rem; outline: none;">
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600;">Password</label>
        <input id="auth-password" type="password" placeholder="••••••••" 
          style="width: 100%; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-size: 0.95rem; outline: none;">
      </div>
      ${isSignup ? `
      <div>
        <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600;">Full Name</label>
        <input id="auth-name" type="text" placeholder="Your Name" 
          style="width: 100%; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-size: 0.95rem; outline: none;">
      </div>
      ` : ''}
    </div>
    
    <div id="auth-status" style="font-size: 0.85rem; margin-bottom: 12px; min-height: 20px;"></div>
    
    <button id="auth-submit" class="btn" style="width: 100%; margin-bottom: 12px;">
      ${isSignup ? 'Create Account' : 'Sign In'}
    </button>
    
    <div style="text-align: center; margin-bottom: 12px;">
      <button id="auth-toggle" style="background: none; border: none; color: var(--accent); 
        cursor: pointer; font-size: 0.9rem; text-decoration: underline;">
        ${isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
    
    <button id="auth-close" style="width: 100%; padding: 10px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 8px; color: var(--text); cursor: pointer;
      font-size: 0.9rem;">Skip for now</button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('auth-submit').addEventListener('click', () => {
    handleAuth(isSignup);
  });
  
  document.getElementById('auth-toggle').addEventListener('click', () => {
    modal.remove();
    showAuthModal(isSignup ? 'login' : 'signup');
  });
  
  document.getElementById('auth-close').addEventListener('click', () => {
    modal.remove();
  });
  
  // Allow Enter key
  document.getElementById('auth-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAuth(isSignup);
  });
}

async function handleAuth(isSignup) {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const statusEl = document.getElementById('auth-status');
  
  if (!email || !password) {
    statusEl.style.color = 'var(--accent)';
    statusEl.textContent = 'Please fill all fields';
    return;
  }
  
  if (isSignup) {
    const name = document.getElementById('auth-name').value.trim();
    if (!name) {
      statusEl.style.color = 'var(--accent)';
      statusEl.textContent = 'Please enter your name';
      return;
    }
  }
  
  try {
    statusEl.style.color = 'var(--text2)';
    statusEl.textContent = 'Processing...';
    document.getElementById('auth-submit').disabled = true;
    
    let session;
    
    if (isSignup) {
      const name = document.getElementById('auth-name').value.trim();
      session = await supabaseSignUp(email, password, { name });
    } else {
      session = await supabaseSignIn(email, password);
    }
    
    saveSession(session.user || session);
    statusEl.style.color = 'var(--green)';
    statusEl.textContent = isSignup ? 'Account created!' : 'Signed in!';
    
    setTimeout(() => {
      document.getElementById('auth-modal').remove();
      location.reload(); // Reload to reinitialize app with logged-in state
    }, 500);
    
  } catch (error) {
    statusEl.style.color = 'var(--accent)';
    statusEl.textContent = 'Error: ' + error.message;
    document.getElementById('auth-submit').disabled = false;
  }
}

// ── Setup Function ────────────────────────────────────────

function setupSupabase(url, anonKey) {
  SUPABASE_CONFIG.setCredentials(url, anonKey);
  localStorage.setItem('supabase_config_stored', 'true');
  console.log('Supabase configured');
}

// Export for use
if (typeof window !== 'undefined') {
  window.supabaseAuth = {
    signUp: supabaseSignUp,
    signIn: supabaseSignIn,
    signOut: supabaseSignOut,
    getCurrentUser,
    saveUserData,
    loadUserData,
    showAuthModal,
    setupSupabase,
    isConfigured: () => SUPABASE_CONFIG.isConfigured()
  };
}
