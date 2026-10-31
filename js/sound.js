/**
 * MY LITTLE JOURNAL - Sound Synthesizer & Audio Engine
 * Pure Web Audio API crystalline bells, twinkle chimes, and soft pops.
 * Guaranteed playback across Chrome, Edge, Safari, iOS, and Android.
 */

const Sound = (() => {
  let audioCtx = null;
  let isMuted = false;
  let fallbackAudio = null;

  // Generate a crystal bell WAV Data URI as an instant fallback
  const createFallbackWavUri = () => {
    const sampleRate = 22050;
    const duration = 0.22;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV Header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true);  // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Synthesize two harmonic high chime tones (1400Hz + 2100Hz) with exponential decay
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 16);
      const s1 = Math.sin(2 * Math.PI * 1400 * t);
      const s2 = Math.sin(2 * Math.PI * 2100 * t) * 0.5;
      const sample = Math.max(-1, Math.min(1, (s1 + s2) * decay * 0.35));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  };

  // Safe Context Initializer
  const getContext = (callback) => {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }

      if (!audioCtx) {
        if (callback) callback(null);
        return;
      }

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          if (callback) callback(audioCtx);
        }).catch(() => {
          if (callback) callback(audioCtx);
        });
      } else {
        if (callback) callback(audioCtx);
      }
    } catch (e) {
      if (callback) callback(null);
    }
  };

  const canPlay = () => {
    if (isMuted) return false;
    const settings = typeof window.JournalStorage !== 'undefined' ? window.JournalStorage.getSettings() : { soundEnabled: true };
    return Boolean(settings && settings.soundEnabled);
  };

  // Fallback play if Web Audio fails
  const playFallback = () => {
    try {
      if (!fallbackAudio) {
        const wavUri = createFallbackWavUri();
        fallbackAudio = new Audio(wavUri);
        fallbackAudio.volume = 0.3;
      }
      fallbackAudio.currentTime = 0;
      fallbackAudio.play().catch(() => {});
    } catch (e) {}
  };

  return {
    init() {
      // Eagerly unlock AudioContext on earliest user touch/pointer
      const unlock = () => {
        getContext((ctx) => {});
      };
      window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
      window.addEventListener('touchstart', unlock, { capture: true, passive: true });
      window.addEventListener('mousedown', unlock, { capture: true, passive: true });
      window.addEventListener('keydown', unlock, { capture: true, passive: true });

      // Global Click Listener: Any interactive element clicked automatically plays crystal chime!
      document.addEventListener('click', (e) => {
        if (!canPlay()) return;
        const target = e.target;
        if (!target) return;

        const clickable = target.closest(
          'button, a, input, select, .nav-link, .category-card-btn, .quick-amount-btn, .quick-tag-chip, .transaction-item, .card-link-btn, .data-action-btn, .switch-toggle, .recurring-card-item, .cat-budget-card, .sidebar-pet-widget'
        );

        if (clickable) {
          // Play click chime!
          this.playClick();
        }
      }, true);
    },

    setMuted(muted) {
      isMuted = muted;
    },

    // Crisp Crystal Twinkle Chime (Dual harmonic frequencies G6: 1567Hz, C7: 2093Hz)
    playClick() {
      if (!canPlay()) return;

      getContext((ctx) => {
        if (!ctx) {
          playFallback();
          return;
        }

        try {
          const now = ctx.currentTime;
          const notes = [1567.98, 2093.0]; // G6 + C7 crystalline intervals

          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.035);

            // Crisp audible volume (peak 0.22) with delicate exponential tail
            gain.gain.setValueAtTime(0.001, now + idx * 0.035);
            gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.035 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.035);
            osc.stop(now + idx * 0.035 + 0.24);
          });
        } catch (e) {
          playFallback();
        }
      });
    },

    // Magical celestial arpeggio for saving, auto-generating, or successful actions
    playSuccess() {
      if (!canPlay()) return;

      getContext((ctx) => {
        if (!ctx) return;
        try {
          const now = ctx.currentTime;
          // E6 - G#6 - B6 - E7 celestial music-box twinkle
          const notes = [1318.51, 1661.22, 1975.53, 2637.02];

          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.001, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.38);
          });
        } catch (e) {}
      });
    },

    // Bubbly pop for tabs, chips, toggles
    playPop() {
      if (!canPlay()) return;

      getContext((ctx) => {
        if (!ctx) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.1);
        } catch (e) {}
      });
    },

    // Soft wood tap for deleting
    playDelete() {
      if (!canPlay()) return;

      getContext((ctx) => {
        if (!ctx) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.13);
        } catch (e) {}
      });
    },

    // Sweet kitten chirp for Momo
    playPet() {
      if (!canPlay()) return;

      getContext((ctx) => {
        if (!ctx) return;
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(950, now);
          osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(1300, now + 0.16);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.22);
        } catch (e) {}
      });
    }
  };
})();

// Attach to window
window.Sound = Sound;
