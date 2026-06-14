const TRACKS = [
  {
    title: 'Midnight Drive',
    artist: 'The Lumen',
    genre: 'drive',
    badge: 'DRIVE',
    plays: '1.2M',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Velvet Hour',
    artist: 'The Lumen',
    genre: 'chill',
    badge: 'CHILL',
    plays: '984K',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'Paper Planes',
    artist: 'The Lumen',
    genre: 'drive',
    badge: 'ENERGY',
    plays: '2.1M',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title: 'Golden Static',
    artist: 'The Lumen',
    genre: 'focus',
    badge: 'FOCUS',
    plays: '756K',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    title: 'Echo Park',
    artist: 'The Lumen',
    genre: 'drive',
    badge: 'DRIVE',
    plays: '1.5M',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    title: 'Hollow Bloom',
    artist: 'The Lumen',
    genre: 'chill',
    badge: 'CHILL',
    plays: '612K',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
];

const FILTER_MAP = {
  all: () => true,
  drive: (t) => t.genre === 'drive' || t.badge === 'ENERGY',
  focus: (t) => t.genre === 'focus',
  chill: (t) => t.genre === 'chill',
};

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio-player');
  const disk = document.getElementById('spinning-disk');
  const spinBadge = document.getElementById('spin-badge');
  const albumPlayBtn = document.getElementById('album-play-btn');
  const saveBtn = document.getElementById('save-btn');
  const radioBtn = document.getElementById('radio-btn');
  const likesStat = document.getElementById('likes-stat');
  const tracksGrid = document.getElementById('tracks-grid');
  const searchInput = document.getElementById('search-input');
  const barPlayBtn = document.getElementById('bar-play-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const progressBar = document.getElementById('progress-bar');
  const volumeBar = document.getElementById('volume-bar');
  const volumeBtn = document.getElementById('volume-btn');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');

  let currentIndex = 0;
  let playing = false;
  let shuffle = false;
  let repeatMode = 'off';
  let saved = false;
  let activeFilter = 'all';
  let lastVolume = 0.7;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function setPlayingState(isPlaying) {
    playing = isPlaying;
    disk.classList.toggle('paused', !playing);
    spinBadge.textContent = playing ? 'ЗАРАЗ ГРАЄ' : 'НА ПАУЗІ';

    const icon = playing ? 'fa-pause' : 'fa-play';
    const label = playing ? 'Пауза' : 'Грати';
    albumPlayBtn.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`;
    barPlayBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  }

  function updatePlayerInfo(track) {
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    totalTimeEl.textContent = formatTime(audio.duration);
  }

  function loadTrack(index, autoplay = true) {
    currentIndex = index;
    const track = TRACKS[currentIndex];
    audio.src = track.url;
    updatePlayerInfo(track);
    renderTracks();

    if (autoplay) {
      audio.play().then(() => setPlayingState(true)).catch(() => setPlayingState(false));
    }
  }

  function togglePlay() {
    if (!audio.src) {
      loadTrack(0);
      return;
    }
    if (playing) {
      audio.pause();
      setPlayingState(false);
    } else {
      audio.play().then(() => setPlayingState(true)).catch(() => setPlayingState(false));
    }
  }

  function getNextIndex() {
    if (shuffle) {
      if (TRACKS.length === 1) return 0;
      let idx;
      do {
        idx = Math.floor(Math.random() * TRACKS.length);
      } while (idx === currentIndex);
      return idx;
    }
    return (currentIndex + 1) % TRACKS.length;
  }

  function getPrevIndex() {
    if (shuffle) {
      return getNextIndex();
    }
    return (currentIndex - 1 + TRACKS.length) % TRACKS.length;
  }

  function playNext() {
    loadTrack(getNextIndex());
  }

  function playPrev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      updateProgress();
      return;
    }
    loadTrack(getPrevIndex());
  }

  function cycleRepeat() {
    const modes = ['off', 'all', 'one'];
    repeatMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    repeatBtn.classList.toggle('active', repeatMode !== 'off');
    repeatBtn.innerHTML = repeatMode === 'one'
      ? '<i class="fa-solid fa-repeat"></i><span class="repeat-badge">1</span>'
      : '<i class="fa-solid fa-repeat"></i>';
  }

  function updateVolumeIcon() {
    const vol = audio.volume;
    let icon = 'fa-volume-high';
    if (vol === 0) icon = 'fa-volume-xmark';
    else if (vol < 0.35) icon = 'fa-volume-off';
    else if (vol < 0.7) icon = 'fa-volume-low';
    volumeBtn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
  }

  function matchesSearch(track, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.badge.toLowerCase().includes(q)
    );
  }

  function getVisibleTracks() {
    const filterFn = FILTER_MAP[activeFilter] || FILTER_MAP.all;
    const query = searchInput.value.trim();
    return TRACKS.map((track, index) => ({ track, index })).filter(
      ({ track }) => filterFn(track) && matchesSearch(track, query)
    );
  }

  function renderTracks() {
    const visible = getVisibleTracks();
    tracksGrid.innerHTML = '';

    if (visible.length === 0) {
      tracksGrid.innerHTML = '<p class="no-tracks">Треків не знайдено</p>';
      return;
    }

    visible.forEach(({ track, index }) => {
      const isActive = index === currentIndex;
      const isPlayingTrack = isActive && playing;
      const coverIcon = isPlayingTrack ? 'fa-chart-simple' : 'fa-play';
      const card = document.createElement('div');
      card.className = `track-card${isActive ? ' active-track' : ''}`;
      card.innerHTML = `
        <div class="track-cover${isPlayingTrack ? ' audio-wave' : ''}">
          <i class="fa-solid ${coverIcon}"></i>
        </div>
        <div class="track-details">
          <h4>${track.title}</h4>
          <p class="artist">${track.artist}</p>
          <div class="track-badges">
            <span class="badge-item">${track.badge}</span>
            <span><i class="fa-solid fa-arrow-trend-up"></i> ${track.plays}</span>
            <span><i class="fa-regular fa-clock"></i> <span class="track-dur" data-idx="${index}">—:——</span></span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        if (index === currentIndex) {
          togglePlay();
        } else {
          loadTrack(index);
        }
      });
      tracksGrid.appendChild(card);
    });

    updateDurationLabels();
  }

  function updateDurationLabels() {
    document.querySelectorAll('.track-dur').forEach((el) => {
      const idx = Number(el.dataset.idx);
      const temp = document.createElement('audio');
      temp.src = TRACKS[idx].url;
      temp.addEventListener('loadedmetadata', () => {
        el.textContent = formatTime(temp.duration);
      });
    });
  }

  saveBtn.addEventListener('click', () => {
    saved = !saved;
    saveBtn.classList.toggle('saved', saved);
    saveBtn.innerHTML = saved
      ? '<i class="fa-solid fa-heart"></i> Збережено'
      : '<i class="fa-regular fa-heart"></i> Зберегти';
    if (likesStat) {
      likesStat.textContent = saved ? '215K' : '214K';
    }
  });

  radioBtn.addEventListener('click', () => {
    shuffle = true;
    shuffleBtn.classList.add('active');
    const randomIdx = Math.floor(Math.random() * TRACKS.length);
    loadTrack(randomIdx);
  });

  albumPlayBtn.addEventListener('click', togglePlay);
  barPlayBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrev);
  nextBtn.addEventListener('click', playNext);

  shuffleBtn.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle);
  });

  repeatBtn.addEventListener('click', cycleRepeat);

  progressBar.addEventListener('input', () => {
    if (audio.duration) {
      audio.currentTime = (progressBar.value / 100) * audio.duration;
      updateProgress();
    }
  });

  volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value / 100;
    if (audio.volume > 0) lastVolume = audio.volume;
    updateVolumeIcon();
  });

  volumeBtn.addEventListener('click', () => {
    if (audio.volume > 0) {
      lastVolume = audio.volume;
      audio.volume = 0;
      volumeBar.value = 0;
    } else {
      audio.volume = lastVolume || 0.7;
      volumeBar.value = audio.volume * 100;
    }
    updateVolumeIcon();
  });

  searchInput.addEventListener('input', renderTracks);

  document.querySelectorAll('.filter-tag').forEach((tag) => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.filter-tag').forEach((t) => t.classList.remove('active'));
      tag.classList.add('active');
      activeFilter = tag.dataset.filter;
      renderTracks();
    });
  });

  audio.volume = lastVolume;
  volumeBar.value = lastVolume * 100;
  updateVolumeIcon();

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateProgress);
  audio.addEventListener('play', () => {
    setPlayingState(true);
    renderTracks();
  });
  audio.addEventListener('pause', () => {
    setPlayingState(false);
    renderTracks();
  });
  audio.addEventListener('ended', () => {
    if (repeatMode === 'one') {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (repeatMode === 'all' || currentIndex < TRACKS.length - 1 || shuffle) {
      playNext();
      return;
    }
    setPlayingState(false);
  });

  loadTrack(0, false);
  setPlayingState(false);
  totalTimeEl.textContent = '0:00';
});
