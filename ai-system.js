document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('duration-slider');
  const durationValue = document.getElementById('duration-value');
  const textarea = document.getElementById('track-desc');
  const generateBtn = document.querySelector('.generate-btn');
  const tracksSection = document.querySelector('.tracks-section');
  const tracksHeading = tracksSection?.querySelector('h3');
  const emptyState = tracksSection?.querySelector('.empty-state');

  if (!slider || !textarea || !generateBtn) return;

  const prompts = [
    'Епічна кінематографічна оркестрова музика для трейлера з потужними ударними та струнними',
    "Спокійний лоу-фай біт для навчання з м'яким джазовим фортепіано та теплим басом",
    'Енергійний рок-гітарний риф із потужним барабанним бітом і драйвовим вокалом',
    "Меланхолійне фортепіано з м'якими струнними під дощ за вікном",
  ];

  let tracks = [];

  function updateSlider() {
    slider.style.setProperty('--val', slider.value);
    durationValue.textContent = `${slider.value} сек`;
  }

  function updateTracksList() {
    if (!tracksHeading) return;
    tracksHeading.innerHTML = `<i class="fa-solid fa-music"></i> Створені треки (${tracks.length})`;

    let list = tracksSection.querySelector('.tracks-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'tracks-list';
      tracksSection.appendChild(list);
    }

    if (!tracks.length) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    list.innerHTML = tracks
      .map(
        (track, i) => `
        <div class="generated-track" data-index="${i}">
          <div class="generated-track-info">
            <strong>${track.title}</strong>
            <span>${track.duration} сек · ${track.mood}</span>
          </div>
          <button type="button" class="play-track-btn" aria-label="Відтворити">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>`
      )
      .join('');

    list.querySelectorAll('.play-track-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.closest('.generated-track').dataset.index);
        playPreview(tracks[index], btn);
      });
    });
  }

  function playPreview(track, btn) {
    const icon = btn.querySelector('i');
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = track.notes;

    icon.className = 'fa-solid fa-volume-high';

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    setTimeout(() => {
      icon.className = 'fa-solid fa-play';
    }, track.duration * 1000);
  }

  function buildTrack(prompt, duration) {
    const moods = ['Chill', 'Epic', 'Focus', 'Dreamy', 'Energy'];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const title = prompt.split(/[,.!]/)[0].slice(0, 42).trim() || 'Новий трек';
    const baseFreq = 220 + Math.floor(Math.random() * 180);
    const notes = [];

    for (let t = 0; t < Math.min(duration, 12); t += 0.6) {
      notes.push({
        freq: baseFreq * (1 + (t % 3) * 0.25),
        start: t * 0.35,
        dur: 0.45,
      });
    }

    return { title, mood, duration, notes, createdAt: Date.now() };
  }

  async function generateTrack() {
    const prompt = textarea.value.trim();
    if (!prompt) {
      textarea.focus();
      textarea.style.borderColor = '#e05a5a';
      setTimeout(() => {
        textarea.style.borderColor = '';
      }, 1200);
      return;
    }

    const duration = Number(slider.value);
    const originalHtml = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Генеруємо…';

    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 1200));

    tracks.unshift(buildTrack(prompt, duration));
    updateTracksList();

    generateBtn.disabled = false;
    generateBtn.innerHTML = originalHtml;
  }

  slider.addEventListener('input', updateSlider);
  updateSlider();

  document.querySelectorAll('.prompt-btn').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      textarea.value = prompts[i] || btn.textContent.trim();
      textarea.focus();
    });
  });

  generateBtn.addEventListener('click', generateTrack);
});
