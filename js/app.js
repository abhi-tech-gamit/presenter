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

// DOM Elements
const songListDiv = document.getElementById('songList');
const searchInput = document.getElementById('search');
const menuDiv = document.getElementById('menu');
const presDiv = document.getElementById('presentation');
const slideContainer = document.getElementById('slideContainer');
const slideTitle = document.getElementById('slideTitle');
const slideText = document.getElementById('slideText');
const backBtn = document.getElementById('backBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const authContainer = document.getElementById('authContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const userInfo = document.getElementById('userInfo');

// App State
let songs = [];
let currentSong = null;
let currentSlide = 0;
let currentUser = null;

// Authentication Functions
function signUp(email, password, username) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Update user profile with display name
      return userCredential.user.updateProfile({
        displayName: username
      });
    });
}

function logIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logOut() {
  return auth.signOut();
}

// Auth State Observer
auth.onAuthStateChanged(user => {
  if (user) {
    // User is signed in
    currentUser = user;
    hideAuthContainer();
    updateMenuForUser(user);
    loadSongs();
  } else {
    // User is signed out
    currentUser = null;
    showAuthContainer();
    showLoginForm();
  }
});

// UI Functions
function showAuthContainer() {
  authContainer.style.display = 'flex';
  menuDiv.style.display = 'none';
  presDiv.style.display = 'none';
}

function hideAuthContainer() {
  authContainer.style.display = 'none';
  menuDiv.style.display = 'block';
}

function showLoginForm() {
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
}

function showSignupForm() {
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
}

function updateMenuForUser(user) {
  if (userInfo) {
    userInfo.innerHTML = `
      <div class="user-info">
        <span class="username">${user.displayName || user.email}</span>
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </div>
    `;
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
      logOut().then(() => {
        console.log('User logged out');
      }).catch(error => {
        console.error('Logout error:', error);
      });
    });
  }
}

// Setup Auth Event Listeners
function setupAuthEventListeners() {
  // Login form submission
  loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    logIn(email, password)
      .then(() => {
        loginError.textContent = '';
      })
      .catch(error => {
        loginError.textContent = error.message;
      });
  });
  
  // Signup form submission
  signupFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Clear previous errors
    signupError.textContent = '';
    
    // Validate passwords match
    if (password !== confirmPassword) {
      signupError.textContent = 'Passwords do not match';
      return;
    }
    
    signUp(email, password, username)
      .then(() => {
        signupError.textContent = '';
      })
      .catch(error => {
        signupError.textContent = error.message;
      });
  });
  
  // Toggle between login and signup
  document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
  });
  
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });
}

// Song Functions
async function loadSongs() {
  try {
    let res = await fetch('songs/index.json');
    songs = await res.json();
    renderSongList(songs);
  } catch (error) {
    console.error('Error loading songs:', error);
    songListDiv.innerHTML = '<div style="text-align: center; padding: 20px;">Error loading songs. Please check your connection.</div>';
  }
}

function renderSongList(list) {
  songListDiv.innerHTML = '';
  if (list.length === 0) {
    songListDiv.innerHTML = '<div style="text-align: center; padding: 20px;">No songs found</div>';
    return;
  }
  
  list.forEach(s => {
    let div = document.createElement('div');
    div.textContent = s.title + ' • ' + s.author;
    div.onclick = () => startPresentation(s.file);
    songListDiv.appendChild(div);
  });
}

searchInput.addEventListener('input', () => {
  let query = searchInput.value.toLowerCase();
  renderSongList(songs.filter(s => 
    s.title.toLowerCase().includes(query) || 
    s.author.toLowerCase().includes(query)
  ));
});

// Presentation Functions
async function startPresentation(file) {
  try {
    loadingIndicator.style.display = 'block';
    let res = await fetch('songs/' + file);
    currentSong = await res.json();
    currentSlide = 0;
    
    // Hide menu and show presentation
    menuDiv.style.display = 'none';
    presDiv.style.display = 'block';
    
    // Show first slide
    showSlide();
  } catch (error) {
    console.error('Error loading song:', error);
    alert('Error loading song. Please try again.');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

function showSlide() {
  if (!currentSong || !currentSong.slides || currentSlide < 0 || currentSlide >= currentSong.slides.length) {
    return;
  }
  
  // Update title
  slideTitle.textContent = currentSong.slides[currentSlide].title;
  
  // Update lyrics with proper formatting
  const lyrics = currentSong.slides[currentSlide].lyrics;
  slideText.innerHTML = lyrics.replace(/\n/g, '<br>');
}

function nextSlide() {
  if (currentSlide < currentSong.slides.length - 1) {
    currentSlide++;
    showSlide();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide();
  }
}

// Event listeners
backBtn.onclick = () => {
  presDiv.style.display = 'none';
  menuDiv.style.display = 'block';
};

nextBtn.onclick = nextSlide;
prevBtn.onclick = prevSlide;

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!currentSong) return; 
  
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
  } else if (e.key === 'Escape') {
    backBtn.onclick();
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupAuthEventListeners();
});
