document.addEventListener('DOMContentLoaded', () => {
    const songs = [
      { title: "Midnight Vibes", artist: "DJ Chill", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
      { title: "Summer Breeze", artist: "Aria", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
      { title: "Neon Lights", artist: "Synthwave", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
      { title: "Rainy Day", artist: "Lo-Fi Beats", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
    ];
    
    let currentIndex = 0;
    let playing = false;
    
    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Доброго ранку!" : hour < 18 ? "Добрий день!" : "Добрий вечір!";
    document.getElementById("greeting").textContent = greeting;
    
    // Render cards
    const container = document.getElementById("cards");
    songs.forEach((song, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<img src="${song.img}" alt="${song.title}"><h3>${song.title}</h3><p>${song.artist}</p>`;
      card.onclick = () => playSong(i);
      container.appendChild(card);
    });
    
    function playSong(index) {
      currentIndex = index;
      playing = true;
      document.getElementById("song-title").textContent = `${songs[index].title} — ${songs[index].artist}`;
      document.getElementById("play-btn").textContent = "⏸️";
    }
    
    function togglePlay() {
      playing = !playing;
      document.getElementById("play-btn").textContent = playing ? "⏸️" : "▶️";
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