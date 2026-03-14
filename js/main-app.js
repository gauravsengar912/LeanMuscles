// ============================================================
// Main App - builds UI after successful auth
// ============================================================

const TABS = ['home','workout','diet','foodlog','profile'];
const BAR_TITLES = { home:'Home', workout:'Workout', diet:'Diet', foodlog:'Food Log', profile:'Profile' };
const MEAL_ICONS = { breakfast:'🌅', lunch:'☀️', snacks:'🍎', dinner:'🌙' };

// ── APP BOOT ──────────────────────────────────────────────
async function bootMainApp() {
  loadLocal();

  // Build the app shell HTML
  $('app').innerHTML = buildAppShell();
  $('app').style.display = 'block';

  // Wire up all events
  wireAppEvents();

  // Load data
  if (STATE.user) await loadAllData();

  // Nav indicator
  updateNavLine('home');
  setTimeout(() => { switchTab('home'); revealAll(); }, 80);

  showToast(`Welcome back, ${STATE.profile?.username || 'Athlete'}! 💪`, 'success');

  // Midnight reset
  scheduleReset();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

async function loadAllData() {
  try {
    const uid = STATE.user.id;
    const [wp, dp, fl, wl, tm] = await Promise.all([
      getSB().from('plans').select('plan_data').eq('user_id', uid).eq('type', 'workout').single(),
      getSB().from('plans').select('plan_data').eq('user_id', uid).eq('type', 'diet').single(),
      getSB().from('food_logs').select('log_data').eq('user_id', uid).eq('log_date', getTodayDate()).single(),
      getSB().from('workout_logs').select('workout_date').eq('user_id', uid).gte('workout_date', new Date(Date.now() - 91 * 86400000).toISOString().split('T')[0]),
      getSB().from('meal_templates').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(8),
    ]);
    if (wp.data?.plan_data) STATE.workoutPlan = wp.data.plan_data;
    if (dp.data?.plan_data) STATE.dietPlan = dp.data.plan_data;
    if (fl.data?.log_data) STATE.foodLog[getTodayDate()] = fl.data.log_data;
    STATE.workoutLogs = wl.data || [];
    STATE.templates = (tm.data || []).map(t => ({
      id: t.id, name: t.name,
      totalCals: t.template_data?.totalCals || 0,
      template_data: t.template_data
    }));
    saveLocal();
  } catch (e) { console.warn('Load:', e); }
}

// ── APP SHELL HTML ────────────────────────────────────────
function buildAppShell() {
  return `
  <!-- Side Menu -->
  <div id="side-menu" style="position:fixed;left:-290px;top:0;bottom:0;width:280px;z-index:200;padding:22px 16px;display:flex;flex-direction:column;gap:12px;transition:left 0.35s cubic-bezier(0.4,0,0.2,1);background:rgba(10,10,20,0.98);backdrop-filter:blur(24px);border-right:1px solid rgba(255,255,255,0.08);border-radius:0 24px 24px 0;">
    <div style="display:flex;align-items:center;gap:11px;padding-bottom:13px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <div id="menu-av" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6c63ff,#ff6584);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;overflow:hidden;"><span id="menu-av-init"></span></div>
      <div><strong id="menu-uname" style="display:block;font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.93);">User</strong><span id="menu-stats-txt" style="font-size:0.7rem;color:rgba(255,255,255,0.45);">0 pts</span></div>
      <button onclick="closeSideMenu()" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.4);font-size:1rem;cursor:pointer;padding:4px 7px;border-radius:7px;">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:7px;font-size:0.72rem;color:rgba(255,255,255,0.4);">
      <div class="sync-dot" style="width:7px;height:7px;border-radius:50%;background:#43d9ad;"></div>
      <span id="sync-txt">Synced</span>
    </div>
    <nav style="display:flex;flex-direction:column;gap:2px;flex:1;">
      ${['🏠 Home','🏋️ Workout','🥗 Diet','🍛 Food Log','👤 Profile'].map((lbl,i)=>`<button onclick="switchTab('${TABS[i]}');closeSideMenu()" style="display:flex;align-items:center;gap:11px;padding:10px 13px;background:none;border:none;color:rgba(255,255,255,0.55);font-family:'DM Sans',sans-serif;font-size:0.9rem;cursor:pointer;border-radius:11px;text-align:left;transition:background 0.2s,color 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.color='rgba(255,255,255,0.93)'" onmouseout="this.style.background='none';this.style.color='rgba(255,255,255,0.55)'">${lbl}</button>`).join('')}
    </nav>
    <div style="display:flex;flex-direction:column;gap:5px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">
      <button id="signout-btn" style="background:none;border:none;color:#ff6584;font-family:'DM Sans',sans-serif;font-size:0.88rem;cursor:pointer;padding:8px 12px;border-radius:10px;text-align:left;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,101,132,0.08)'" onmouseout="this.style.background='none'">Sign Out</button>
      <button id="del-acct-btn" style="background:none;border:none;color:#ff6584;font-family:'DM Sans',sans-serif;font-size:0.75rem;cursor:pointer;padding:6px 12px;border-radius:10px;text-align:left;opacity:0.7;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,101,132,0.08)'" onmouseout="this.style.background='none'">Delete Account</button>
    </div>
  </div>
  <div id="side-overlay" style="display:none;position:fixed;inset:0;z-index:190;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);" onclick="closeSideMenu()"></div>

  <!-- Top Bar -->
  <header style="position:fixed;top:0;left:0;right:0;height:58px;z-index:100;display:flex;align-items:center;padding:0 14px;gap:10px;background:rgba(7,7,13,0.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.08);">
    <button id="burger-btn" onclick="openSideMenu()" style="width:34px;height:34px;display:flex;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:0;flex-shrink:0;">
      <span style="display:block;height:2px;background:rgba(255,255,255,0.93);border-radius:2px;transition:all 0.3s;"></span>
      <span style="display:block;height:2px;background:rgba(255,255,255,0.93);border-radius:2px;transition:all 0.3s;"></span>
      <span style="display:block;height:2px;background:rgba(255,255,255,0.93);border-radius:2px;transition:all 0.3s;"></span>
    </button>
    <div style="flex:1;font-family:'Space Grotesk',sans-serif;font-size:1.05rem;font-weight:600;display:flex;align-items:center;gap:7px;"><span>⚡</span><span id="bar-title">Home</span></div>
    <div style="display:flex;align-items:center;gap:9px;">
      <div class="sync-dot" style="width:7px;height:7px;border-radius:50%;background:#43d9ad;"></div>
    </div>
  </header>

  <!-- Tab Container -->
  <div style="position:relative;overflow:hidden;margin-top:58px;margin-bottom:68px;height:calc(100dvh - 126px);">
    <div id="tab-home" class="tab-pane" style="position:absolute;inset:0;overflow-y:auto;padding:14px;display:block;scrollbar-width:thin;"></div>
    <div id="tab-workout" class="tab-pane" style="position:absolute;inset:0;overflow-y:auto;padding:14px;display:none;scrollbar-width:thin;"></div>
    <div id="tab-diet" class="tab-pane" style="position:absolute;inset:0;overflow-y:auto;padding:14px;display:none;scrollbar-width:thin;"></div>
    <div id="tab-foodlog" class="tab-pane" style="position:absolute;inset:0;overflow-y:auto;padding:14px;display:none;scrollbar-width:thin;"></div>
    <div id="tab-profile" class="tab-pane" style="position:absolute;inset:0;overflow-y:auto;padding:14px;display:none;scrollbar-width:thin;"></div>
  </div>

  <!-- Bottom Nav -->
  <nav style="position:fixed;bottom:0;left:0;right:0;height:68px;z-index:100;display:flex;align-items:center;justify-content:space-around;background:rgba(7,7,13,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.08);padding-bottom:env(safe-area-inset-bottom,0);">
    ${[['home','🏠','Home'],['workout','🏋️','Workout'],['diet','🥗','Diet'],['foodlog','🍛','Log'],['profile','👤','Profile']].map(([t,ic,lb])=>`
    <button data-t="${t}" onclick="switchTab('${t}')" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.28);transition:color 0.2s;" class="nav-btn">
      <span style="font-size:1.22rem;transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);">${ic}</span>
      <span style="font-size:0.62rem;font-weight:500;">${lb}</span>
    </button>`).join('')}
    <div id="nav-line" style="position:absolute;bottom:0;height:2px;background:#6c63ff;border-radius:2px 2px 0 0;transition:left 0.4s cubic-bezier(0.34,1.56,0.64,1),width 0.4s;box-shadow:0 0 8px #6c63ff;"></div>
  </nav>

  <!-- Modals -->
  <div id="timer-overlay" style="display:none;position:fixed;inset:0;z-index:300;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);padding:20px;">
    <div style="width:100%;max-width:310px;padding:24px;text-align:center;background:rgba(255,255,255,0.05);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.09);border-radius:22px;">
      <h3 style="font-family:'Space Grotesk',sans-serif;margin-bottom:16px;">Rest Timer</h3>
      <div style="position:relative;width:112px;height:112px;margin:0 auto 16px;">
        <svg style="width:112px;height:112px;transform:rotate(-90deg);" viewBox="0 0 112 112"><circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="8"/><circle id="tr-fill" cx="56" cy="56" r="48" fill="none" stroke="#6c63ff" stroke-width="8" stroke-linecap="round" stroke-dasharray="301" stroke-dashoffset="0" style="transition:stroke-dashoffset 1s linear;filter:drop-shadow(0 0 7px #6c63ff);"/></svg>
        <div id="timer-val" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:1.5rem;font-weight:700;">2:00</div>
      </div>
      <div style="display:flex;gap:7px;justify-content:center;margin-bottom:16px;">
        ${[60,90,120,180].map(s=>`<button onclick="setTimerSecs(${s})" class="pre-btn" data-s="${s}" style="padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:9px;color:rgba(255,255,255,0.55);font-family:'JetBrains Mono',monospace;font-size:0.76rem;cursor:pointer;">${fmtTime(s)}</button>`).join('')}
      </div>
      <div style="display:flex;gap:7px;justify-content:center;flex-wrap:wrap;">
        <button onclick="timerReset()" style="padding:9px 16px;background:none;border:none;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:0.87rem;cursor:pointer;border-radius:10px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">↺ Reset</button>
        <button id="timer-toggle" onclick="timerToggle()" style="padding:9px 20px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;box-shadow:0 3px 14px rgba(108,99,255,0.4);">▶ Start</button>
        <button onclick="$('timer-overlay').style.display='none';timerStop();" style="padding:9px 14px;background:none;border:none;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:0.87rem;cursor:pointer;border-radius:10px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='none'">✕</button>
      </div>
    </div>
  </div>

  <div id="sub-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);">
    <div style="width:100%;max-width:480px;max-height:85vh;overflow-y:auto;padding:22px;border-radius:24px 24px 0 0;background:rgba(12,12,22,0.98);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-bottom:none;animation:slideUpMod 0.38s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;">
        <h3 style="font-family:'Space Grotesk',sans-serif;">🔄 Alternatives</h3>
        <button onclick="$('sub-modal').style.display='none'" style="width:29px;height:29px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:50%;color:rgba(255,255,255,0.5);cursor:pointer;">✕</button>
      </div>
      <p id="sub-for-txt" style="font-size:0.82rem;color:rgba(255,255,255,0.45);margin-bottom:11px;"></p>
      <div id="sub-list"></div>
    </div>
  </div>

  <div id="chat-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);">
    <div style="width:100%;max-width:480px;height:91vh;padding:20px;border-radius:0;background:rgba(10,10,20,0.99);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-bottom:none;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h3 id="chat-title" style="font-family:'Space Grotesk',sans-serif;">🤖 AI Assistant</h3>
        <button onclick="$('chat-modal').style.display='none'" style="width:29px;height:29px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:50%;color:rgba(255,255,255,0.5);cursor:pointer;">✕</button>
      </div>
      <div id="chat-msgs" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:9px;padding:4px 0;"></div>
      <div style="display:flex;gap:7px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">
        <input id="chat-in" type="text" placeholder="Ask anything..." style="flex:1;padding:10px 13px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.87rem;outline:none;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'">
        <button id="chat-send" style="width:42px;height:42px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:11px;font-size:1rem;cursor:pointer;flex-shrink:0;">➤</button>
      </div>
    </div>
  </div>

  <div id="pr-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);">
    <div style="width:100%;max-width:480px;padding:22px;border-radius:24px 24px 0 0;background:rgba(12,12,22,0.98);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-bottom:none;animation:slideUpMod 0.38s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><h3 style="font-family:'Space Grotesk',sans-serif;">🏆 Add PR</h3><button onclick="$('pr-modal').style.display='none'" style="width:29px;height:29px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:50%;color:rgba(255,255,255,0.5);cursor:pointer;">✕</button></div>
      <div style="margin-bottom:11px;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Exercise</label><input id="pr-ex" type="text" placeholder="Bench Press" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'"></div>
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Weight (kg)</label><input id="pr-wt" type="number" placeholder="100" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'"></div>
        <div style="flex:1;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Reps</label><input id="pr-rps" type="number" placeholder="5" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'"></div>
      </div>
      <button id="save-pr-btn" style="width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;font-weight:600;cursor:pointer;box-shadow:0 4px 18px rgba(108,99,255,0.35);">Save PR</button>
    </div>
  </div>

  <div id="friend-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);">
    <div style="width:100%;max-width:480px;padding:22px;border-radius:24px 24px 0 0;background:rgba(12,12,22,0.98);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-bottom:none;animation:slideUpMod 0.38s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><h3 style="font-family:'Space Grotesk',sans-serif;">👥 Add Friend</h3><button onclick="$('friend-modal').style.display='none'" style="width:29px;height:29px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:50%;color:rgba(255,255,255,0.5);cursor:pointer;">✕</button></div>
      <div style="margin-bottom:13px;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Username</label><input id="friend-un" type="text" placeholder="username" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;" onfocus="this.style.borderColor='#6c63ff'" onblur="this.style.borderColor='rgba(255,255,255,0.09)'"></div>
      <button id="send-freq-btn" style="width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;font-weight:600;cursor:pointer;">Send Request</button>
      <div id="freq-msg" style="margin-top:8px;font-size:0.82rem;font-family:'DM Sans',sans-serif;"></div>
    </div>
  </div>

  <div id="food-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);">
    <div style="width:100%;max-width:480px;padding:22px;border-radius:24px 24px 0 0;background:rgba(12,12,22,0.98);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.08);border-bottom:none;animation:slideUpMod 0.38s cubic-bezier(0.34,1.56,0.64,1);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;"><h3 id="food-mod-name" style="font-family:'Space Grotesk',sans-serif;font-size:1rem;">Food Item</h3><button onclick="$('food-modal').style.display='none'" style="width:29px;height:29px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:50%;color:rgba(255,255,255,0.5);cursor:pointer;">✕</button></div>
      <div id="food-mod-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px;"></div>
      <div style="display:flex;gap:10px;margin-bottom:11px;">
        <div style="flex:1;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Quantity</label><input id="food-qty" type="number" value="100" min="1" oninput="updateFoodCalc()" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;outline:none;"></div>
        <div style="flex:1;"><label style="display:block;font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Unit</label>
          <select id="food-unit" onchange="updateFoodCalc()" style="width:100%;padding:11px 13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:11px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.88rem;outline:none;cursor:pointer;">
            <option value="g">grams</option><option value="ml">ml</option><option value="piece">piece</option>
          </select>
        </div>
      </div>
      <div id="food-calc-macros" style="display:flex;gap:9px;flex-wrap:wrap;padding:10px;background:rgba(255,255,255,0.03);border-radius:11px;font-size:0.8rem;color:rgba(255,255,255,0.6);margin-bottom:13px;"></div>
      <button id="add-food-btn" style="width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;font-weight:600;cursor:pointer;box-shadow:0 4px 18px rgba(108,99,255,0.35);">Add to Log</button>
    </div>
  </div>

  <div id="celeb-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);">
    <div style="width:100%;max-width:300px;padding:30px;text-align:center;background:rgba(255,255,255,0.06);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;animation:popIn 0.5s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;">
      <div id="confetti-wrap" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;"></div>
      <div id="celeb-em" style="font-size:3.6rem;animation:celebBounce 0.7s cubic-bezier(0.34,1.56,0.64,1);">🎉</div>
      <h2 id="celeb-title" style="font-family:'Space Grotesk',sans-serif;margin:10px 0 6px;">Workout Complete!</h2>
      <p id="celeb-msg" style="font-size:0.85rem;color:rgba(255,255,255,0.55);margin-bottom:18px;"></p>
      <button onclick="$('celeb-modal').style.display='none'" style="width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#a29bfe);border:none;border-radius:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:0.92rem;font-weight:600;cursor:pointer;">Awesome! 💪</button>
    </div>
  </div>

  <div id="story-modal" style="display:none;position:fixed;inset:0;z-index:400;align-items:center;justify-content:center;background:#000;">
    <button onclick="$('story-modal').style.display='none'" style="position:absolute;top:18px;right:18px;z-index:10;width:32px;height:32px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;color:#fff;font-size:0.9rem;cursor:pointer;">✕</button>
    <img id="story-img" src="" alt="" style="max-width:100%;max-height:calc(100dvh - 70px);object-fit:contain;">
    <div id="story-info-txt" style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);font-size:0.82rem;color:rgba(255,255,255,0.55);white-space:nowrap;"></div>
  </div>`;
}

