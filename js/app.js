let songListDiv = document.getElementById('songList');
let searchInput = document.getElementById('search');
let menuDiv = document.getElementById('menu');
let presDiv = document.getElementById('presentation');
let slideContainer = document.getElementById('slideContainer');
let backBtn = document.getElementById('backBtn');
let prevBtn = document.getElementById('prevBtn');
let nextBtn = document.getElementById('nextBtn');
let songs = [];
let currentSong = null;
let currentSlide = 0;

async function loadSongs() {
    let res = await fetch('songs/index.json');
    songs = await res.json();
    renderSongList(songs);
}

function renderSongList(list) {
    songListDiv.innerHTML = '';
    list.forEach(s => {
        let div = document.createElement('div');
        div.textContent = s.title + ' • ' + s.author;
        div.onclick = ()=>startPresentation(s.file);
        songListDiv.appendChild(div);
    });
}

searchInput.addEventListener('input', ()=>{
    let query = searchInput.value.toLowerCase();
    renderSongList(songs.filter(s=>s.title.toLowerCase().includes(query) || s.author.toLowerCase().includes(query)));
});

async function startPresentation(file) {
    let res = await fetch('songs/' + file);
    currentSong = await res.json();
    currentSlide = 0;
    menuDiv.style.display = 'none';
    presDiv.style.display = 'block';
    showSlide();
}

function showSlide() {
    slideContainer.style.opacity = 0;
    setTimeout(()=>{
        slideContainer.innerHTML = '<h2>'+currentSong.slides[currentSlide].title+'</h2><p>'+currentSong.slides[currentSlide].lyrics.replace(/\n/g,'<br>')+'</p>';
        slideContainer.style.opacity = 1;
    },200);
}

function nextSlide(){if(currentSlide<currentSong.slides.length-1){currentSlide++;showSlide();}}
function prevSlide(){if(currentSlide>0){currentSlide--;showSlide();}}
backBtn.onclick=()=>{presDiv.style.display='none'; menuDiv.style.display='block';}
nextBtn.onclick=nextSlide; prevBtn.onclick=prevSlide;
document.addEventListener('keydown',(e)=>{if(!currentSong) return; if(e.key==='ArrowRight'||e.key===' '){nextSlide();} else if(e.key==='ArrowLeft'){prevSlide();} else if(e.key==='Escape'){backBtn.onclick();}});

loadSongs();
