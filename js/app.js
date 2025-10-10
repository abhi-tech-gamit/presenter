// Initialize Firebase
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

// DOM
const songListDiv = document.getElementById('songList');
const searchInput = document.getElementById('search');
const menuDiv = document.getElementById('menu');
const presDiv = document.getElementById('presentation');
const slideTitle = document.getElementById('slideTitle');
const slideText = document.getElementById('slideText');
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

// State
let songs = [];
let currentSong = null;
let currentSlide = 0;
let currentFontSize = 100;
let currentTheme = localStorage.getItem('theme') || 'dark';
let projectorWindow = null;

// THEME
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

// FONT SIZE
function updateFontSize() {
  slideText.style.fontSize = `${currentFontSize}%`;
}
function decreaseFontSize() { if (currentFontSize > 50) { currentFontSize -= 10; updateFontSize(); } }
function increaseFontSize() { if (currentFontSize < 200) { currentFontSize += 10; updateFontSize(); } }
function resetFontSize() { currentFontSize = 100; updateFontSize(); }

// AUTH
auth.onAuthStateChanged(user => {
  if (user) {
    userInfo.innerHTML = `<div class="user-info"><span>${user.email}</span><button id="logoutBtn" class="logout-btn">Logout</button></div>`;
    document.getElementById('logoutBtn').onclick = () => auth.signOut();
    loadSongs();
    applyTheme(currentTheme);
  } else {
    window.location.href = 'login.html';
  }
});

// LOAD SONGS
async function loadSongs() {
  try {
    let res = await fetch('songs/index.json');
    songs = await res.json();
    renderSongList(songs);
  } catch (e) {
    songListDiv.innerHTML = 'Error loading songs.';
  }
}
function renderSongList(list) {
  songListDiv.innerHTML = '';
  list.forEach(s => {
    let div = document.createElement('div');
    div.textContent = `${s.title} • ${s.author}`;
    div.onclick = () => startPresentation(s.file);
    songListDiv.appendChild(div);
  });
}
searchInput.addEventListener('input', () => {
  let q = searchInput.value.toLowerCase();
  renderSongList(songs.filter(s => s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)));
});

// PRESENTATION
async function startPresentation(file) {
  loadingIndicator.style.display = 'block';
  try {
    let res = await fetch('songs/' + file);
    currentSong = await res.json();
    currentSlide = 0;
    currentFontSize = 100;
    updateFontSize();
    menuDiv.style.display = 'none';
    presDiv.style.display = 'block';
    showSlide();
  } catch {
    alert('Error loading song');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}
function showSlide() {
  if (!currentSong) return;
  const slide = currentSong.slides[currentSlide];
  slideTitle.textContent = slide.title;
  slideText.innerHTML = slide.lyrics.replace(/\n/g, '<br>');
  updateFontSize();
  updateProjector(slide.title, slide.lyrics);
}
function nextSlide() { if (currentSong && currentSlide < currentSong.slides.length - 1) { currentSlide++; showSlide(); } }
function prevSlide() { if (currentSong && currentSlide > 0) { currentSlide--; showSlide(); } }
backBtn.onclick = () => { presDiv.style.display = 'none'; menuDiv.style.display = 'block'; };
nextBtn.onclick = nextSlide;
prevBtn.onclick = prevSlide;
decreaseFontBtn.onclick = decreaseFontSize;
resetFontBtn.onclick = resetFontSize;
increaseFontBtn.onclick = increaseFontSize;
themeToggle.onclick = toggleTheme;

// PROJECTOR WINDOW
projectBtn.addEventListener('click', () => {
  if (projectorWindow && !projectorWindow.closed) {
    projectorWindow.focus();
    return;
  }
  projectorWindow = window.open('', 'LyricsProjector', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
  if (!projectorWindow) { alert("Enable pop-ups to open projector window."); return; }
  projectorWindow.document.write(`
    <html><head><title>Lyrics Projector</title>
    <style>
      body{background:#000;color:#fff;font-family:Roboto,sans-serif;margin:0;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;overflow:hidden;}
      h2{font-size:3em;color:#74b9ff;margin-bottom:40px;text-align:center;}
      p{font-size:6em;font-weight:bold;text-align:center;line-height:1.2;margin:0;text-shadow:0 4px 20px rgba(0,0,0,0.8);}
    </style></head>
    <body><h2 id="projTitle">Waiting...</h2><p id="projText"></p></body></html>`);
  projectorWindow.document.close();
  if (currentSong) showSlide();
});
function updateProjector(title, text) {
  if (!projectorWindow || projectorWindow.closed) return;
  const titleElem = projectorWindow.document.getElementById('projTitle');
  const textElem = projectorWindow.document.getElementById('projText');
  if (titleElem && textElem) {
    titleElem.textContent = title;
    textElem.innerHTML = text.replace(/\n/g, '<br>');
  }
}

// KEYBOARD
document.addEventListener('keydown', e => {
  if (!currentSong) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
  else if (e.key === 'Escape') { backBtn.onclick(); }
  else if (e.key === '+' || e.key === '=') { e.preventDefault(); increaseFontBtn.click(); }
  else if (e.key === '-' || e.key === '_') { e.preventDefault(); decreaseFontBtn.click(); }
  else if (e.key === '0') { e.preventDefault(); resetFontBtn.click(); }
  else if (e.key.toLowerCase() === 't') toggleTheme();
});
