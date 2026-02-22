// main.js — Clickkearn single JavaScript file
// =============================================================================
// README / DEPLOYMENT NOTES
// =============================================================================
// Local deployment: Open index.html in any modern browser. No server needed.
// All data persists in localStorage. Sign up, complete tasks, watch wallet grow.
//
// TESTING 24-HOUR RENEWAL (faster testing):
//   1. Open browser DevTools → Application → Local Storage
//   2. Find key: clickkearn_tasks_[username]
//   3. Set "nextAvailable" for any task to a past timestamp (e.g., 0)
//   4. Reload page — task will be available immediately
//   Or run in console: resetTaskForTesting('task1') after signing in
//
// RESET ALL DEMO DATA:
//   Run in console: clearAllDemoData()
//
// =============================================================================
// SECURITY & PRODUCTION WARNINGS
// =============================================================================
// ⚠️  DEMO ONLY: All auth, wallet, and task data stored in localStorage.
//     This is NOT secure and must be replaced with:
//     - Server-side authentication with hashed passwords (bcrypt/argon2)
//     - Secure session tokens (JWT/HTTP-only cookies)
//     - Backend wallet/balance management with audit logs
//     - Real payment processors for withdrawals (Stripe, PayPal, etc.)
//     - Ad network server-side callbacks for click verification
//     - Fraud detection and anti-abuse systems
//
// ⚠️  AD CLICK VERIFICATION: Client-side heuristics here are INSUFFICIENT
//     for production. Ad networks provide server-side postback URLs and
//     callback verification. Always integrate those for real deployments.
//
// ⚠️  REAL MONEY FLOWS require backend infrastructure, compliance with ad
//     network terms of service, and legal/financial regulations.
// =============================================================================

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const AD_URL = 'https://www.effectivegatecpm.com/j0x5eg4ckv?key=05b4477084cb63a59e298132e509e2ea';
const REWARD_AMOUNT = 1.62;
const CLICKS_REQUIRED = 3;
const TASK_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const WITHDRAW_THRESHOLD = 110;
const AD_DWELL_MS = 2000; // Minimum dwell time in ms before click is counted

const TASKS = [
  { id: 'task1', title: 'Ad Task Alpha', description: 'Click all 3 ad links to earn $1.62' },
  { id: 'task2', title: 'Ad Task Beta',  description: 'Click all 3 ad links to earn $1.62' },
  { id: 'task3', title: 'Ad Task Gamma', description: 'Click all 3 ad links to earn $1.62' },
];

// ─── localStorage Key Helpers ─────────────────────────────────────────────────
const KEY = {
  session:   () => 'clickkearn_session',
  theme:     () => 'clickkearn_theme',
  users:     () => 'clickkearn_users',
  userData:  (u) => `clickkearn_user_${u}`,
  tasks:     (u) => `clickkearn_tasks_${u}`,
};

// ─── Utility ──────────────────────────────────────────────────────────────────
function simpleHash(str) {
  // DEMO ONLY: Not cryptographically secure. Production must use server-side bcrypt/argon2.
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(KEY.users()) || '{}');
}

function saveUsers(users) {
  localStorage.setItem(KEY.users(), JSON.stringify(users));
}

function getUserData(username) {
  const defaults = { balance: 0, transactions: [], withdrawRequests: [] };
  return JSON.parse(localStorage.getItem(KEY.userData(username)) || JSON.stringify(defaults));
}

function saveUserData(username, data) {
  localStorage.setItem(KEY.userData(username), JSON.stringify(data));
}

function getTaskData(username) {
  return JSON.parse(localStorage.getItem(KEY.tasks(username)) || '{}');
}

function saveTaskData(username, data) {
  localStorage.setItem(KEY.tasks(username), JSON.stringify(data));
}

function getSession() {
  return JSON.parse(localStorage.getItem(KEY.session()) || 'null');
}

