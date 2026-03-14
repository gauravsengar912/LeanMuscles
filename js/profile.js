// ============================================================
// Profile Tab
// ============================================================

async function refreshProfile() {
  if (!STATE.user) return;
  const profile = STATE.profile;
  if (!profile) return;

  // Basic info
  document.getElementById('profile-username').textContent = profile.username || 'User';
  document.getElementById('profile-email').textContent = STATE.user.email || '';

  // Side menu
  document.getElementById('menu-username').textContent = profile.username || 'User';
  document.getElementById('menu-stats').textContent = `${STATE.points} pts • ${STATE.streak}🔥`;

  // Avatar
  updateAvatarDisplay(profile.avatar_url, profile.username);

  // Stats with count-up
  animateCountUp(document.getElementById('stat-streak'), STATE.streak);
  animateCountUp(document.getElementById('stat-points'), STATE.points);
  animateCountUp(document.getElementById('stat-days'), STATE.totalWorkoutDays);

  // Heatmap
  await loadAndRenderHeatmap();

  // PRs
  await loadPRs();

  // Friends
  await loadFriends();

  // Stories
  await loadStories();

  // Leaderboard
  await loadLeaderboard('streak');

  setTimeout(() => triggerReveal(), 100);
}

function updateAvatarDisplay(avatarUrl, username) {
  const initials = (username || 'U').slice(0, 2).toUpperCase();

  // Menu avatar
  const menuImg = document.getElementById('menu-avatar');
  const menuInitials = document.getElementById('menu-avatar-initials');
  if (avatarUrl) {
    menuImg.src = avatarUrl;
    menuImg.style.display = 'block';
    if (menuInitials) menuInitials.textContent = '';
  } else {
    if (menuImg) menuImg.style.display = 'none';
    if (menuInitials) menuInitials.textContent = initials;
  }

  // Profile avatar
  const profImg = document.getElementById('profile-avatar-img');
  const profInitials = document.getElementById('profile-avatar-initials');
  if (avatarUrl) {
    profImg.src = avatarUrl;
    profImg.style.display = 'block';
    if (profInitials) profInitials.style.display = 'none';
  } else {
    if (profImg) profImg.style.display = 'none';
    if (profInitials) { profInitials.style.display = 'flex'; profInitials.textContent = initials; }
  }
}

function initProfileActions() {
  // Avatar upload
  document.getElementById('avatar-upload-btn')?.addEventListener('click', () => {
    document.getElementById('avatar-file-input').click();
  });

  document.getElementById('avatar-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showLoading('Uploading avatar...');
    const compressed = await compressImage(file, 256, 256, 0.7);
    const { url, error } = await sbUploadAvatar(STATE.user.id, compressed);
    hideLoading();
    if (error) { showToast('Upload failed', 'error'); return; }
    STATE.profile.avatar_url = url;
    await sbUpsertProfile({ id: STATE.user.id, avatar_url: url, updated_at: new Date().toISOString() });
    updateAvatarDisplay(url, STATE.profile.username);
    showToast('Avatar updated!', 'success');
  });

  // Add PR
  document.getElementById('add-pr-btn')?.addEventListener('click', () => openModal('pr-modal'));
  document.getElementById('save-pr-btn')?.addEventListener('click', savePR);

  // Add friend
  document.getElementById('add-friend-btn')?.addEventListener('click', () => openModal('friend-modal'));
  document.getElementById('send-friend-req-btn')?.addEventListener('click', sendFriendRequest);

  // Workout story
  document.getElementById('add-story-btn')?.addEventListener('click', () => {
    document.getElementById('story-file-input').click();
  });

  document.getElementById('story-file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showLoading('Uploading story...');
    const compressed = await compressImage(file, 800, 1200, 0.75);
    const { error } = await sbUploadStory(STATE.user.id, compressed);
    hideLoading();
    if (error) { showToast('Upload failed: ' + error.message, 'error'); return; }
    await loadStories();
    showToast('Story added! 📸 (expires in 24h)', 'success');
  });

  // Leaderboard filters
  document.querySelectorAll('.lb-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lb-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadLeaderboard(btn.dataset.sort);
    });
  });

  // Regenerate
  document.getElementById('regen-workout-btn')?.addEventListener('click', regenWorkoutPlan);
  document.getElementById('regen-diet-btn')?.addEventListener('click', regenDietPlan);
}

