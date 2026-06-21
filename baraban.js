document.addEventListener('DOMContentLoaded', () => {
  const pads = document.querySelectorAll('.pad');
  if (!pads.length) return;

  const volumeSlider = document.getElementById('volume-slider');
  const volumeNum = document.getElementById('volume-num');
  const filterSlider = document.getElementById('filter-slider');
  const filterNum = document.getElementById('filter-num');
  const delaySlider = document.getElementById('delay-slider');
  const delayNum = document.getElementById('delay-num');
  const bpmDisplay = document.getElementById('bpm-display');
  const bpmMinus = document.getElementById('bpm-minus');
  const bpmPlus = document.getElementById('bpm-plus');
  const recButton = document.getElementById('rec-button');
  const recStatus = document.getElementById('rec-status');
  const recSubtext = document.getElementById('rec-subtext');
  const downloadBtn = document.getElementById('download-btn');
  const analyzerBars = document.getElementById('analyzer-bars');
  const freqLo = document.getElementById('freq-lo');
  const freqMid = document.getElementById('freq-mid');
  const freqHi = document.getElementById('freq-hi');

  let bpm = 120;
  let recording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordedBlob = null;
  let rafId = null;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = audioCtx.createGain();
  const filterNode = audioCtx.createBiquadFilter();
  const delayNode = audioCtx.createDelay(1.5);
  const delayFeedback = audioCtx.createGain();
  const delayWet = audioCtx.createGain();
  const dryGain = audioCtx.createGain();
  const analyser = audioCtx.createAnalyser();
  const recordDest = audioCtx.createMediaStreamDestination();

  filterNode.type = 'lowpass';
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;

  dryGain.connect(filterNode);
  filterNode.connect(delayNode);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayWet);
  filterNode.connect(masterGain);
  delayWet.connect(masterGain);
  masterGain.connect(analyser);
  masterGain.connect(recordDest);
  analyser.connect(audioCtx.destination);

  delayFeedback.gain.value = 0.35;
  delayNode.delayTime.value = 0.28;
  setVolume(43);
  setFilter(50);
  setDelay(30);

  const barCount = 32;
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'analyzer-bar';
    bar.style.height = '4px';
    analyzerBars.appendChild(bar);
    bars.push(bar);
  }

  const freqData = new Uint8Array(analyser.frequencyBinCount);

  function setVolume(val) {
    masterGain.gain.value = val / 100;
    volumeNum.textContent = `${val}%`;
    volumeSlider.style.setProperty('--val', `${val}%`);
  }

  function setFilter(val) {
    const freq = 200 + (val / 100) * 11800;
    filterNode.frequency.value = freq;
    filterNum.textContent = `${val}%`;
    filterSlider.style.setProperty('--val', `${val}%`);
  }

  function setDelay(val) {
    delayWet.gain.value = val / 100;
    delayNum.textContent = `${val}%`;
    delaySlider.style.setProperty('--val', `${val}%`);
  }

  function setBpm(val) {
    bpm = Math.min(200, Math.max(60, val));
    bpmDisplay.innerHTML = `${bpm} <span class="bpm-label">BPM</span>`;
  }

  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function noiseBurst(duration, filterFreq) {
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const band = audioCtx.createBiquadFilter();
    source.buffer = buffer;
    band.type = 'bandpass';
    band.frequency.value = filterFreq;
    gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    source.connect(band);
    band.connect(gain);
    gain.connect(dryGain);
    source.start();
    source.stop(audioCtx.currentTime + duration + 0.05);
  }

  function tone(freq, duration, type = 'sine', vol = 0.4) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dryGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.05);
  }

  const sounds = {
    kick: () => {
      tone(150, 0.08, 'sine', 0.9);
      tone(60, 0.35, 'sine', 0.7);
    },
    snare: () => noiseBurst(0.18, 1800),
    hat: () => noiseBurst(0.05, 8000),
    synth: () => tone(440, 0.25, 'triangle', 0.35),
    zap: () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(dryGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    },
    note: () => tone(523, 0.4, 'sine', 0.4),
    fx: () => tone(880, 0.15, 'square', 0.15),
    lines: () => {
      [330, 440, 550].forEach((f, i) => {
        setTimeout(() => tone(f, 0.12, 'triangle', 0.25), i * 60);
      });
    },
    sparkle: () => {
      [1200, 1600, 2000].forEach((f, i) => {
        setTimeout(() => tone(f, 0.08, 'sine', 0.2), i * 40);
      });
    },
    pulse: () => tone(220, 0.2, 'square', 0.2),
    vib: () => {
      const osc = audioCtx.createOscillator();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 300;
      lfo.frequency.value = 8;
      lfoGain.gain.value = 40;
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(dryGain);
      lfo.start();
      osc.start();
      lfo.stop(audioCtx.currentTime + 0.45);
      osc.stop(audioCtx.currentTime + 0.45);
    },
    vol: () => tone(660, 0.3, 'sine', 0.45),
    wand: () => tone(784, 0.35, 'triangle', 0.35),
    heat: () => {
      tone(200, 0.2, 'sawtooth', 0.25);
      tone(400, 0.15, 'sawtooth', 0.2);
    },
    ice: () => tone(1046, 0.5, 'sine', 0.3),
    bolt: () => {
      noiseBurst(0.08, 4000);
      tone(80, 0.15, 'square', 0.35);
    },
  };

  function flashPad(pad) {
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 120);
  }

  function playPad(pad) {
    resumeAudio();
    const sound = pad.dataset.sound;
    if (sounds[sound]) sounds[sound]();
    flashPad(pad);
  }

  function updateVisualizer() {
    analyser.getByteFrequencyData(freqData);

    let lo = 0;
    let mid = 0;
    let hi = 0;
    const third = Math.floor(freqData.length / 3);

    for (let i = 0; i < freqData.length; i++) {
      if (i < third) lo += freqData[i];
      else if (i < third * 2) mid += freqData[i];
      else hi += freqData[i];
    }

    freqLo.textContent = Math.round(lo / third);
    freqMid.textContent = Math.round(mid / third);
    freqHi.textContent = Math.round(hi / third);

    bars.forEach((bar, i) => {
      const idx = Math.floor((i / barCount) * freqData.length);
      const h = Math.max(4, (freqData[idx] / 255) * 40);
      bar.style.height = `${h}px`;
    });

    rafId = requestAnimationFrame(updateVisualizer);
  }

  function startRecording() {
    recordedChunks = [];
    recordedBlob = null;
    downloadBtn.disabled = true;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    mediaRecorder = new MediaRecorder(recordDest.stream, { mimeType });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: mimeType });
      downloadBtn.disabled = false;
    };
    mediaRecorder.start(200);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  pads.forEach((pad) => {
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      playPad(pad);
    });
  });

  const keyMap = {};
  pads.forEach((pad) => {
    if (pad.dataset.key) keyMap[pad.dataset.key] = pad;
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.target.matches('input, textarea')) return;
    const key = e.key.toLowerCase();
    if (keyMap[key]) {
      e.preventDefault();
      playPad(keyMap[key]);
    }
  });

  volumeSlider.addEventListener('input', () => setVolume(Number(volumeSlider.value)));
  filterSlider.addEventListener('input', () => setFilter(Number(filterSlider.value)));
  delaySlider.addEventListener('input', () => setDelay(Number(delaySlider.value)));

  bpmMinus.addEventListener('click', () => setBpm(bpm - 5));
  bpmPlus.addEventListener('click', () => setBpm(bpm + 5));

  recButton.addEventListener('click', () => {
    resumeAudio();
    recording = !recording;
    recButton.classList.toggle('recording', recording);
    recStatus.textContent = recording ? 'STOP' : 'REC';
    recSubtext.textContent = recording ? 'Записуємо… натисніть ще раз' : 'Натисніть для запису';

    if (recording) startRecording();
    else stopRecording();
  });

  downloadBtn.addEventListener('click', () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse-mix-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.body.addEventListener('click', resumeAudio, { once: true });
  updateVisualizer();

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (recording) stopRecording();
  });
});