// ── EVENTS ────────────────────────────────────────────────
function wireAppEvents() {
  // Sign out / delete
  document.addEventListener('click', async (e) => {
    const id = e.target.id || e.target.closest('[id]')?.id;
    if (id === 'signout-btn') { await getSB().auth.signOut(); location.reload(); }
    if (id === 'del-acct-btn') {
      if (!confirm('Delete account and ALL data?')) return;
      showLoading('Deleting...');
      if (STATE.user) { try { await getSB().rpc('delete_user_data', { p_user_id: STATE.user.id }); } catch(e){} }
      await getSB().auth.signOut(); location.reload();
    }
    if (id === 'save-pr-btn') savePR();
    if (id === 'send-freq-btn') sendFriendReq();
    if (id === 'add-food-btn') addFoodToLog();
  });

  // Swipe
  let tx=0, ty=0;
  document.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, { passive:true });
  document.addEventListener('touchend', e => {
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)<44||Math.abs(dy)>Math.abs(dx)*.72) return;
    if(e.target.closest('[style*="overflow-x"]')) return;
    const idx=TABS.indexOf(STATE.currentTab||'home');
    if(dx<0&&idx<TABS.length-1) switchTab(TABS[idx+1]);
    if(dx>0&&idx>0) switchTab(TABS[idx-1]);
  }, { passive:true });

  // Leaderboard filters (delegated)
  document.addEventListener('click', e => {
    const lbf = e.target.closest('[data-s]');
    if (lbf) { document.querySelectorAll('[data-s]').forEach(b => b.classList.remove('active')); lbf.classList.add('active'); loadLeaderboard(lbf.dataset.s); }
  });
}

