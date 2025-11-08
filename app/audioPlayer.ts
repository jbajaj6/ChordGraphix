class ChordPlayer {
    private audioContext: AudioContext | null = null;
    private initialized = false;
  
    private noteFrequencies: { [key: string]: number } = {
      'C': 261.63,
      'C#': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'B': 493.88,
    };
  
    async initialize() {
      if (this.initialized) return;
      
      if (typeof window !== 'undefined') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.initialized = true;
      }
    }
  
    private getFrequency(note: string): number {
      // Remove octave number
      const noteName = note.replace(/\d/g, '');
      
      // Get octave (default to 4)
      const octaveMatch = note.match(/\d/);
      const octave = octaveMatch ? parseInt(octaveMatch[0]) : 4;
      
      // Base frequency (octave 4)
      const baseFreq = this.noteFrequencies[noteName] || 440;
      
      // Adjust for octave (each octave doubles/halves frequency)
      return baseFreq * Math.pow(2, octave - 4);
    }
  
    async playNote(note: string, duration: number = 0.5) {
      if (!this.initialized) await this.initialize();
      if (!this.audioContext) return;
  
      const frequency = this.getFrequency(note);
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
  
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
  
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
      oscillator.start(now);
      oscillator.stop(now + duration);
    }
  
    async playChord(notes: string[], duration: number = 1) {
      if (!this.initialized) await this.initialize();
      if (!this.audioContext) return;
  
      // Play all notes simultaneously
      notes.forEach(note => {
        const frequency = this.getFrequency(note);
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
  
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
  
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
  
        const now = this.audioContext!.currentTime;
        gainNode.gain.setValueAtTime(0.2, now); // Lower volume for chords
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
        oscillator.start(now);
        oscillator.stop(now + duration);
      });
    }
  
    stopAll() {
      // Web Audio API oscillators stop automatically
    }
  }
  
  export const chordPlayer = new ChordPlayer();