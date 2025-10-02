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
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

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

// UI Functions
function showLoginForm() {
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
}

function showSignupForm() {
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
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
        // Redirect to main app after successful login
        window.location.href = 'index.html';
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
        // Redirect to main app after successful signup
        window.location.href = 'index.html';
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

// Check if user is already logged in
auth.onAuthStateChanged(user => {
  if (user) {
    // User is already logged in, redirect to main app
    window.location.href = 'index.html';
  } else {
    // User is not logged in, show login form
    showLoginForm();
    setupAuthEventListeners();
  }
});
