import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

class ChordPlayer {
  private audioModeSet = false;
  private activeSounds: Audio.Sound[] = [];

  // Base frequencies for octave 4 (A4 = 440Hz)
  private noteFrequencies: { [key: string]: number } = {
    'C': 261.63,
    'C#': 277.18,
    'Db': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'Eb': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'Gb': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'Ab': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'Bb': 466.16,
    'B': 493.88,
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

  /**
   * Get frequency for a note (e.g., "C4", "A#5")
   */
  private getFrequency(note: string): number {
    // Extract note name and octave
    const match = note.match(/^([A-G][#b]?)(\d+)?/);
    if (!match) return 440; // Default to A4

    const noteName = match[1];
    const octave = match[2] ? parseInt(match[2]) : 4;

    // Get base frequency for octave 4
    const baseFreq = this.noteFrequencies[noteName] || 440;

    // Adjust for octave (each octave doubles/halves frequency)
    return baseFreq * Math.pow(2, octave - 4);
  }

  /**
   * Convert bytes to base64 (React Native compatible)
   */
  private bytesToBase64(bytes: Uint8Array): string {
    // Use btoa if available (web/Expo web), otherwise use manual conversion
    if (typeof btoa !== 'undefined') {
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    // Manual base64 encoding for React Native
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

  /**
   * Generate a WAV audio buffer for a given frequency and duration
   */
  private generateToneBuffer(frequency: number, duration: number = 0.5): Uint8Array {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
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

    // Generate sine wave with envelope
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Apply envelope (fade out) for smoother sound
      const envelope = Math.max(0, 1 - (t / duration));
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32768)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    return new Uint8Array(buffer);
  }

  /**
   * Save audio buffer to a temporary file and return the URI
   */
  private async saveAudioToFile(audioData: Uint8Array, filename: string): Promise<string> {
    const fileUri = `${FileSystem.cacheDirectory}${filename}.wav`;
    const base64 = this.bytesToBase64(audioData);
    // Use string literal 'base64' - this is supported by the WritingOptions type
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64',
    });
    return fileUri;
  }

  /**
   * Play a single note
   */
  async playNote(note: string, duration: number = 0.5): Promise<void> {
    try {
      await this.ensureAudioMode();

      const frequency = this.getFrequency(note);
      const audioData = this.generateToneBuffer(frequency, duration);
      const safeNote = note.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `note_${safeNote}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileUri = await this.saveAudioToFile(audioData, filename);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, volume: 0.7 }
      );

      // Clean up after playback
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          try {
            await sound.unloadAsync();
            // Delete the temporary file
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            this.activeSounds = this.activeSounds.filter(s => s !== sound);
          } catch (error) {
            console.error('Error cleaning up sound:', error);
          }
        }
      });

      this.activeSounds.push(sound);

      // Auto-cleanup after duration + small buffer
      setTimeout(async () => {
        try {
          await sound.unloadAsync();
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          this.activeSounds = this.activeSounds.filter(s => s !== sound);
        } catch (error) {
          console.error('Error auto-cleaning sound:', error);
        }
      }, (duration + 0.5) * 1000);

    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  /**
   * Play multiple notes as a chord
   */
  async playChord(notes: string[], duration: number = 1.5): Promise<void> {
    try {
      await this.ensureAudioMode();

      // Generate all audio files first
      const audioFiles = await Promise.all(
        notes.map(async (note) => {
          const frequency = this.getFrequency(note);
          const audioData = this.generateToneBuffer(frequency, duration);
          const safeNote = note.replace(/[^a-zA-Z0-9]/g, '');
          const filename = `chord_${safeNote}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileUri = await this.saveAudioToFile(audioData, filename);
          return { fileUri, note };
        })
      );

      // Play all notes simultaneously
      const soundObjects = await Promise.all(
        audioFiles.map(({ fileUri }) =>
          Audio.Sound.createAsync(
            { uri: fileUri },
            { shouldPlay: true, volume: 0.5 } // Lower volume for chords
          )
        )
      );

      // Clean up all sounds after playback
      soundObjects.forEach(({ sound }, index) => {
        const { fileUri } = audioFiles[index];
        
        sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await sound.unloadAsync();
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              this.activeSounds = this.activeSounds.filter(s => s !== sound);
            } catch (error) {
              console.error('Error cleaning up chord sound:', error);
            }
          }
        });

        this.activeSounds.push(sound);

        // Auto-cleanup
        setTimeout(async () => {
          try {
            await sound.unloadAsync();
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            this.activeSounds = this.activeSounds.filter(s => s !== sound);
          } catch (error) {
            console.error('Error auto-cleaning chord sound:', error);
          }
        }, (duration + 0.5) * 1000);
      });

    } catch (error) {
      console.error('Error playing chord:', error);
    }
  }

  /**
   * Stop all currently playing sounds
   */
  async stopAll(): Promise<void> {
    try {
      await Promise.all(
        this.activeSounds.map(sound => 
          sound.stopAsync().then(() => sound.unloadAsync()).catch(console.error)
        )
      );
      this.activeSounds = [];
    } catch (error) {
      console.error('Error stopping sounds:', error);
    }
  }
}

export const chordPlayer = new ChordPlayer();