function setSession(sessionObj) {
  localStorage.setItem(KEY.session(), JSON.stringify(sessionObj));
}

function clearSession() {
  localStorage.removeItem(KEY.session());
}

function getCurrentUser() {
  const session = getSession();
  if (!session || !session.username) return null;
  return session.username;
}

function getTheme() {
  return localStorage.getItem(KEY.theme()) || 'dark';
}

function setTheme(theme) {
  localStorage.setItem(KEY.theme(), theme);
}

// ─── Auth Functions ───────────────────────────────────────────────────────────
function registerUser(username, email, password) {
  // DEMO ONLY: Client-side registration. Production requires server-side handling.
  const users = getUsers();
  if (users[username]) return { success: false, error: 'Username already taken.' };
  if (Object.values(users).find(u => u.email === email)) {
    return { success: false, error: 'Email already registered.' };
  }
  users[username] = {
    username,
    email,
    // DEMO ONLY: Password stored as hash. Production must use server-side bcrypt.
    passwordHash: simpleHash(password),
    createdAt: Date.now(),
  };
  saveUsers(users);
  // Initialize user data
  saveUserData(username, { balance: 0, transactions: [], withdrawRequests: [] });
  saveTaskData(username, {});
  setSession({ username, token: simpleHash(username + Date.now()) });
  return { success: true };
}

function loginUser(usernameOrEmail, password) {
  // DEMO ONLY: Client-side login. Production requires server-side verification.
  const users = getUsers();
  let user = users[usernameOrEmail];
  if (!user) {
    user = Object.values(users).find(u => u.email === usernameOrEmail);
  }
  if (!user) return { success: false, error: 'User not found.' };
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password.' };
  }
  setSession({ username: user.username, token: simpleHash(user.username + Date.now()) });
  return { success: true, username: user.username };
}

function logoutUser() {
  clearSession();
  window.location.href = 'index.html';
}

function requireAuth(redirectBack) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// ─── Wallet Functions ─────────────────────────────────────────────────────────
function getBalance(username) {
  return getUserData(username).balance;
}

function credit(username, amount, metadata) {
  // DEMO ONLY: Client-side wallet credit. Production requires secure backend.
  const data = getUserData(username);
  data.balance = parseFloat((data.balance + amount).toFixed(2));
  data.transactions.push({
    id: 'txn_' + Date.now(),
    amount,
    ...metadata,
    timestamp: Date.now(),
  });
  saveUserData(username, data);
  return data.balance;
}

function addWithdrawRequest(username, amount) {
  // DEMO ONLY: Records withdrawal request locally.
  // Production requires secure backend, identity verification, and payment processor.
  const data = getUserData(username);
  data.withdrawRequests.push({
    id: 'wd_' + Date.now(),
    amount,
    status: 'pending',
    timestamp: Date.now(),
  });
  saveUserData(username, data);
}

// ─── Task Functions ───────────────────────────────────────────────────────────
function getTaskState(username, taskId) {
  const tasks = getTaskData(username);
  return tasks[taskId] || { clicks: [false, false, false], completed: false, nextAvailable: 0 };
}

function saveTaskState(username, taskId, state) {
  const tasks = getTaskData(username);
  tasks[taskId] = state;
  saveTaskData(username, tasks);
}

function isTaskAvailable(state) {
  if (!state.completed) return true;
  return Date.now() >= state.nextAvailable;
}

// Ad click pending dwell tracking
const pendingClicks = {}; // { [taskId_adIndex]: openedAt }

