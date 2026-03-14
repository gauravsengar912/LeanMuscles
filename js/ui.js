// ============================================================
// UI Utilities
// ============================================================

// ---- Toast notifications ----
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Tab switching ----
const TAB_ORDER = ['home', 'workout', 'diet', 'foodlog', 'profile'];

function switchTab(tabName) {
  const prevTab = STATE.currentTab;
  const prevIdx = TAB_ORDER.indexOf(prevTab);
  const newIdx = TAB_ORDER.indexOf(tabName);

  const prevPane = document.getElementById(`tab-${prevTab}`);
  const newPane = document.getElementById(`tab-${tabName}`);
  if (!prevPane || !newPane) return;

  prevPane.classList.remove('active');
  newPane.classList.add('active');

  STATE.currentTab = tabName;

  // Update bottom nav
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Move nav indicator
  updateNavIndicator(tabName);

  // Update top bar title
  const titles = { home: 'Home', workout: 'Workout', diet: 'Diet', foodlog: 'Food Log', profile: 'Profile' };
  document.getElementById('tab-title').textContent = titles[tabName] || tabName;

  // Trigger tab-specific refresh
  if (tabName === 'home') refreshHome();
  if (tabName === 'foodlog') renderFoodLog();
  if (tabName === 'profile') refreshProfile();
  if (tabName === 'workout') renderWorkoutDay(STATE.currentWorkoutDay);

  // Trigger reveal animations
  setTimeout(() => triggerReveal(), 100);
}

function updateNavIndicator(tabName) {
  const indicator = document.getElementById('nav-indicator');
  const navTabs = document.querySelectorAll('.nav-tab');
  const activeTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
  if (!activeTab || !indicator) return;
  const idx = Array.from(navTabs).indexOf(activeTab);
  indicator.style.left = `${(idx / navTabs.length) * 100}%`;
}

// ---- Reveal on scroll ----
function triggerReveal() {
  const revealEls = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  revealEls.forEach(el => observer.observe(el));
}

// ---- Collapse toggle ----
function toggleCollapse(bodyId) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const parent = body.closest('.glass-card') || body.parentElement;
  const arrow = parent.querySelector('.collapse-arrow');
  body.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('rotated');
}

// ---- Modal helpers ----
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

// ---- Loading overlay ----
function showLoading(msg = 'Processing...') {
  document.getElementById('loading-text').textContent = msg;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ---- Button ripple effect ----
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-primary');
  if (!btn) return;
  const ripple = btn.querySelector('.btn-ripple');
  if (!ripple) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size/2}px;
    top: ${e.clientY - rect.top - size/2}px;
    animation: none;
  `;
  void ripple.offsetWidth;
  ripple.style.animation = '';
});

// ---- Swipe gesture between tabs ----
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
  // Don't swipe if inside scrollable container horizontally
  const target = e.target.closest('.day-tabs-wrap, .stories-row, .heatmap-grid');
  if (target) return;

  const idx = TAB_ORDER.indexOf(STATE.currentTab);
  if (dx < 0 && idx < TAB_ORDER.length - 1) switchTab(TAB_ORDER[idx + 1]);
  if (dx > 0 && idx > 0) switchTab(TAB_ORDER[idx - 1]);
}, { passive: true });

// ---- Count up animation ----
function animateCountUp(el, target, duration = 1000) {
  if (!el) return;
  const start = 0;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---- Confetti ----
function launchConfetti(container) {
  if (!container) return;
  const colors = ['#6c63ff', '#ff6584', '#43d9ad', '#ff9f43', '#54a0ff', '#ffd700'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      position: absolute;
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: 0;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      --travel-y: ${150 + Math.random() * 200}px;
      --rotation: ${360 + Math.random() * 720}deg;
      --delay: ${Math.random() * 0.8}s;
      animation: confettiBurst 1.5s ease-out var(--delay) forwards;
      opacity: 1;
    `;
    container.appendChild(piece);
  }
  setTimeout(() => container.innerHTML = '', 3000);
}

// ---- Mouse glow on glass cards ----
document.addEventListener('mousemove', (e) => {
  const card = e.target.closest('.glass-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--mouse-x', `${x}%`);
  card.style.setProperty('--mouse-y', `${y}%`);
});

// ---- Format helpers ----
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Side menu ----
function openSideMenu() {
  document.getElementById('side-menu').classList.add('open');
  document.getElementById('side-overlay').classList.remove('hidden');
  document.getElementById('hamburger-btn').classList.add('active');
}

function closeSideMenu() {
  document.getElementById('side-menu').classList.remove('open');
  document.getElementById('side-overlay').classList.add('hidden');
  document.getElementById('hamburger-btn').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hamburger-btn')?.addEventListener('click', openSideMenu);
});

// ---- Greeting ----
function updateGreeting() {
  const hour = new Date().getHours();
  const greetings = [
    [5, 12, 'Good Morning'],
    [12, 17, 'Good Afternoon'],
    [17, 22, 'Good Evening'],
    [22, 24, 'Good Night'],
    [0, 5, 'Still Grinding'],
  ];
  let text = 'Hello';
  for (const [start, end, msg] of greetings) {
    if (hour >= start && hour < end) { text = msg; break; }
  }
  const name = STATE.profile?.username || STATE.user?.user_metadata?.username || '';
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = `${text}${name ? ', ' + name : ''}! 👋`;
  const dateEl = document.getElementById('greeting-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
