/* =========================================================
   CLICKKEARN — app.js
   Single JS file controlling all pages
   ========================================================= */

// ── Constants ──────────────────────────────────────────────
const EARN_PER_TASK   = 0.82;
const WITHDRAW_MIN    = 110;
const ADS_REQUIRED    = 3;

// ── Storage helpers ────────────────────────────────────────
const store = {
  get: (k, fallback = null) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  clear: () => localStorage.clear()
};

// ── Auth helpers ───────────────────────────────────────────
const getUser    = ()      => store.get('ck_user', null);
const setUser    = (u)     => store.set('ck_user', u);
const isLoggedIn = ()      => !!getUser();

function requireAuth() {
  if (!isLoggedIn()) { window.location.href = 'login.html'; }
}
function redirectIfAuth() {
  if (isLoggedIn()) { window.location.href = 'index.html'; }
}

// ── Balance helpers ────────────────────────────────────────
function getBalance() { return parseFloat(store.get('ck_balance', 0)); }
function addBalance(amt) {
  const nb = +(getBalance() + amt).toFixed(2);
  store.set('ck_balance', nb);
  return nb;
}

// ── Tasks ──────────────────────────────────────────────────
const TASKS_DATA = [
  { id: 1, title: 'Watch & Earn — Tech News',     desc: 'View 3 sponsored tech articles and earn your reward.',       icon: '🖥️' },
  { id: 2, title: 'Survey Boost',                  desc: 'Complete 3 ad impressions from our survey partners.',        icon: '📊' },
  { id: 3, title: 'Product Discovery',             desc: 'Explore 3 featured products through partner ads.',           icon: '🛍️' },
  { id: 4, title: 'Finance Insights',              desc: 'View 3 financial offer ads to unlock your earnings.',        icon: '💳' },
  { id: 5, title: 'Gaming Offers',                 desc: 'Interact with 3 gaming sponsor ads to get paid.',            icon: '🎮' },
  { id: 6, title: 'Health & Wellness',             desc: 'Browse 3 health-related sponsored posts.',                   icon: '💊' },
  { id: 7, title: 'Travel Deals',                  desc: 'View 3 travel partner advertisements.',                      icon: '✈️' },
  { id: 8, title: 'Crypto Awareness',              desc: 'Engage with 3 crypto education ads.',                        icon: '₿'  },
  { id: 9, title: 'App Spotlight',                 desc: 'Discover 3 featured mobile apps via sponsored ads.',         icon: '📱' },
  { id:10, title: 'E-Commerce Explorer',           desc: 'Browse 3 e-commerce partner promotions.',                    icon: '🛒' },
];

function getCompletedTasks() { return store.get('ck_completed', []); }
function markTaskComplete(id) {
  const done = getCompletedTasks();
  if (!done.includes(id)) { done.push(id); store.set('ck_completed', done); }
}

// ── Dark mode ──────────────────────────────────────────────
function getDarkMode() { return store.get('ck_dark', true); }
function setDarkMode(v) { store.set('ck_dark', v); applyDarkMode(v); }
function applyDarkMode(dark) {
  document.documentElement.classList.toggle('dark', dark);
}
function initDarkMode() { applyDarkMode(getDarkMode()); }

