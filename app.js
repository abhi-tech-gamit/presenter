let songs = [];
let currentSong = null;
let currentSlide = 0;

// Load list of songs
async function loadSongsList() {
  const res = await fetch('songs/index.json');
  songs = await res.json();
  renderSongList(songs);
}

function renderSongList(files) {
  const songList = document.getElementById('song-list');
  songList.innerHTML = '';
  files.forEach(file => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = file.replace('.json', '');
    a.addEventListener('click', () => loadSong(file));
    li.appendChild(a);
    songList.appendChild(li);
  });
}

async function loadSong(file) {
  const res = await fetch('songs/' + file);
  currentSong = await res.json();
  currentSlide = 0;
  showSlide();
}

function showSlide() {
  if (!currentSong) return;
  const slidesDiv = document.getElementById('slides');
  slidesDiv.textContent = currentSong.slides[currentSlide];
}

document.getElementById('prev').addEventListener('click', () => {
  if (!currentSong) return;
  currentSlide = (currentSlide - 1 + currentSong.slides.length) % currentSong.slides.length;
  showSlide();
});

document.getElementById('next').addEventListener('click', () => {
  if (!currentSong) return;
  currentSlide = (currentSlide + 1) % currentSong.slides.length;
  showSlide();
});

// Search filter
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = songs.filter(file => file.toLowerCase().includes(query));
  renderSongList(filtered);
});

loadSongsList();