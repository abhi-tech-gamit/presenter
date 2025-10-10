// ===== Firebase Init =====
const firebaseConfig = {
  apiKey: "AIzaSyDMSPQN0kUFsZe9km7g7TCB7g39T9XkGGg",
  authDomain: "presenter-488c6.firebaseapp.com",
  projectId: "presenter-488c6",
  storageBucket: "presenter-488c6.firebasestorage.app",
  messagingSenderId: "758661053627",
  appId: "1:758661053627:web:1c08b776ba5fd248b7fd9e"
};
firebase.initializeApp(firebaseConfig);
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

// ===== State =====
let songsIndex = [];               // [{title, author, file}]
let songsData = {};                // cache: { fileName: songJson }
let currentSong = null;
let currentSlide = 0;
let currentFontSize = 100;
let currentTheme = localStorage.getItem('theme') || 'dark';
let projectorWindow = null;
let presenterMode = false;         // shows NEXT preview when true
let blackedOut = false;            // projector black screen

// ===== Theme =====
function applyTheme(theme) {
  if (theme === 'blue') {
    document.body.classList.add('blue-theme');
    themeIcon.textContent = '🌞';
  } else {
    document.body.classList.remove('blue-theme');
    themeIcon.textContent = '🌙';
  }
  currentTheme = theme;
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'blue' : 'dark');
}
themeToggle.addEventListener('click', toggleTheme);

// ===== Fonts =====
function updateFontSize() {
  slideText.style.fontSize = `${currentFontSize}%`;
  // Keep preview smaller proportionally (80% of main size)
  nextSlideText.style.fontSize = `${Math.round(currentFontSize * 0.8)}%`;
}
decreaseFontBtn.onclick = () => { if (currentFontSize > 50) { currentFontSize -= 10; updateFontSize(); } };
increaseFontBtn.onclick = () => { if (currentFontSize < 300) { currentFontSize += 10; updateFontSize(); } };
resetFontBtn.onclick = () => { currentFontSize = 100; updateFontSize(); };

// ===== Auth =====
auth.onAuthStateChanged(user => {
  if (user) {
    userInfo.innerHTML = `
      <div class="user-info">
        <span class="username">${user.displayName || user.email}</span>
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </div>`;
    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
    applyTheme(currentTheme);
    preloadAllSongs();   // 🔥 Auto-preload everything on login
  } else {
    window.location.href = 'login.html';
  }
});

// ===== Auto-Preload All Songs =====
async function preloadAllSongs() {
  try {
    loadingIndicator.style.display = 'inline-block';
    const res = await fetch('songs/index.json');
    songsIndex = await res.json();

    // Render list immediately
    renderSongList(songsIndex);

    // Preload each song JSON
    const fetches = songsIndex.map(async (s) => {
      const f = await fetch('songs/' + s.file);
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
    div.textContent = `${s.title} • ${s.author}`;
    div.onclick = () => startPresentation(s.file);
    songListDiv.appendChild(div);
  });
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  const filtered = songsIndex.filter(s => s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q));
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
  slideTitle.textContent = slide.title;
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
backBtn.onclick = () => { presDiv.style.display = 'none'; menuDiv.style.display = 'block'; };
nextBtn.onclick = nextSlide;
prevBtn.onclick = prevSlide;

// ===== Presenter Mode Toggle =====
presenterToggle.addEventListener('click', () => {
  presenterMode = !presenterMode;
  presenterToggle.setAttribute('aria-pressed', presenterMode ? 'true' : 'false');
  presenterToggle.textContent = presenterMode ? '👁 Presenter: ON' : '👁 Presenter: OFF';
  showSlide(); // refresh preview visibility/content
});

// ===== Projector Window =====
projectBtn.addEventListener('click', () => {
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
          html, body {
            height: 100%;
            margin: 0;
          }
          body {
            background: #000;
            color: #fff;
            font-family: Roboto, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          .wrap {
            width: min(95%, 1800px);
            padding: clamp(12px, 2vw, 28px);
            border-radius: 20px;
            background: rgba(0,0,0,0.78);
            border: 2px solid rgba(255,255,255,0.25);
          }
          h2 {
            margin: 0 0 18px;
            font-size: clamp(1.2rem, 3vw, 2rem);
            color: #74b9ff;
            text-align: center;
          }
          p {
            font-size: clamp(3.5rem, 18vh, 15rem);
            font-weight: 700;
            text-align: center;
            line-height: 1.18;
            margin: 0;
            text-shadow: 0 4px 18px rgba(0,0,0,0.75);
            white-space: pre-wrap;
          }
          #blackOverlay {
            position: fixed;
            inset: 0;
            background: #000;
            display: none;
            z-index: 9999;
          }
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
blackScreenBtn.addEventListener('click', () => {
  blackedOut = !blackedOut;
  blackScreenBtn.textContent = blackedOut ? '🖤 Black (ON)' : '🖤 Black';
  blackBadge.style.display = blackedOut ? 'block' : 'none';
  updateProjector(slideTitle.textContent, slideText.textContent);
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  if (!currentSong) return;

  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault(); nextSlide();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault(); prevSlide();
  } else if (e.key === 'Escape') {
    backBtn.onclick();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault(); increaseFontBtn.click();
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault(); decreaseFontBtn.click();
  } else if (e.key === '0') {
    e.preventDefault(); resetFontBtn.click();
  } else if (e.key.toLowerCase() === 't') {
    toggleTheme();
  } else if (e.key.toLowerCase() === 'p') {
    presenterToggle.click();
  } else if (e.key.toLowerCase() === 'b') {
    blackScreenBtn.click();
  }
});
