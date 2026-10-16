/* Original, synthesized arcade effects. No downloads or audio files required. */
(() => {
  'use strict';
  class ArcadeAudio {
    constructor() {
      this.enabled = true;
      try { this.enabled = localStorage.getItem('pixel-pacman-sound') !== 'off'; } catch (_) {}
      this.supported = Boolean(window.AudioContext || window.webkitAudioContext);
      this.context = null;
      this.master = null;
      this.voices = new Set();
      this.beat = 0;
      this.chomp = false;
    }

    // Call directly from a click/key gesture, before the animation loop needs audio.
    async unlock() {
      if (!this.enabled || !this.supported) return false;
      try {
        if (!this.context) {
          this.context = new (window.AudioContext || window.webkitAudioContext)();
          this.master = this.context.createGain();
          this.master.gain.value = 0.55;
          this.master.connect(this.context.destination);
        }
        if (this.context.state !== 'running') await this.context.resume();
        return this.context.state === 'running';
      } catch (_) {
        return false; // A blocked audio device must never interrupt the game.
      }
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      try { localStorage.setItem('pixel-pacman-sound', enabled ? 'on' : 'off'); } catch (_) {}
      this.stopAll();
    }

    stopAll() {
      for (const voice of this.voices) {
        // Disconnect immediately, including notes scheduled in the future.
        voice.osc.disconnect();
        voice.gain.disconnect();
        try { voice.osc.stop(); } catch (_) {}
      }
      this.voices.clear();
      this.beat = 0;
    }

    note(from, to, duration, delay = 0, volume = 0.1, type = 'square') {
      if (!this.enabled || this.context?.state !== 'running') return;
      const start = this.context.currentTime + delay;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, start);
      osc.frequency.exponentialRampToValueAtTime(to, start + duration);
      // Short attack/release avoids clicks on speakers and headphones.
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(this.master);
      const voice = { osc, gain };
      this.voices.add(voice);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
      };
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }

    melody(notes, step, volume = 0.09) {
      notes.forEach((frequency, i) => {
        if (frequency) this.note(frequency, frequency, step * 0.8, i * step, volume);
      });
    }

    play(effect) {
      if (!this.enabled || this.context?.state !== 'running') return;
      switch (effect) {
        case 'start':
          this.melody([523, 784, 659, 988, 880, 659, 784, 1047], 0.135);
          break;
        case 'dot':
          this.chomp = !this.chomp;
          this.note(this.chomp ? 780 : 420, this.chomp ? 250 : 850, 0.095, 0, 0.13, 'triangle');
          break;
        case 'power':
          this.melody([262, 523, 784, 1047], 0.08);
          break;
        case 'ghost':
          this.note(300, 1600, 0.18, 0, 0.13);
          this.note(600, 2200, 0.14, 0.12, 0.09, 'triangle');
          break;
        case 'death':
          this.note(850, 180, 0.45, 0, 0.14, 'triangle');
          this.note(600, 100, 0.35, 0.3, 0.12, 'triangle');
          this.note(220, 45, 0.4, 0.65, 0.11, 'sawtooth');
          break;
        case 'win':
          this.melody([523, 659, 784, 1047, 784, 1047, 1319, 1568], 0.12);
          break;
        case 'enabled':
          this.melody([659, 988], 0.09, 0.07);
          break;
      }
    }

    update(dt, active, powered) {
      if (!active || !this.enabled || this.context?.state !== 'running') return;
      this.beat -= dt;
      if (this.beat > 0) return;
      this.beat = powered ? 0.25 : 0.48;
      if (powered) {
        this.note(160, 320, 0.1, 0, 0.045, 'triangle');
        this.note(320, 160, 0.1, 0.12, 0.045, 'triangle');
      } else {
        // Quiet repeating siren beneath the louder chomps.
        this.note(330, 510, 0.22, 0, 0.035, 'triangle');
        this.note(510, 330, 0.22, 0.23, 0.035, 'triangle');
      }
    }
  }
  window.ArcadeAudio = ArcadeAudio;
})();