function handleAdClick(username, taskId, adIndex) {
  const state = getTaskState(username, taskId);

  // Task already completed and cooldown active
  if (state.completed && !isTaskAvailable(state)) return;

  // Reset state if task is available again after cooldown
  if (state.completed && isTaskAvailable(state)) {
    state.clicks = [false, false, false];
    state.completed = false;
    state.nextAvailable = 0;
  }

  // Already clicked this ad
  if (state.clicks[adIndex]) return;

  // Record open timestamp for dwell heuristic
  const dwellKey = `${taskId}_${adIndex}`;
  pendingClicks[dwellKey] = Date.now();

  // Open ad in new tab
  const adWin = window.open(AD_URL, '_blank');

  // Dwell heuristic: validate click after minimum dwell time
  // IMPORTANT: Client-side dwell check is best-effort only.
  // Production must use server-side ad network postback verification.
  const checkDwell = () => {
    const openedAt = pendingClicks[dwellKey];
    if (!openedAt) return;
    const elapsed = Date.now() - openedAt;
    if (elapsed >= AD_DWELL_MS) {
      delete pendingClicks[dwellKey];
      window.removeEventListener('focus', checkDwell);
      // Count the click
      const freshState = getTaskState(username, taskId);
      if (!freshState.clicks[adIndex]) {
        freshState.clicks[adIndex] = true;
        saveTaskState(username, taskId, freshState);

        const allClicked = freshState.clicks.every(c => c);
        if (allClicked) {
          completeTask(username, taskId);
        } else {
          renderTasks(username); // Refresh UI
        }
        renderTasks(username);
      }
    }
  };

  // Listen for window focus return
  window.addEventListener('focus', checkDwell);

  // Also check after delay (in case user returns quickly)
  setTimeout(() => {
    checkDwell();
    window.removeEventListener('focus', checkDwell);
  }, AD_DWELL_MS + 500);
}

function completeTask(username, taskId) {
  const state = getTaskState(username, taskId);
  state.completed = true;
  state.nextAvailable = Date.now() + TASK_COOLDOWN_MS;
  saveTaskState(username, taskId, state);

  // Credit wallet
  // DEMO ONLY: Client-side credit. Production requires backend verification.
  const newBalance = credit(username, REWARD_AMOUNT, {
    type: 'task_reward',
    taskId,
    description: `Completed ${taskId}`,
  });

  showToast(`✅ Task complete! +$${REWARD_AMOUNT.toFixed(2)} added to wallet.`, 'success');
  renderTasks(username);
  updateHeaderBalance(username);
}

// ─── UI Rendering ─────────────────────────────────────────────────────────────
function renderTasks(username) {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  container.innerHTML = '';

  TASKS.forEach(task => {
    const state = getTaskState(username, task.id);
    const available = isTaskAvailable(state);

    // Reset if renewal time passed
    if (state.completed && available) {
      state.clicks = [false, false, false];
      state.completed = false;
      saveTaskState(username, task.id, state);
    }

    const clickCount = state.clicks.filter(Boolean).length;
    const locked = state.completed && !available;

    const card = document.createElement('div');
    card.className = `task-card ${locked ? 'task-locked' : 'task-active'}`;
    card.innerHTML = `
      <div class="task-header">
        <span class="task-title">${task.title}</span>
        <span class="task-reward">$${REWARD_AMOUNT.toFixed(2)}</span>
      </div>
      <p class="task-desc">${task.description}</p>
      <div class="task-progress">
        <div class="progress-dots">
          ${[0,1,2].map(i => `<span class="dot ${state.clicks[i] ? 'dot-done' : ''}"></span>`).join('')}
        </div>
        <span class="progress-label">${clickCount}/${CLICKS_REQUIRED} clicks</span>
      </div>
      ${locked ? `
        <div class="task-countdown" data-task="${task.id}" data-next="${state.nextAvailable}">
          <span class="countdown-icon">⏳</span>
          <span class="countdown-text">Renews in <strong class="countdown-timer"></strong></span>
        </div>
      ` : `
        <div class="ad-links">
          ${[0,1,2].map(i => `
            <button 
              class="ad-btn ${state.clicks[i] ? 'ad-btn-done' : ''}" 
              data-task="${task.id}" 
              data-index="${i}"
              ${state.clicks[i] ? 'disabled' : ''}
              aria-label="Ad link ${i+1} for ${task.title}"
            >
              ${state.clicks[i] ? '✓ Clicked' : `Ad Link ${i+1} →`}
            </button>
          `).join('')}
        </div>
      `}
    `;

    container.appendChild(card);
    fadeIn(card);
  });

  // Attach ad button listeners
  container.querySelectorAll('.ad-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.task;
      const adIndex = parseInt(btn.dataset.index);
      handleAdClick(username, taskId, adIndex);
    });
  });

  // Start countdowns
  startCountdowns();
}

