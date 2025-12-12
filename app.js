// ===== Firebase Init =====
const firebaseConfig = {
  apiKey: "AIzaSyDMSPQN0kUFsZe9km7g7TCB7g39T9XkGGg",
  authDomain: "presenter-488c6.firebaseapp.com",
  projectId: "presenter-488c6",
  storageBucket: "presenter-488c6.firebasestorage.app",
  messagingSenderId: "758661053627",
  appId: "1:758661053627:web:1c08b776ba5fd248b7fd9e"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ===== DOM =====
const songListDiv = document.getElementById('songList');
const searchInput = document.getElementById('search');
const menuDiv = document.getElementById('menu');
const presDiv = document.getElementById('presentation');
const slideTitle = document.getElementById('slideTitle');
const slideText = document.getElementById('slideText');
const nextPreview = document.getElementById('nextPreview');
const nextSlideText = document.getElementById('nextSlideText');
const backBtn = document.getElementById('backBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const decreaseFontBtn = document.getElementById('decreaseFont');
const resetFontBtn = document.getElementById('resetFont');
const increaseFontBtn = document.getElementById('increaseFont');
const loadingIndicator = document.getElementById('loadingIndicator');
const userInfo = document.getElementById('userInfo');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');
const projectBtn = document.getElementById('projectBtn');
const blackScreenBtn = document.getElementById('blackScreenBtn');
const presenterToggle = document.getElementById('presenterToggle');
const blackBadge = document.getElementById('blackBadge');

// create or reference auth control container (will host Sign In / Sign Up / Sign Out)
let authControls = document.getElementById('authControls');
if (!authControls) {
  authControls = document.createElement('div');
  authControls.id = 'authControls';
  authControls.className = 'auth-controls';
  // append near top of menu (if available) else to body
  const header = document.querySelector('header') || document.body;
  header.appendChild(authControls);
}

// ===== State =====
let songsIndex = [];               // [{title, author, file}]
let songsData = {};                // cache: { fileName: songJson }
let currentSong = null;
let currentSlide = 0;
let currentFontSize = 100;
let currentTheme = localStorage.getItem('theme') || 'dark';
let projectorWindow = null;
let presenterMode = true;          // ✅ ON by default now
let blackedOut = false;            // projector black screen

// ===== Theme =====
function applyTheme(theme) {
  if (theme === 'blue') {
    document.body.classList.add('blue-theme');
    if (themeIcon) themeIcon.textContent = '🌞';
  } else {
    document.body.classList.remove('blue-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
  }
  currentTheme = theme;
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'blue' : 'dark');
}
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

// ===== Fonts =====
function updateFontSize() {
  if (slideText) slideText.style.fontSize = `${currentFontSize}%`;
  if (nextSlideText) nextSlideText.style.fontSize = `${Math.round(currentFontSize * 0.8)}%`;
}
decreaseFontBtn && (decreaseFontBtn.onclick = () => { if (currentFontSize > 50) { currentFontSize -= 10; updateFontSize(); } });
increaseFontBtn && (increaseFontBtn.onclick = () => { if (currentFontSize < 300) { currentFontSize += 10; updateFontSize(); } });
resetFontBtn && (resetFontBtn.onclick = () => { currentFontSize = 100; updateFontSize(); });

// ===== Auth UI (create modals + buttons) =====
createAuthUi();

function createAuthUi() {
  // Buttons (Sign In, Sign Up, Sign Out). If authControls empty, populate.
  authControls.innerHTML = `
    <button id="signInBtn">Sign In</button>
    <button id="signUpBtn">Sign Up</button>
    <button id="signOutBtn" style="display:none;">Sign Out</button>
  `;

  // Modals: signup + signin
  const signupModal = document.createElement('div');
  signupModal.id = 'signupModal';
  signupModal.className = 'modal';
  signupModal.style.display = 'none';
  signupModal.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="signupTitle">
      <h3 id="signupTitle">Create account</h3>
      <input id="signupEmail" type="email" placeholder="Email" />
      <input id="signupPassword" type="password" placeholder="Password (6+ chars)" />
      <div id="signupError" role="alert" style="color:#c33;"></div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button id="signupSubmit">Create account</button>
        <button id="signupCancel">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(signupModal);

  const signinModal = document.createElement('div');
  signinModal.id = 'signinModal';
  signinModal.className = 'modal';
  signinModal.style.display = 'none';
  signinModal.innerHTML = `
    <div class="modal-content" role="dialog" aria-labelledby="signinTitle">
      <h3 id="signinTitle">Sign in</h3>
      <input id="signinEmail" type="email" placeholder="Email" />
      <input id="signinPassword" type="password" placeholder="Password" />
      <div id="signinError" role="alert" style="color:#c33;"></div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button id="signinSubmit">Sign In</button>
        <button id="signinCancel">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(signinModal);

  // Wire buttons
  document.getElementById('signUpBtn').addEventListener('click', () => { signupModal.style.display = 'flex'; });
  document.getElementById('signInBtn').addEventListener('click', () => { signinModal.style.display = 'flex'; });

  // Cancel handlers
  signupModal.addEventListener('click', (e) => { if (e.target === signupModal) signupModal.style.display = 'none'; });
  signinModal.addEventListener('click', (e) => { if (e.target === signinModal) signinModal.style.display = 'none'; });
  document.getElementById('signupCancel').addEventListener('click', () => signupModal.style.display = 'none');
  document.getElementById('signinCancel').addEventListener('click', () => signinModal.style.display = 'none');

  // Submit handlers
  document.getElementById('signupSubmit').addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errEl = document.getElementById('signupError');
    errEl.textContent = '';
    if (!email || !password) { errEl.textContent = 'Enter email and password'; return; }
    try {
      loadingIndicator && (loadingIndicator.style.display = 'inline-block');
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      // Optionally set displayName: use local part of email
      const user = userCredential.user;
      if (user && !user.displayName) {
        const displayName = email.split('@')[0];
        try { await user.updateProfile({ displayName }); } catch (e) { /* ignore */ }
      }
      signupModal.style.display = 'none';
    } catch (err) {
      console.error('Signup error', err);
      errEl.textContent = err.message || 'Signup failed';
    } finally {
      loadingIndicator && (loadingIndicator.style.display = 'none');
    }
  });

  document.getElementById('signinSubmit').addEventListener('click', async () => {
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    const errEl = document.getElementById('signinError');
    errEl.textContent = '';
    try {
      loadingIndicator && (loadingIndicator.style.display = 'inline-block');
      await auth.signInWithEmailAndPassword(email, password);
      signinModal.style.display = 'none';
    } catch (err) {
      console.error('Signin error', err);
      errEl.textContent = err.message || 'Sign in failed';
    } finally {
      loadingIndicator && (loadingIndicator.style.display = 'none');
    }
  });

  // Sign out button
  document.getElementById('signOutBtn').addEventListener('click', () => auth.signOut());
}

// ===== Auth state handling =====
// Note: do NOT redirect away. Show the auth UI when logged out so Sign Up is visible.
auth.onAuthStateChanged(user => {
  if (user) {
    // Show user info and sign out
    userInfo.innerHTML = `
      <div class="user-info">
        <span class="username">${user.displayName || user.email}</span>
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </div>`;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

    // UI toggles
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    if (signInBtn) signInBtn.style.display = 'none';
    if (signUpBtn) signUpBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'inline-block';

    applyTheme(currentTheme);
    preloadAllSongs();   // 🔥 Auto-preload everything on login
  } else {
    // No user: show auth controls and hide user info
    userInfo.innerHTML = '';
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    if (signInBtn) signInBtn.style.display = 'inline-block';
    if (signUpBtn) signUpBtn.style.display = 'inline-block';
    if (signOutBtn) signOutBtn.style.display = 'none';

    // Clear current songs list and cache to avoid leaking content before login
    songsIndex = [];
    songsData = {};
    songListDiv.innerHTML = '<div style="text-align:center;padding:20px;">Please sign in to load songs.</div>';
  }
});

// ===== Auto-Preload All Songs =====
async function preloadAllSongs() {
  try {
    loadingIndicator.style.display = 'inline-block';
    const res = await fetch('songs/index.json');
    if (!res.ok) throw new Error(`Index fetch failed (${res.status})`);
    songsIndex = await res.json();

    // Render list immediately
    renderSongList(songsIndex);

    // Preload each song JSON
    const fetches = songsIndex.map(async (s) => {
      const f = await fetch('songs/' + s.file);
      if (!f.ok) throw new Error(`Song fetch failed: ${s.file} (${f.status})`);
      const j = await f.json();
      songsData[s.file] = j;
    });
    await Promise.all(fetches);
  } catch (err) {
    console.error('Preload error:', err);
    songListDiv.innerHTML = '<div style="text-align:center;padding:20px;">Error loading songs.</div>';
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

function renderSongList(list) {
  songListDiv.innerHTML = '';
  if (!list || list.length === 0) {
    songListDiv.innerHTML = '<div style="text-align:center;padding:20px;">No songs found</div>';
    return;
  }
  list.forEach((s) => {
    const div = document.createElement('div');
    div.className = 'song-card';
    div.innerHTML = `<strong>${escapeHtml(s.title)}</strong><div class="muted">${escapeHtml(s.author)}</div>`;
    div.onclick = () => startPresentation(s.file);
    songListDiv.appendChild(div);
  });
}

searchInput && searchInput.addEventListener('input', () => {
  const q = (searchInput.value || '').toLowerCase();
  const filtered = songsIndex.filter(s => (s.title || '').toLowerCase().includes(q) || (s.author || '').toLowerCase().includes(q));
  renderSongList(filtered);
});

// ===== Presentation =====
async function startPresentation(file) {
  try {
    // use preloaded; if missing, fetch as fallback
    currentSong = songsData[file] || await (await fetch('songs/' + file)).json();
    currentSlide = 0;
    currentFontSize = 100;
    updateFontSize();

    // Presenter mode ON when presenting
    presenterMode = true;
    presenterToggle && presenterToggle.setAttribute('aria-pressed', 'true');
    if (presenterToggle) presenterToggle.textContent = '👁 Presenter: ON';

    // show presenter view
    menuDiv.style.display = 'none';
    presDiv.style.display = 'block';

    showSlide();
  } catch (err) {
    console.error('Error loading song:', err);
    alert('Error loading song. Please try again.');
  }
}

function showSlide() {
  if (!currentSong || !currentSong.slides || currentSlide < 0 || currentSlide >= currentSong.slides.length) return;

  const slide = currentSong.slides[currentSlide];
  slideTitle.textContent = slide.title || currentSong.title || '';
  slideText.innerHTML = (slide.lyrics || '').replace(/\n/g, '<br>');

  // Next preview (presenter only)
  const hasNext = currentSlide < currentSong.slides.length - 1;
  const nextLyrics = hasNext ? (currentSong.slides[currentSlide + 1].lyrics || '') : '';
  if (presenterMode && hasNext) {
    nextSlideText.innerHTML = nextLyrics.replace(/\n/g, '<br>');
    nextPreview.style.display = 'block';
    nextPreview.setAttribute('aria-hidden', 'false');
  } else {
    nextPreview.style.display = 'none';
    nextPreview.setAttribute('aria-hidden', 'true');
  }

  updateFontSize();
  updateProjector(slide.title, slide.lyrics || '');
}

function nextSlide() {
  if (!currentSong) return;
  if (currentSlide < currentSong.slides.length - 1) {
    currentSlide++;
    showSlide();
  }
}
function prevSlide() {
  if (!currentSong) return;
  if (currentSlide > 0) {
    currentSlide--;
    showSlide();
  }
}

// Buttons
backBtn && (backBtn.onclick = () => { presDiv.style.display = 'none'; menuDiv.style.display = 'block'; });
nextBtn && (nextBtn.onclick = nextSlide);
prevBtn && (prevBtn.onclick = prevSlide);

// ===== Presenter Mode Toggle =====
presenterToggle && presenterToggle.addEventListener('click', () => {
  presenterMode = !presenterMode;
  presenterToggle.setAttribute('aria-pressed', presenterMode ? 'true' : 'false');
  presenterToggle.textContent = presenterMode ? '👁 Presenter: ON' : '👁 Presenter: OFF';
  showSlide(); // refresh preview visibility/content
});

// ===== Projector Window =====
projectBtn && projectBtn.addEventListener('click', () => {
  if (projectorWindow && !projectorWindow.closed) {
    projectorWindow.focus();
    return;
  }
  projectorWindow = window.open(
    '',
    'LyricsProjector',
    'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
  );
  if (!projectorWindow) {
    alert("Please enable pop-ups to open the projector window.");
    return;
  }

  projectorWindow.document.write(`
    <html>
      <head>
        <title>Lyrics Projector</title>
        <style>
          html, body { height: 100%; margin: 0; }
          body {
            background: #000; color: #fff; font-family: Roboto, Arial, sans-serif;
            display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden;
          }
          .wrap {
            width: min(95%, 1800px); padding: clamp(14px, 2vw, 32px); border-radius: 20px;
            background: rgba(0,0,0,0.78); border: 2px solid rgba(255,255,255,0.32);
          }
          h2 { margin: 0 0 18px; font-size: clamp(1.2rem, 3vw, 2rem); color: #74b9ff; text-align: center; }
          p {
            font-size: clamp(3.5rem, 18vh, 15rem); font-weight: 700; text-align: center; line-height: 1.18;
            margin: 0; text-shadow: 0 4px 18px rgba(0,0,0,0.75); white-space: pre-wrap;
          }
          #blackOverlay { position: fixed; inset: 0; background: #000; display: none; z-index: 9999; }
        </style>
      </head>
      <body>
        <div id="blackOverlay"></div>
        <div class="wrap">
          <h2 id="projTitle">Waiting for content...</h2>
          <p id="projText"></p>
        </div>
      </body>
    </html>
  `);
  projectorWindow.document.close();

  // Initial sync if already presenting
  if (currentSong) showSlide();
});

function updateProjector(title, text) {
  if (!projectorWindow || projectorWindow.closed) return;

  const doc = projectorWindow.document;
  const t = doc.getElementById('projTitle');
  const p = doc.getElementById('projText');
  if (t) t.textContent = title || '';
  if (p) p.innerHTML = (text || '').replace(/\n/g, '<br>');

  // Handle black overlay
  const overlay = doc.getElementById('blackOverlay');
  if (overlay) overlay.style.display = blackedOut ? 'block' : 'none';
}

// ===== Black Screen Toggle (projector only) =====
blackScreenBtn && blackScreenBtn.addEventListener('click', () => {
  blackedOut = !blackedOut;
  blackScreenBtn.textContent = blackedOut ? '🖤 Black (ON)' : '🖤 Black';
  blackBadge.style.display = blackedOut ? 'block' : 'none';
  // Re-apply overlay state
  updateProjector(slideTitle.textContent, slideText ? (slideText.innerText || '') : '');
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  // when not presenting, allow other keys to function
  if (!currentSong) return;

  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault(); nextSlide();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault(); prevSlide();
  } else if (e.key === 'Escape') {
    backBtn && backBtn.onclick();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault(); increaseFontBtn && increaseFontBtn.click();
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault(); decreaseFontBtn && decreaseFontBtn.click();
  } else if (e.key === '0') {
    e.preventDefault(); resetFontBtn && resetFontBtn.click();
  } else if (e.key.toLowerCase() === 't') {
    toggleTheme();
  } else if (e.key.toLowerCase() === 'p') {
    presenterToggle && presenterToggle.click();
  } else if (e.key.toLowerCase() === 'b') {
    blackScreenBtn && blackScreenBtn.click();
  }
});

// ===== Utilities =====
function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}