// ── TAB SWITCHING ─────────────────────────────────────────
function switchTab(name) {
  if (!TABS.includes(name)) return;
  const prev = STATE.currentTab || 'home';
  document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
  const pane = $(`tab-${name}`);
  if (pane) { pane.style.display = 'block'; pane.style.animation = 'tabIn 0.3s cubic-bezier(0.4,0,0.2,1)'; }
  document.querySelectorAll('.nav-btn').forEach(b => {
    const isActive = b.dataset.t === name;
    b.style.color = isActive ? '#6c63ff' : 'rgba(255,255,255,0.28)';
    const icon = b.querySelector('span:first-child');
    if (icon) icon.style.transform = isActive ? 'scale(1.15) translateY(-2px)' : '';
  });
  if ($('bar-title')) $('bar-title').textContent = BAR_TITLES[name] || name;
  STATE.currentTab = name;
  updateNavLine(name);
  if (name === 'home') refreshHome();
  if (name === 'workout') renderWorkoutPlan();
  if (name === 'diet') renderDietPlan();
  if (name === 'foodlog') renderFoodLog();
  if (name === 'profile') refreshProfile();
  setTimeout(() => revealAll(), 80);
}

function updateNavLine(name) {
  const idx = TABS.indexOf(name);
  const line = $('nav-line');
  if (!line || idx < 0) return;
  const pct = 100 / TABS.length;
  line.style.left = `${idx * pct}%`;
  line.style.width = `${pct}%`;
}