const countdownIntervals = [];

function startCountdowns() {
  countdownIntervals.forEach(id => clearInterval(id));
  countdownIntervals.length = 0;

  document.querySelectorAll('.task-countdown').forEach(el => {
    const nextAvailable = parseInt(el.dataset.next);
    const timerEl = el.querySelector('.countdown-timer');

    const update = () => {
      const remaining = nextAvailable - Date.now();
      if (remaining <= 0) {
        // Renewal — reload tasks
        const username = getCurrentUser();
        if (username) renderTasks(username);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      if (timerEl) timerEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    update();
    const id = setInterval(update, 1000);
    countdownIntervals.push(id);
  });
}

function updateHeaderBalance(username) {
  const balEl = document.getElementById('header-balance');
  if (balEl && username) {
    const bal = getBalance(username);
    balEl.textContent = `$${bal.toFixed(2)}`;
  }
}

function updateHeaderAuth(username) {
  const guestNav = document.getElementById('guest-nav');
  const userNav  = document.getElementById('user-nav');
  const greeting = document.getElementById('user-greeting');

  if (username) {
    if (guestNav) guestNav.style.display = 'none';
    if (userNav)  userNav.style.display  = 'flex';
    if (greeting) greeting.textContent = `Welcome, ${username}`;
    updateHeaderBalance(username);
  } else {
    if (guestNav) guestNav.style.display = 'flex';
    if (userNav)  userNav.style.display  = 'none';
  }
}

// ─── Wallet Page ──────────────────────────────────────────────────────────────
function initWallet() {
  const username = requireAuth();
  if (!username) return;

  updateHeaderAuth(username);
  renderWallet(username);

  const withdrawBtn = document.getElementById('withdraw-btn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', () => {
      const data = getUserData(username);
      if (data.balance < WITHDRAW_THRESHOLD) return;
      // DEMO ONLY: Records withdrawal request. Production requires secure backend + payment processor.
      addWithdrawRequest(username, data.balance);
      showToast('Withdrawal request submitted (demo). Real payouts require backend processing.', 'info');
      renderWallet(username);
    });
  }
}

function renderWallet(username) {
  const data = getUserData(username);

  const balEl = document.getElementById('wallet-balance');
  if (balEl) balEl.textContent = `$${data.balance.toFixed(2)}`;

  const withdrawBtn = document.getElementById('withdraw-btn');
  const withdrawMsg = document.getElementById('withdraw-msg');
  if (withdrawBtn) {
    if (data.balance >= WITHDRAW_THRESHOLD) {
      withdrawBtn.disabled = false;
      withdrawBtn.classList.remove('btn-disabled');
      if (withdrawMsg) withdrawMsg.textContent = '';
    } else {
      withdrawBtn.disabled = true;
      withdrawBtn.classList.add('btn-disabled');
      const needed = (WITHDRAW_THRESHOLD - data.balance).toFixed(2);
      if (withdrawMsg) withdrawMsg.textContent = `Need $${needed} more to withdraw (min $${WITHDRAW_THRESHOLD})`;
    }
  }

  const txList = document.getElementById('tx-list');
  if (txList) {
    txList.innerHTML = '';
    if (data.transactions.length === 0) {
      txList.innerHTML = '<p class="empty-state">No transactions yet. Complete tasks to earn!</p>';
    } else {
      [...data.transactions].reverse().forEach(tx => {
        const li = document.createElement('div');
        li.className = 'tx-item';
        li.innerHTML = `
          <div class="tx-info">
            <span class="tx-desc">${tx.description || tx.type}</span>
            <span class="tx-id">${tx.id}</span>
            <span class="tx-date">${new Date(tx.timestamp).toLocaleString()}</span>
          </div>
          <span class="tx-amount">+$${tx.amount.toFixed(2)}</span>
        `;
        txList.appendChild(li);
        fadeIn(li);
      });
    }

    // Withdraw history
    const wdList = document.getElementById('wd-list');
    if (wdList) {
      wdList.innerHTML = '';
      if (data.withdrawRequests.length === 0) {
        wdList.innerHTML = '<p class="empty-state">No withdrawal requests.</p>';
      } else {
        [...data.withdrawRequests].reverse().forEach(wd => {
          const li = document.createElement('div');
          li.className = 'tx-item';
          li.innerHTML = `
            <div class="tx-info">
              <span class="tx-desc">Withdrawal Request</span>
              <span class="tx-id">${wd.id}</span>
              <span class="tx-date">${new Date(wd.timestamp).toLocaleString()}</span>
            </div>
            <span class="tx-amount wd-amount">-$${wd.amount.toFixed(2)}</span>
          `;
          wdList.appendChild(li);
        });
      }
    }
  }
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function initSettings() {
  const username = requireAuth();
  if (!username) return;
  updateHeaderAuth(username);

  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel  = document.getElementById('theme-label');

  if (themeToggle) {
    const current = getTheme();
    themeToggle.checked = current === 'light';
    if (themeLabel) themeLabel.textContent = current === 'light' ? 'Light Mode' : 'Dark Mode';

    themeToggle.addEventListener('change', () => {
      const newTheme = themeToggle.checked ? 'light' : 'dark';
      setTheme(newTheme);
      applyTheme(newTheme);
      if (themeLabel) themeLabel.textContent = newTheme === 'light' ? 'Light Mode' : 'Dark Mode';
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }

  // Account info display
  const users = getUsers();
  const user = users[username];
  if (user) {
    const emailEl = document.getElementById('settings-email');
    const userEl  = document.getElementById('settings-username');
    if (emailEl) emailEl.textContent = user.email;
    if (userEl)  userEl.textContent  = user.username;
  }
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function initLanding() {
  const username = getCurrentUser();
  updateHeaderAuth(username);

  const landingPublic = document.getElementById('landing-public');
  const landingAuthed = document.getElementById('landing-authed');

  if (username) {
    if (landingPublic) landingPublic.style.display = 'none';
    if (landingAuthed) { landingAuthed.style.display = 'block'; fadeIn(landingAuthed); }
    const welcomeEl = document.getElementById('welcome-username');
    if (welcomeEl) welcomeEl.textContent = username;
    renderTasks(username);
  } else {
    if (landingPublic) { landingPublic.style.display = 'block'; fadeIn(landingPublic); }
    if (landingAuthed) landingAuthed.style.display = 'none';
  }

  // Sign up form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      const err = validateSignup(username, email, password);
      if (err) { showFormError('signup-error', err); return; }

      const result = registerUser(username, email, password);
      if (result.success) {
        showToast('Account created! Welcome to Clickkearn.', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showFormError('signup-error', result.error);
      }
    });
  }

  // Sign in form
  const signinForm = document.getElementById('signin-form');
  if (signinForm) {
    signinForm.addEventListener('submit', e => {
      e.preventDefault();
      const id  = document.getElementById('signin-id').value.trim();
      const pwd = document.getElementById('signin-password').value;

      if (!id || !pwd) { showFormError('signin-error', 'All fields required.'); return; }

      const result = loginUser(id, pwd);
      if (result.success) {
        showToast(`Welcome back, ${result.username}!`, 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showFormError('signin-error', result.error);
      }
    });
  }

  // Tab switching
  const tabSignup = document.getElementById('tab-signup');
  const tabSignin = document.getElementById('tab-signin');
  const formSignup = document.getElementById('form-signup');
  const formSignin = document.getElementById('form-signin');

  if (tabSignup && tabSignin) {
    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('tab-active');
      tabSignin.classList.remove('tab-active');
      formSignup.style.display = 'block';
      formSignin.style.display = 'none';
      fadeIn(formSignup);
    });
    tabSignin.addEventListener('click', () => {
      tabSignin.classList.add('tab-active');
      tabSignup.classList.remove('tab-active');
      formSignin.style.display = 'block';
      formSignup.style.display = 'none';
      fadeIn(formSignin);
    });
  }
}

function validateSignup(username, email, password) {
  if (!username || username.length < 3) return 'Username must be at least 3 characters.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  if (!password || password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark-mode');
  } else {
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('light-mode');
  }
}

