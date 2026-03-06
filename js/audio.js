// audio.js - Web Audio API sound effects for Defender

const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available:', e);
      enabled = false;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * Play a tone with optional frequency sweep
   */
  function playTone(freq, endFreq, duration, type = 'square', volume = 0.3, delay = 0) {
    if (!enabled || !ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      const startTime = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(freq, startTime);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
      }
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    } catch (e) { /* ignore */ }
  }

  /**
   * Play noise burst (for explosions)
   */
  function playNoise(duration, volume = 0.4, delay = 0) {
    if (!enabled || !ctx) return;
    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      const startTime = ctx.currentTime + delay;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(startTime);
      source.stop(startTime + duration + 0.01);
    } catch (e) { /* ignore */ }
  }

  // --- Sound effect functions ---

  function laser() {
    playTone(800, 200, 0.1, 'square', 0.2);
  }

  function explosion(size = 1) {
    playNoise(0.3 * size, 0.5 * size);
    playTone(150, 40, 0.4 * size, 'sawtooth', 0.3 * size);
  }

  function smartBomb() {
    // Rising sweep + noise burst
    for (let i = 0; i < 5; i++) {
      playTone(200 + i * 150, 800 + i * 200, 0.15, 'square', 0.3, i * 0.08);
    }
    playNoise(0.6, 0.6, 0);
  }

  function humanoidCatch() {
    playTone(440, 880, 0.1, 'sine', 0.3);
    playTone(880, 1760, 0.1, 'sine', 0.3, 0.1);
  }

  function playerDeath() {
    playNoise(1.0, 0.7);
    playTone(400, 50, 1.0, 'sawtooth', 0.4);
  }

  function hyperspace() {
    for (let i = 0; i < 8; i++) {
      playTone(
        Utils.randFloat(200, 2000),
        Utils.randFloat(100, 1000),
        0.1,
        'square',
        0.15,
        i * 0.05
      );
    }
  }

  function waveStart(wave) {
    const notes = [261, 329, 392, 523];
    notes.forEach((n, i) => {
      playTone(n, n, 0.15, 'square', 0.3, i * 0.15);
    });
    // Play extra notes for higher waves
    playTone(523 + wave * 10, 784, 0.2, 'square', 0.3, 0.6);
  }

  function waveComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      playTone(n, n, 0.15, 'sine', 0.4, i * 0.12);
    });
  }

  function mutantWarning() {
    playTone(300, 600, 0.3, 'sawtooth', 0.4);
    playTone(600, 300, 0.3, 'sawtooth', 0.4, 0.3);
  }

  return {
    init,
    resume,
    laser,
    explosion,
    smartBomb,
    humanoidCatch,
    playerDeath,
    hyperspace,
    waveStart,
    waveComplete,
    mutantWarning,
  };
})();