// ---- Heatmap ----
async function loadAndRenderHeatmap() {
  const { data: logs } = await sbGetWorkoutLogs(STATE.user.id, 13);
  STATE.workoutLogs = logs || [];

  // Calculate streak from logs
  const dates = new Set((logs || []).map(l => l.workout_date));
  const today = getTodayDate();
  let streak = 0;
  let d = new Date(today);
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  STATE.streak = streak;
  STATE.totalWorkoutDays = logs?.length || STATE.profile?.total_workout_days || 0;

  // Render 13 weeks × 7 days heatmap
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const weeks = 13;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.className = 'heatmap-col';
    for (let d2 = 0; d2 < 7; d2++) {
      const cell = document.createElement('div');
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d2);
      const ds = cellDate.toISOString().split('T')[0];
      const hasWorkout = dates.has(ds);
      cell.className = `heatmap-cell${hasWorkout ? ' level-4' : ''}`;
      cell.title = ds;
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
}

// ---- Personal Records ----
async function loadPRs() {
  const { data } = await sbGetPRs(STATE.user.id);
  STATE.prs = data || [];
  renderPRs();
}

function renderPRs() {
  const container = document.getElementById('pr-list');
  if (!container) return;
  if (!STATE.prs.length) {
    container.innerHTML = '<p class="muted-text" style="font-size:0.82rem;">No PRs yet. Add your first!</p>';
    return;
  }
  container.innerHTML = STATE.prs.map(pr => `
    <div class="pr-item">
      <div class="pr-exercise">🏆 ${pr.exercise}</div>
      <div class="pr-value">${pr.weight_kg}kg × ${pr.reps}</div>
      <div class="pr-date">${formatDateShort(pr.created_at?.split('T')[0])}</div>
      <button class="pr-del-btn" onclick="deletePR('${pr.id}')">🗑️</button>
    </div>
  `).join('');
}

async function savePR() {
  const exercise = document.getElementById('pr-exercise').value.trim();
  const weight = parseFloat(document.getElementById('pr-weight').value);
  const reps = parseInt(document.getElementById('pr-reps').value);
  if (!exercise || !weight || !reps) { showToast('Fill all fields', 'error'); return; }
  const { error } = await sbAddPR(STATE.user.id, exercise, weight, reps);
  if (error) { showToast('Failed: ' + error.message, 'error'); return; }
  closeModal('pr-modal');
  document.getElementById('pr-exercise').value = '';
  document.getElementById('pr-weight').value = '';
  document.getElementById('pr-reps').value = '';
  await loadPRs();
  showToast('PR saved! 🏆', 'success');
}

async function deletePR(id) {
  if (!confirm('Delete this PR?')) return;
  await sbDeletePR(id);
  await loadPRs();
}

// ---- Friends ----
async function loadFriends() {
  const [{ data: friends }, { data: requests }] = await Promise.all([
    sbGetFriends(STATE.user.id),
    sbGetFriendRequests(STATE.user.id),
  ]);

  STATE.friends = friends || [];
  STATE.friendRequests = requests || [];

  renderFriends();
  renderFriendRequests();
}

