let currentSlide = 0;
let songData = null;

// Load lyrics when page loads
window.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('lyrics/aaj-ka-ye-din.json');
  songData = await response.json();
  displaySlide(currentSlide);
});

function displaySlide(index) {
  if (!songData || index < 0 || index >= songData.slides.length) return;
  
  const slide = songData.slides[index];
  const slideContainer = document.getElementById('slideContainer');
  
  // Clear previous content
  slideContainer.innerHTML = '';
  
  // Create title
  const title = document.createElement('div');
  title.className = 'slide-title';
  title.textContent = slide.title;
  slideContainer.appendChild(title);
  
  // Create content
  const content = document.createElement('div');
  content.className = 'slide-content';
  content.innerHTML = slide.lyrics.replace(/\n/g, '<br>');
  slideContainer.appendChild(content);
  
  // Update navigation buttons
  document.getElementById('prevBtn').disabled = index === 0;
  document.getElementById('nextBtn').disabled = index === songData.slides.length - 1;
}

// Navigation event listeners
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentSlide > 0) {
    currentSlide--;
    displaySlide(currentSlide);
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentSlide < songData.slides.length - 1) {
    currentSlide++;
    displaySlide(currentSlide);
  }
});
