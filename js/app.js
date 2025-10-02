let songListDiv = document.getElementById('songList');
let searchInput = document.getElementById('search');
let menuDiv = document.getElementById('menu');
let presDiv = document.getElementById('presentation');
let slideContainer = document.getElementById('slideContainer');
let slideTitle = document.getElementById('slideTitle');
let slideContent = document.getElementById('slideContent');
let backBtn = document.getElementById('backBtn');
let prevBtn = document.getElementById('prevBtn');
let nextBtn = document.getElementById('nextBtn');
let decreaseFontBtn = document.getElementById('decreaseFont');
let resetFontBtn = document.getElementById('resetFont');
let increaseFontBtn = document.getElementById('increaseFont');
let loadingIndicator = document.getElementById('loadingIndicator');
let songs = [];
let currentSong = null;
let currentSlide = 0;
let currentFontSize = 100; // Default font size in percentage

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
        songListDiv.innerHTML = '<div style="text-align: center; padding: 20px; grid-column: 1/-1;">No songs found</div>';
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

async function startPresentation(file) {
    try {
        loadingIndicator.style.display = 'block';
        let res = await fetch('songs/' + file);
        currentSong = await res.json();
        currentSlide = 0;
        
        // Reset font size to default when starting a new presentation
        currentFontSize = 100;
        updateFontSize();
        
        // Hide menu and show presentation
        menuDiv.style.display = 'none';
        presDiv.style.display = 'flex';
        presDiv.classList.add('active');
        
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
    
    // Update title with fade animation
    slideTitle.style.opacity = '0';
    slideContent.style.opacity = '0';
    
    setTimeout(() => {
        // Update title and content
        slideTitle.textContent = currentSong.slides[currentSlide].title;
        slideContent.innerHTML = currentSong.slides[currentSlide].lyrics.replace(/\n/g,'<br>');
        
        // Apply current font size
        updateFontSize();
        
        // Fade in both title and content
        slideTitle.style.opacity = '1';
        slideContent.style.opacity = '1';
    }, 200);
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

// Font size adjustment functions
function updateFontSize() {
    slideContent.style.fontSize = `${currentFontSize}%`;
}

function decreaseFontSize() {
    if (currentFontSize > 50) { // Minimum 50% of original size
        currentFontSize -= 10;
        updateFontSize();
    }
}

function increaseFontSize() {
    if (currentFontSize < 200) { // Maximum 200% of original size
        currentFontSize += 10;
        updateFontSize();
    }
}

function resetFontSize() {
    currentFontSize = 100;
    updateFontSize();
}

// Event listeners
backBtn.onclick = () => {
    presDiv.style.display = 'none';
    presDiv.classList.remove('active');
    menuDiv.style.display = 'block';
};

nextBtn.onclick = nextSlide;
prevBtn.onclick = prevSlide;

// Font size control event listeners
decreaseFontBtn.onclick = decreaseFontSize;
resetFontBtn.onclick = resetFontSize;
increaseFontBtn.onclick = increaseFontSize;

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
    } else if (e.key === '+' || e.key === '=') {
        // Plus key to increase font size
        increaseFontSize();
    } else if (e.key === '-' || e.key === '_') {
        // Minus key to decrease font size
        decreaseFontSize();
    } else if (e.key === '0') {
        // Zero key to reset font size
        resetFontSize();
    }
});

// Touch gesture support
let touchStartX = 0;
let touchEndX = 0;

slideContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

slideContainer.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left - next slide
        if (currentSlide < currentSong.slides.length - 1) {
            nextSlide();
        }
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right - previous slide
        if (currentSlide > 0) {
            prevSlide();
        }
    }
}

// Initialize
loadSongs();