// ─── Animations ───────────────────────────────────────────────────────────────
function fadeIn(el, duration = 300) {
  if (!el) return;
  el.style.opacity = '0';
  el.style.transform = 'translateY(8px)';
  el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });
}

function fadeOut(el, duration = 300, cb) {
  if (!el) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = '0';
  setTimeout(() => { if (cb) cb(); }, duration);
}

function slideIn(el, direction = 'left', duration = 400) {
  if (!el) return;
  const tx = direction === 'left' ? '-24px' : '24px';
  el.style.opacity = '0';
  el.style.transform = `translateX(${tx})`;
  el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
  });
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;

  container.appendChild(toast);
  fadeIn(toast, 200);

  setTimeout(() => {
    fadeOut(toast, 300, () => toast.remove());
  }, 3500);
}

function showFormError(elId, message) {
  const el = document.getElementById(elId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    fadeIn(el, 200);
    setTimeout(() => { el.textContent = ''; el.style.display = 'none'; }, 4000);
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
function setupSignOutBtn() {
  document.querySelectorAll('.signout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      logoutUser();
    });
  });
}

// ─── Static Page Inits ────────────────────────────────────────────────────────
function initPrivacy()  { updateHeaderAuth(getCurrentUser()); }
function initContact()  {
  updateHeaderAuth(getCurrentUser());
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      showToast('Message sent! (Demo — no backend connected)', 'success');
      form.reset();
    });
  }
}
function initTerms()    { updateHeaderAuth(getCurrentUser()); }
function initAbout()    { updateHeaderAuth(getCurrentUser()); }