function renderFriends() {
  const container = document.getElementById('friends-list');
  if (!container) return;
  if (!STATE.friends.length) {
    container.innerHTML = '<p class="muted-text" style="font-size:0.82rem;">No friends yet. Add some!</p>';
    return;
  }
  container.innerHTML = STATE.friends.map(f => {
    const friend = f.user_id === STATE.user.id ? f.friend : f.requester;
    if (!friend) return '';
    const initials = (friend.username || 'U').slice(0, 2).toUpperCase();
    return `
      <div class="friend-item">
        <div class="friend-avatar">${initials}</div>
        <div class="friend-info">
          <div class="friend-name">${friend.username}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFriendRequests() {
  const wrap = document.getElementById('friend-requests');
  const list = document.getElementById('friend-requests-list');
  if (!wrap || !list) return;
  if (!STATE.friendRequests.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  list.innerHTML = STATE.friendRequests.map(req => `
    <div class="friend-req-item">
      <span style="flex:1;">${req.requester?.username || 'Unknown'}</span>
      <div class="req-btns">
        <button class="req-accept-btn" onclick="respondRequest('${req.id}', true)">✓ Accept</button>
        <button class="req-reject-btn" onclick="respondRequest('${req.id}', false)">✕</button>
      </div>
    </div>
  `).join('');
}

async function sendFriendRequest() {
  const username = document.getElementById('friend-username-input').value.trim();
  if (!username) return;
  const msgEl = document.getElementById('friend-req-message');
  const { data: targetUser, error: findError } = await sbSearchUser(username);
  if (findError || !targetUser) {
    msgEl.style.color = 'var(--accent-secondary)';
    msgEl.textContent = 'User not found';
    return;
  }
  if (targetUser.id === STATE.user.id) {
    msgEl.style.color = 'var(--accent-secondary)';
    msgEl.textContent = "You can't add yourself!";
    return;
  }
  const { error } = await sbSendFriendRequest(STATE.user.id, targetUser.id);
  if (error) { msgEl.style.color = 'var(--accent-secondary)'; msgEl.textContent = 'Error: ' + error.message; return; }
  msgEl.style.color = 'var(--accent-green)';
  msgEl.textContent = `Request sent to ${username}!`;
  setTimeout(() => closeModal('friend-modal'), 1500);
}

async function respondRequest(reqId, accept) {
  await sbRespondToRequest(reqId, accept);
  await loadFriends();
  showToast(accept ? 'Friend added!' : 'Request declined', 'info');
}

// ---- Leaderboard ----
async function loadLeaderboard(sortBy = 'streak') {
  const myId = STATE.user?.id;
  const friendIds = STATE.friends.map(f =>
    f.user_id === myId ? f.friend_id : f.user_id
  ).filter(Boolean);
  const allIds = [...new Set([myId, ...friendIds])];

  const { data: users } = await sbGetLeaderboard(allIds);
  if (!users) return;

  const sortFns = {
    streak: (a, b) => (b.streak || 0) - (a.streak || 0),
    points: (a, b) => (b.points || 0) - (a.points || 0),
    days: (a, b) => (b.total_workout_days || 0) - (a.total_workout_days || 0),
  };

  const sorted = [...users].sort(sortFns[sortBy] || sortFns.streak);
  const container = document.getElementById('leaderboard-list');
  if (!container) return;

  const rankEmojis = ['🥇', '🥈', '🥉'];
  container.innerHTML = sorted.map((u, i) => {
    const isMe = u.id === myId;
    const val = sortBy === 'streak' ? `${u.streak || 0}🔥` :
      sortBy === 'points' ? `${u.points || 0}⭐` : `${u.total_workout_days || 0}💪`;
    return `
      <div class="lb-item${isMe ? ' lb-self' : ''}">
        <span class="lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${rankEmojis[i] || i + 1}</span>
        <span class="lb-user">${u.username || 'User'}${isMe ? ' (you)' : ''}</span>
        <span class="lb-value">${val}</span>
      </div>
    `;
  }).join('');
}

// ---- Stories ----
async function loadStories() {
  const { data } = await sbGetStories(STATE.user.id);
  STATE.stories = data || [];
  renderStories();
}

function renderStories() {
  const row = document.getElementById('stories-row');
  if (!row) return;
  if (!STATE.stories.length) {
    row.innerHTML = '<p class="muted-text" style="font-size:0.82rem;">No active stories</p>';
    return;
  }
  row.innerHTML = STATE.stories.map(s => {
    const expiry = new Date(s.expires_at);
    const remaining = Math.max(0, Math.round((expiry - Date.now()) / 3600000));
    return `
      <div class="story-thumb" onclick="viewStory('${s.image_url}', '${remaining}h left')">
        <img src="${s.image_url}" alt="Story" loading="lazy">
        <div class="story-expiry">${remaining}h left</div>
      </div>
    `;
  }).join('');
}

function viewStory(url, info) {
  document.getElementById('story-image').src = url;
  document.getElementById('story-info').textContent = info;
  openModal('story-modal');
}

// ---- Image compression ----
async function compressImage(file, maxW, maxH, quality) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW) { height = height * (maxW / width); width = maxW; }
      if (height > maxH) { width = width * (maxH / height); height = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob); }, 'image/jpeg', quality);
    };
    img.src = url;
  });
}
