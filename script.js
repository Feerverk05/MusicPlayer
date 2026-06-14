document.addEventListener('DOMContentLoaded', () => {
  const cardsContainer = document.getElementById('cards');
  if (!cardsContainer) return;

  const songs = [
    { title: "Midnight Vibes", artist: "DJ Chill", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
    { title: "Summer Breeze", artist: "Aria", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
    { title: "Neon Lights", artist: "Synthwave", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
    { title: "Rainy Day", artist: "Lo-Fi Beats", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
  ];

  let currentIndex = 0;
  let playing = false;

  const greetingEl = document.getElementById('greeting');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');
  const miniCover = document.getElementById('mini-cover');
  const playIcon = document.getElementById('play-icon');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброго ранку!' : hour < 18 ? 'Добрий день!' : 'Добрий вечір!';
  if (greetingEl) greetingEl.textContent = greeting;

  songs.forEach((song, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<img src="${song.img}" alt="${song.title}"><h3>${song.title}</h3><p>${song.artist}</p>`;
    card.onclick = () => playSong(i);
    cardsContainer.appendChild(card);
  });

  function setPlayIcon(isPlaying) {
    if (!playIcon) return;
    playIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  }

  function playSong(index) {
    currentIndex = index;
    playing = true;
    const song = songs[index];

    document.querySelectorAll('.card').forEach((c, i) => {
      c.classList.toggle('active-card', i === index);
    });

    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    if (miniCover) miniCover.innerHTML = `<img src="${song.img}" alt="${song.title}">`;
    setPlayIcon(true);
  }

  function togglePlay() {
    if (!playerTitle || playerTitle.textContent === 'Обери трек') {
      playSong(0);
      return;
    }
    playing = !playing;
    setPlayIcon(playing);
  }

  function next() {
    playSong((currentIndex + 1) % songs.length);
  }

  function prev() {
    playSong((currentIndex - 1 + songs.length) % songs.length);
  }

  window.togglePlay = togglePlay;
  window.next = next;
  window.prev = prev;
});
