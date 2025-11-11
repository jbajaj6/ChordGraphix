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

/*
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

class ChordPlayer {
  private audioModeSet = false;
  private activeSounds: Audio.Sound[] = [];

  private noteFrequencies: { [key: string]: number } = {
    C: 261.63, 'C#': 277.18, Db: 277.18, D: 293.66, 'D#': 311.13, Eb: 311.13,
    E: 329.63, F: 349.23, 'F#': 369.99, Gb: 369.99, G: 392.0, 'G#': 415.3,
    Ab: 415.3, A: 440.0, 'A#': 466.16, Bb: 466.16, B: 493.88,
  };

  private async ensureAudioMode() {
    if (this.audioModeSet) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.audioModeSet = true;
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  private getFrequency(note: string): number {
    const match = note.match(/^([A-G][#b]?)(\d+)?/);
    if (!match) return 440;
    const noteName = match[1];
    const octave = match[2] ? parseInt(match[2]) : 4;
    const baseFreq = this.noteFrequencies[noteName] || 440;
    return baseFreq * Math.pow(2, octave - 4);
  }

  private bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa !== 'undefined') {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const a = bytes[i++];
      const b = i < bytes.length ? bytes[i++] : 0;
      const c = i < bytes.length ? bytes[i++] : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += base64Chars.charAt((bitmap >> 18) & 63);
      result += base64Chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < bytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < bytes.length ? base64Chars.charAt(bitmap & 63) : '=';
    }
    return result;
  }

  private generateToneBuffer(frequency: number, duration: number = 0.5): Uint8Array {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.max(0, 1 - t / duration);
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32768)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    return new Uint8Array(buffer);
  }

  private async saveAudioToFile(audioData: Uint8Array, filename: string): Promise<string> {
    const fileUri = `${FileSystem.cacheDirectory}${filename}.wav`;
    const base64 = this.bytesToBase64(audioData);
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
    return fileUri;
  }

  async playNote(note: string, duration: number = 0.5): Promise<void> {
    try {
      await this.ensureAudioMode();
      const frequency = this.getFrequency(note);
      const audioData = this.generateToneBuffer(frequency, duration);
      const safeNote = note.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `note_${safeNote}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileUri = await this.saveAudioToFile(audioData, filename);

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true, volume: 0.7 });

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await sound.unloadAsync();
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            this.activeSounds = this.activeSounds.filter((s) => s !== sound);
          } catch (error) {
            console.error('Error cleaning up sound:', error);
          }
        }
      });

      this.activeSounds.push(sound);

      setTimeout(async () => {
        try {
          await sound.unloadAsync();
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          this.activeSounds = this.activeSounds.filter((s) => s !== sound);
        } catch (error) {
          console.error('Error auto-cleaning sound:', error);
        }
      }, (duration + 0.5) * 1000);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  async playChord(notes: string[], duration: number = 1.5): Promise<void> {
    try {
      await this.ensureAudioMode();

      const audioFiles = await Promise.all(
        notes.map(async (note) => {
          const frequency = this.getFrequency(note);
          const audioData = this.generateToneBuffer(frequency, duration);
          const safeNote = note.replace(/[^a-zA-Z0-9]/g, '');
          const filename = `chord_${safeNote}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileUri = await this.saveAudioToFile(audioData, filename);
          return { fileUri, note };
        }),
      );

      const soundObjects = await Promise.all(
        audioFiles.map(({ fileUri }) => Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true, volume: 0.5 })),
      );

      soundObjects.forEach(({ sound }, index) => {
        const { fileUri } = audioFiles[index];

        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await sound.unloadAsync();
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              this.activeSounds = this.activeSounds.filter((s) => s !== sound);
            } catch (error) {
              console.error('Error cleaning up chord sound:', error);
            }
          }
        });

        this.activeSounds.push(sound);

        setTimeout(async () => {
          try {
            await sound.unloadAsync();
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            this.activeSounds = this.activeSounds.filter((s) => s !== sound);
          } catch (error) {
            console.error('Error auto-cleaning chord sound:', error);
          }
        }, (duration + 0.5) * 1000);
      });
    } catch (error) {
      console.error('Error playing chord:', error);
    }
  }

  async stopAll(): Promise<void> {
    try {
      await Promise.all(this.activeSounds.map((sound) => sound.stopAsync().then(() => sound.unloadAsync()).catch(console.error)));
      this.activeSounds = [];
    } catch (error) {
      console.error('Error stopping sounds:', error);
    }
  }
}

export const chordPlayer = new ChordPlayer();

*/