function openSideMenu() {
  const m = $('side-menu');
  if (m) m.style.left = '0';
  const o = $('side-overlay');
  if (o) o.style.display = 'block';
}

function closeSideMenu() {
  const m = $('side-menu');
  if (m) m.style.left = '-290px';
  const o = $('side-overlay');
  if (o) o.style.display = 'none';
}

function revealAll() {
  document.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 55); io.unobserve(e.target); } });
    }, { threshold: 0.04 });
    io.observe(el);
  });
}

// ── TIMER ─────────────────────────────────────────────────
let _timerSecs = 120, _timerLeft = 120, _timerRunning = false, _timerIv = null;
const TIMER_CIRC = 301;

function openRestTimer(s) { setTimerSecs(s || 120); $('timer-overlay').style.display = 'flex'; }
function setTimerSecs(s) {
  timerStop(); _timerSecs = s; _timerLeft = s;
  timerUpdateDisplay();
  document.querySelectorAll('.pre-btn').forEach(b => { b.style.background = parseInt(b.dataset.s)===s ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.05)'; b.style.borderColor = parseInt(b.dataset.s)===s ? '#6c63ff' : 'rgba(255,255,255,0.09)'; b.style.color = parseInt(b.dataset.s)===s ? '#a29bfe' : 'rgba(255,255,255,0.55)'; });
  const t = $('timer-toggle'); if(t) t.textContent = '▶ Start';
}
function timerUpdateDisplay() {
  $('timer-val').textContent = fmtTime(_timerLeft);
  const pct = _timerLeft / _timerSecs;
  $('tr-fill').style.strokeDashoffset = TIMER_CIRC - (TIMER_CIRC * pct);
}
function timerToggle() {
  if (_timerRunning) { timerStop(); } else { _timerRunning=true; $('timer-toggle').textContent='⏸ Pause'; _timerIv=setInterval(()=>{ if(_timerLeft<=0){timerStop();showToast('Rest done! 💪','success');return;} _timerLeft--;timerUpdateDisplay(); },1000); }
}
function timerStop() { clearInterval(_timerIv); _timerRunning=false; const t=$('timer-toggle'); if(t) t.textContent=_timerLeft<=0?'▶ Restart':'▶ Resume'; }
function timerReset() { timerStop(); _timerLeft=_timerSecs; timerUpdateDisplay(); const t=$('timer-toggle'); if(t) t.textContent='▶ Start'; }

// ── MISC ──────────────────────────────────────────────────
function scheduleReset() {
  const now=new Date(), mid=new Date(now); mid.setDate(mid.getDate()+1); mid.setHours(0,0,1,0);
  setTimeout(()=>{ if(typeof renderFoodLog==='function') renderFoodLog(); scheduleReset(); }, mid-now);
}

// CSS keyframes (injected once)
const _style = document.createElement('style');
_style.textContent = `
  @keyframes popIn{from{opacity:0;transform:translateY(28px) scale(0.96)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
  @keyframes slideUpMod{from{opacity:0;transform:translateY(80px)}to{opacity:1;transform:none}}
  @keyframes tabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes toastIn{from{opacity:0;transform:translateY(-12px) scale(0.95)}to{opacity:1;transform:none}}
  @keyframes celebBounce{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1)}}
  @keyframes confFall{to{transform:translateY(380px) rotate(720deg);opacity:0}}
  @keyframes sr{to{transform:rotate(360deg)}}
  @keyframes tdot{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes floatOrb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-30px) scale(1.05)}66%{transform:translate(-20px,20px) scale(0.95)}}
  .reveal{opacity:0;transform:translateY(16px);transition:opacity 0.44s cubic-bezier(0.4,0,0.2,1),transform 0.44s cubic-bezier(0.4,0,0.2,1);}
  .reveal.in{opacity:1;transform:none;}
  .sync-dot.syncing{animation:blinkDot 1s infinite;}
  @keyframes blinkDot{0%,100%{opacity:1}50%{opacity:0.3}}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  html,body{font-family:'DM Sans',sans-serif;background:#07070d;color:rgba(255,255,255,0.93);min-height:100dvh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
  h1,h2,h3,h4{font-family:'Space Grotesk',sans-serif;line-height:1.2;}
  ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px;}
  .ambient{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
  .orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:0.11;animation:floatOrb 20s ease-in-out infinite;}
  .o1{width:500px;height:500px;background:radial-gradient(circle,#6c63ff,transparent 70%);top:-200px;left:-100px;}
  .o2{width:400px;height:400px;background:radial-gradient(circle,#ff6584,transparent 70%);bottom:-100px;right:-100px;animation-delay:-7s;}
  .o3{width:300px;height:300px;background:radial-gradient(circle,#43d9ad,transparent 70%);top:50%;left:50%;animation-delay:-14s;}
  #particles{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
  #app,#onboarding,#auth-overlay{position:relative;z-index:1;}
  .glass-row{display:flex;gap:10px;} .glass-row > *{flex:1;}
`;
document.head.appendChild(_style);