// ─── Main Router ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply theme on every page load
  applyTheme(getTheme());

  // Setup global sign-out buttons
  setupSignOutBtn();

  // Page router using body data-page attribute
  const page = document.body.getAttribute('data-page') || 'landing';

  switch (page) {
    case 'landing':  initLanding();  break;
    case 'wallet':   initWallet();   break;
    case 'settings': initSettings(); break;
    case 'privacy':  initPrivacy();  break;
    case 'contact':  initContact();  break;
    case 'terms':    initTerms();    break;
    case 'about':    initAbout();    break;
  }

  // Animate page entry
  const main = document.querySelector('main');
  if (main) fadeIn(main, 400);
});

// ─── Debug Helpers ────────────────────────────────────────────────────────────
window.resetTaskForTesting = function(taskId) {
  const username = getCurrentUser();
  if (!username) { console.warn('Not logged in'); return; }
  const tasks = getTaskData(username);
  if (tasks[taskId]) {
    tasks[taskId].nextAvailable = 0;
    tasks[taskId].completed = false;
    tasks[taskId].clicks = [false, false, false];
    saveTaskData(username, tasks);
    console.log(`Task ${taskId} reset for testing.`);
    if (document.body.getAttribute('data-page') === 'landing') renderTasks(username);
  }
};

window.clearAllDemoData = function() {
  localStorage.clear();
  console.log('All demo data cleared. Reload the page.');
  window.location.reload();
};