// ── Toast notifications ────────────────────────────────────
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `ck-toast ck-toast--${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 50);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
}

// ── Animate on scroll ──────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ── Nav active link ────────────────────────────────────────
function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('nav-active', a.dataset.nav === path);
  });
}

// ── Update nav wallet badge ────────────────────────────────
function updateNavBalance() {
  const el = document.getElementById('nav-balance');
  if (el) el.textContent = `$${getBalance().toFixed(2)}`;
}

// ── Sidebar / Mobile menu ──────────────────────────────────
function initMobileMenu() {
  const btn  = document.getElementById('menu-toggle');
  const side = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !side) return;
  btn.addEventListener('click', () => {
    side.classList.toggle('open');
    overlay && overlay.classList.toggle('active');
  });
  overlay && overlay.addEventListener('click', () => {
    side.classList.remove('open');
    overlay.classList.remove('active');
  });
}

// ── Cursor glow ───────────────────────────────────────────
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

// ── Number counter animation ───────────────────────────────
function animateCount(el, target, duration = 1200, prefix = '$') {
  const start = performance.now();
  const from  = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + (from + (target - from) * ease).toFixed(2);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ────────────────────────────────────────────────────────────
//  PAGE: signup.html
// ────────────────────────────────────────────────────────────
function initSignupPage() {
  redirectIfAuth();
  const form = document.getElementById('signup-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('su-username').value.trim();
    const email    = document.getElementById('su-email').value.trim();
    const password = document.getElementById('su-password').value;
    const confirm  = document.getElementById('su-confirm').value;

    if (!username || !email || !password) return showToast('All fields are required.', 'error');
    if (password !== confirm)             return showToast('Passwords do not match.', 'error');
    if (password.length < 6)             return showToast('Password must be 6+ chars.', 'error');

    setUser({ username, email, password });
    store.set('ck_balance', 0);
    store.set('ck_completed', []);
    showToast(`Welcome aboard, ${username}! 🚀`);
    setTimeout(() => window.location.href = 'index.html', 1200);
  });
}

// ────────────────────────────────────────────────────────────
//  PAGE: login.html
// ────────────────────────────────────────────────────────────
function initLoginPage() {
  redirectIfAuth();
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email    = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-password').value;
    const user     = getUser();

    if (!user)                           return showToast('No account found. Sign up first.', 'error');
    if (user.email !== email)            return showToast('Email not found.', 'error');
    if (user.password !== password)      return showToast('Incorrect password.', 'error');

    showToast(`Welcome back, ${user.username}! ⚡`);
    setTimeout(() => window.location.href = 'index.html', 1000);
  });
}

// ────────────────────────────────────────────────────────────
//  PAGE: index.html (dashboard)
// ────────────────────────────────────────────────────────────
function initDashboard() {
  requireAuth();
  const user = getUser();
  const welcomeEl = document.getElementById('welcome-name');
  if (welcomeEl) welcomeEl.textContent = user.username;

  // Stats
  const balEl    = document.getElementById('stat-balance');
  const taskEl   = document.getElementById('stat-tasks');
  const pendEl   = document.getElementById('stat-pending');
  const done     = getCompletedTasks();
  const pending  = TASKS_DATA.length - done.length;

  if (balEl)  animateCount(balEl, getBalance());
  if (taskEl) { taskEl.textContent = '0'; setTimeout(() => animateCount(taskEl, done.length, 800, ''), 200); }
  if (pendEl) { pendEl.textContent = '0'; setTimeout(() => animateCount(pendEl, pending, 800, ''), 400); }

  updateNavBalance();
}

// ────────────────────────────────────────────────────────────
//  PAGE: tasks.html
// ────────────────────────────────────────────────────────────
let activeTaskId    = null;
let adClickCount    = 0;
let adTimerInterval = null;

function initTasksPage() {
  requireAuth();
  updateNavBalance();
  renderTaskList();
}

function renderTaskList() {
  const container = document.getElementById('tasks-container');
  if (!container) return;
  const done = getCompletedTasks();
  container.innerHTML = '';

  TASKS_DATA.forEach(task => {
    const isDone = done.includes(task.id);
    const card = document.createElement('div');
    card.className = `task-card ${isDone ? 'task-done' : ''}`;
    card.setAttribute('data-reveal', '');
    card.innerHTML = `
      <div class="task-icon">${task.icon}</div>
      <div class="task-info">
        <h3 class="task-title">${task.title}</h3>
        <p class="task-desc">${task.desc}</p>
        <div class="task-reward"><span class="reward-badge">+$${EARN_PER_TASK}</span></div>
      </div>
      <div class="task-action">
        ${isDone
          ? `<button class="btn btn-done" disabled>✅ Completed</button>`
          : `<button class="btn btn-start" onclick="openTaskModal(${task.id})">▶ Start Task</button>`
        }
      </div>`;
    container.appendChild(card);
  });
  initScrollReveal();
}

function openTaskModal(id) {
  activeTaskId  = id;
  adClickCount  = 0;
  const task    = TASKS_DATA.find(t => t.id === id);
  const modal   = document.getElementById('task-modal');
  const mTitle  = document.getElementById('modal-task-title');
  const mDesc   = document.getElementById('modal-task-desc');
  if (!modal || !task) return;

  mTitle.textContent = task.title;
  mDesc.textContent  = task.desc;
  updateAdProgress();
  modal.classList.add('active');
  renderAdButtons();
}

function closeTaskModal() {
  document.getElementById('task-modal')?.classList.remove('active');
  clearInterval(adTimerInterval);
  activeTaskId = null;
  adClickCount = 0;
}

function renderAdButtons() {
  const container = document.getElementById('ad-buttons');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < ADS_REQUIRED; i++) {
    const btn = document.createElement('button');
    btn.id = `ad-btn-${i}`;
    btn.className = 'ad-btn';
    btn.disabled = adClickCount !== i;
    btn.innerHTML = `
      <span class="ad-num">${i + 1}</span>
      <span class="ad-label">Sponsored Ad #${i + 1}</span>
      <span class="ad-action">${adClickCount > i ? '✓ Viewed' : adClickCount === i ? 'Click to View →' : 'Locked'}</span>`;
    if (adClickCount > i) btn.classList.add('ad-viewed');
    btn.addEventListener('click', () => handleAdClick(i));
    container.appendChild(btn);
  }
}

function handleAdClick(index) {
  if (adClickCount !== index) return;
  const btn = document.getElementById(`ad-btn-${index}`);
  btn.disabled = true;
  btn.innerHTML = `<span class="ad-num">⏳</span><span class="ad-label">Loading Ad...</span><span class="ad-action">Please wait</span>`;

  // Simulate ad loading
  let sec = 5;
  adTimerInterval = setInterval(() => {
    btn.querySelector('.ad-label').textContent = `Viewing Ad... (${sec}s)`;
    sec--;
    if (sec < 0) {
      clearInterval(adTimerInterval);
      adClickCount++;
      updateAdProgress();
      renderAdButtons();
      if (adClickCount >= ADS_REQUIRED) completeTask();
    }
  }, 1000);
}

function updateAdProgress() {
  const bar   = document.getElementById('ad-progress-bar');
  const count = document.getElementById('ad-count-text');
  if (bar)   bar.style.width = `${(adClickCount / ADS_REQUIRED) * 100}%`;
  if (count) count.textContent = `${adClickCount} / ${ADS_REQUIRED} Ads Viewed`;
}

function completeTask() {
  markTaskComplete(activeTaskId);
  const newBal = addBalance(EARN_PER_TASK);
  updateNavBalance();
  closeTaskModal();
  showToast(`🎉 Task complete! +$${EARN_PER_TASK} added to your wallet!`);
  renderTaskList();

  // Confetti burst
  launchConfetti();

  // Update balance in nav
  setTimeout(() => {
    const balEl = document.getElementById('nav-balance');
    if (balEl) animateCount(balEl, newBal);
  }, 500);
}

function launchConfetti() {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random()*100}vw;
      background:${['#00f5ff','#00ff88','#f5c842','#ff6b6b','#c084fc'][Math.floor(Math.random()*5)]};
      animation-duration:${0.8+Math.random()*1.4}s;
      animation-delay:${Math.random()*0.4}s;
      width:${6+Math.random()*8}px;
      height:${6+Math.random()*8}px;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ────────────────────────────────────────────────────────────
//  PAGE: wallet.html
// ────────────────────────────────────────────────────────────
function initWalletPage() {
  requireAuth();
  const user = getUser();
  const bal  = getBalance();

  const nameEl   = document.getElementById('wallet-username');
  const balEl    = document.getElementById('wallet-balance');
  const progEl   = document.getElementById('withdraw-progress');
  const pctEl    = document.getElementById('progress-pct');
  const wdBtn    = document.getElementById('withdraw-btn');
  const wdNote   = document.getElementById('withdraw-note');

  if (nameEl) nameEl.textContent = user.username;

  if (balEl) {
    balEl.textContent = '$0.00';
    setTimeout(() => animateCount(balEl, bal), 400);
  }

  const pct = Math.min((bal / WITHDRAW_MIN) * 100, 100);
  if (progEl) setTimeout(() => { progEl.style.width = pct + '%'; }, 300);
  if (pctEl)  pctEl.textContent = pct.toFixed(1) + '%';

  if (wdBtn) {
    if (bal >= WITHDRAW_MIN) {
      wdBtn.disabled = false;
      wdBtn.classList.add('btn-ready');
      wdBtn.textContent = '🚀 Withdraw Now';
      wdBtn.addEventListener('click', handleWithdraw);
    } else {
      wdBtn.disabled = true;
      const remaining = (WITHDRAW_MIN - bal).toFixed(2);
      if (wdNote) wdNote.textContent = `Earn $${remaining} more to unlock withdrawal.`;
    }
  }

  // Transaction history
  renderTransactionHistory();
  updateNavBalance();
}

function renderTransactionHistory() {
  const container = document.getElementById('tx-list');
  if (!container) return;
  const done = getCompletedTasks();
  if (!done.length) {
    container.innerHTML = '<p class="tx-empty">No transactions yet. Complete tasks to earn!</p>';
    return;
  }
  container.innerHTML = done.map((id, i) => {
    const task = TASKS_DATA.find(t => t.id === id);
    return `<div class="tx-item" data-reveal="">
      <span class="tx-icon">${task ? task.icon : '💰'}</span>
      <span class="tx-label">${task ? task.title : 'Task'}</span>
      <span class="tx-amount">+$${EARN_PER_TASK}</span>
    </div>`;
  }).join('');
  initScrollReveal();
}

function handleWithdraw() {
  const modal = document.getElementById('withdraw-modal');
  if (modal) modal.classList.add('active');
}

function closeWithdrawModal() {
  document.getElementById('withdraw-modal')?.classList.remove('active');
}

function submitWithdraw() {
  const method = document.getElementById('wd-method').value;
  const addr   = document.getElementById('wd-address').value.trim();
  if (!addr) return showToast('Please enter your payment address.', 'error');
  closeWithdrawModal();
  showToast('✅ Withdrawal request submitted! Processing in 24-48 hrs.');
}

// ────────────────────────────────────────────────────────────
//  PAGE: settings.html
// ────────────────────────────────────────────────────────────
function initSettingsPage() {
  requireAuth();
  const user = getUser();
  updateNavBalance();

  const unameEl  = document.getElementById('s-username');
  const emailEl  = document.getElementById('s-email');
  const darkTog  = document.getElementById('dark-mode-toggle');
  const saveBtn  = document.getElementById('save-profile-btn');
  const logoutBtn= document.getElementById('logout-btn');
  const delBtn   = document.getElementById('delete-account-btn');

  if (unameEl) unameEl.value = user.username;
  if (emailEl) emailEl.value = user.email;
  if (darkTog) { darkTog.checked = getDarkMode(); darkTog.addEventListener('change', () => setDarkMode(darkTog.checked)); }

  saveBtn?.addEventListener('click', () => {
    const newName = unameEl.value.trim();
    const newEmail= emailEl.value.trim();
    if (!newName || !newEmail) return showToast('Fields cannot be empty.', 'error');
    const u = getUser();
    setUser({ ...u, username: newName, email: newEmail });
    showToast('Profile updated successfully! ✅');
  });

  logoutBtn?.addEventListener('click', () => {
    showToast('Signing out... 👋');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
  });

  delBtn?.addEventListener('click', () => {
    if (confirm('Are you sure? This will erase all your data and earnings.')) {
      store.clear();
      window.location.href = 'signup.html';
    }
  });
}

// ────────────────────────────────────────────────────────────
//  PAGE: contact.html
// ────────────────────────────────────────────────────────────
function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('Message sent! We\'ll reply within 24 hours. 📬');
    form.reset();
  });
}

// ────────────────────────────────────────────────────────────
//  Shared nav sign-out
// ────────────────────────────────────────────────────────────
function initNavSignout() {
  const btn = document.getElementById('nav-signout');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    showToast('Signed out. See you soon! 👋');
    setTimeout(() => window.location.href = 'login.html', 1000);
  });
}

// ────────────────────────────────────────────────────────────
//  Particle canvas background
// ────────────────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticles() {
    particles = Array.from({length: 60}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random()
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dark = getDarkMode();
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `rgba(0,245,255,${p.a * 0.6})` : `rgba(0,100,200,${p.a * 0.3})`;
      ctx.fill();
    });
    // Lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i+1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = dark
            ? `rgba(0,245,255,${0.15*(1-dist/100)})`
            : `rgba(0,100,200,${0.08*(1-dist/100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  makeParticles();
  draw();
  window.addEventListener('resize', () => { resize(); makeParticles(); });
}

// ────────────────────────────────────────────────────────────
//  INIT — detect current page and run appropriate inits
// ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initCursorGlow();
  initParticles();
  initScrollReveal();
  highlightNav();
  initMobileMenu();
  initNavSignout();

  const page = location.pathname.split('/').pop() || 'index.html';

  switch (page) {
    case 'index.html':    case '': initDashboard();    break;
    case 'signup.html':            initSignupPage();   break;
    case 'login.html':             initLoginPage();    break;
    case 'tasks.html':             initTasksPage();    break;
    case 'wallet.html':            initWalletPage();   break;
    case 'settings.html':          initSettingsPage(); break;
    case 'contact.html':           initContactPage();  break;
  }

  // Stagger reveal for hero elements
  document.querySelectorAll('[data-stagger]').forEach((el, i) => {
    el.style.animationDelay = (i * 0.12) + 's';
    el.classList.add('stagger-in');
  });
});
