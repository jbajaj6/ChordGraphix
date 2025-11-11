import { Chord } from '@tonaljs/tonal';

interface ChordSegment {
  time: number;
  duration: number;
  chord: string;
  notes: string[];
  strength: number;
}

interface AnalysisResult {
  duration: number;
  analyzedDuration: number;
  chords: ChordSegment[];
  key: string | null;
  scale: string | null;
  bpm: number | null;
}

class SongAnalyzer {
  private audioContext: AudioContext | null = null;

  async initialize() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async analyzeFile(file: File, maxDuration: number = 30): Promise<AnalysisResult> {
    await this.initialize();
    
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    console.log('Audio loaded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels
    });

    const audioData = this.getMonoAudioData(audioBuffer, maxDuration);
    const analyzedDuration = Math.min(audioBuffer.duration, maxDuration);
    
    console.log(`Analyzing first ${analyzedDuration} seconds...`);

    // Detect chords
    const chords = await this.detectChords(
      audioData, 
      audioBuffer.sampleRate, 
      analyzedDuration
    );

    // Estimate key from detected chords
    const { key, scale } = this.estimateKey(chords);

    // Simple BPM detection
    const bpm = this.estimateBPM(audioData, audioBuffer.sampleRate);

    return {
      duration: audioBuffer.duration,
      analyzedDuration,
      chords,
      key,
      scale,
      bpm
    };
  }

  private getMonoAudioData(audioBuffer: AudioBuffer, maxDuration?: number): Float32Array {
    const maxSamples = maxDuration 
      ? Math.min(Math.floor(maxDuration * audioBuffer.sampleRate), audioBuffer.length)
      : audioBuffer.length;

    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer.getChannelData(0).slice(0, maxSamples);
    }

    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const mono = new Float32Array(maxSamples);

    for (let i = 0; i < maxSamples; i++) {
      mono[i] = (left[i] + right[i]) / 2;
    }

    return mono;
  }

  private async detectChords(
    audioData: Float32Array,
    sampleRate: number,
    duration: number
  ): Promise<ChordSegment[]> {
    const chords: ChordSegment[] = [];
    const segmentDuration = 2; // 2 second segments
    const segmentSamples = Math.floor(segmentDuration * sampleRate);
    const numSegments = Math.floor(audioData.length / segmentSamples);

    console.log(`Analyzing ${numSegments} segments...`);

    for (let i = 0; i < numSegments; i++) {
      const start = i * segmentSamples;
      const end = Math.min(start + segmentSamples, audioData.length);
      const segment = audioData.slice(start, end);

      // Detect chromagram (pitch class profile)
      const chromagram = this.computeChromagram(segment, sampleRate);
      
      // Detect chord from chromagram
      const chordInfo = this.chromagramToChord(chromagram);

      chords.push({
        time: (start / sampleRate),
        duration: segmentDuration,
        chord: chordInfo.chord,
        notes: chordInfo.notes,
        strength: chordInfo.strength
      });

      if (i % 5 === 0) {
        console.log(`Progress: ${Math.round((i / numSegments) * 100)}%`);
      }
    }

    return chords;
  }

  /**
   * Compute chromagram (12-bin pitch class profile)
   */
  private computeChromagram(audioData: Float32Array, sampleRate: number): number[] {
    const chromagram = new Array(12).fill(0);
    const fftSize = 4096;
    const hopSize = 2048;
    const numFrames = Math.floor((audioData.length - fftSize) / hopSize);

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const frameData = audioData.slice(start, start + fftSize);
      
      // Compute magnitude spectrum
      const spectrum = this.computeMagnitudeSpectrum(frameData);
      
      // Map spectrum to pitch classes
      for (let bin = 0; bin < spectrum.length; bin++) {
        const frequency = (bin * sampleRate) / fftSize;
        
        if (frequency < 80 || frequency > 2000) continue;
        
        // Convert frequency to pitch class (0-11)
        const pitchClass = this.frequencyToPitchClass(frequency);
        chromagram[pitchClass] += spectrum[bin];
      }
    }

    // Normalize
    const max = Math.max(...chromagram);
    if (max > 0) {
      for (let i = 0; i < 12; i++) {
        chromagram[i] /= max;
      }
    }

    return chromagram;
  }

  /**
   * Compute magnitude spectrum using DFT
   */
  private computeMagnitudeSpectrum(signal: Float32Array): Float32Array {
    const N = signal.length;
    const spectrum = new Float32Array(N / 2);

    // Apply Hamming window
    for (let i = 0; i < N; i++) {
      const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
      signal[i] *= window;
    }

    // Compute magnitude spectrum (simplified DFT for lower frequencies)
    const maxBin = Math.min(N / 2, 2000); // Only compute up to ~2kHz
    for (let k = 0; k < maxBin; k++) {
      let real = 0;
      let imag = 0;
      
      // Sample every nth point for speed
      const step = Math.max(1, Math.floor(N / 1024));
      
      for (let n = 0; n < N; n += step) {
        const angle = (2 * Math.PI * k * n) / N;
        real += signal[n] * Math.cos(angle);
        imag -= signal[n] * Math.sin(angle);
      }
      
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
  }

  /**
   * Convert frequency to pitch class (0=C, 1=C#, ..., 11=B)
   */
  private frequencyToPitchClass(frequency: number): number {
    const noteNum = 12 * Math.log2(frequency / 440);
    const midi = Math.round(noteNum) + 69;
    return midi % 12;
  }

  /**
   * Detect chord from chromagram using template matching
   */
  private chromagramToChord(chromagram: number[]): { chord: string; notes: string[]; strength: number } {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Chord templates (major, minor, 7th)
    const templates: { [key: string]: { pattern: number[]; notes: number[] } } = {
      'major': { pattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], notes: [0, 4, 7] },
      'minor': { pattern: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], notes: [0, 3, 7] },
      //'dom7': { pattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], notes: [0, 4, 7, 10] },
      //'min7': { pattern: [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], notes: [0, 3, 7, 10] },
      //'maj7': { pattern: [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], notes: [0, 4, 7, 11] },
    };

    let bestMatch = { chord: 'Unknown', notes: [] as string[], strength: 0, root: 0 };

    // Try all 12 roots
    for (let root = 0; root < 12; root++) {
      for (const [chordType, template] of Object.entries(templates)) {
        let score = 0;
        
        // Rotate template to match root
        for (let i = 0; i < 12; i++) {
          const chromaIdx = (i + root) % 12;
          score += chromagram[chromaIdx] * template.pattern[i];
        }

        if (score > bestMatch.strength) {
          const chordNotes = template.notes.map(offset => noteNames[(root + offset) % 12]);
          const chordName = chordType === 'major' 
            ? noteNames[root]
            : chordType === 'minor'
            ? `${noteNames[root]}m`
            : `${noteNames[root]}${chordType.replace('dom', '').replace('maj', 'M').replace('min', 'm')}`;
          
          bestMatch = {
            chord: chordName,
            notes: chordNotes,
            strength: score,
            root
          };
        }
      }
    }

    console.log(`Best match: ${bestMatch.chord}`);
    console.log(`Chord notes: ${bestMatch.notes.join(', ')}`);

    // If strength is too low, mark as unknown
    if (bestMatch.strength < 0.5) {
      return { chord: 'Unknown', notes: [], strength: 0 };
    }

    return bestMatch;
  }

  /**
   * Estimate musical key from chord progression
   */
  private estimateKey(chords: ChordSegment[]): { key: string | null; scale: string | null } {
    if (chords.length === 0) return { key: null, scale: null };

    const noteCount: { [key: string]: number } = {};
    
    chords.forEach(chord => {
      chord.notes.forEach(note => {
        noteCount[note] = (noteCount[note] || 0) + chord.strength;
      });
    });

    const sortedNotes = Object.entries(noteCount)
      .sort((a, b) => b[1] - a[1]);

    if (sortedNotes.length > 0) {
      const tonic = sortedNotes[0][0];
      
      // Determine major vs minor
      const majorChords = chords.filter(c => 
        !c.chord.includes('m') && c.chord !== 'Unknown'
      ).length;
      const minorChords = chords.filter(c => 
        c.chord.includes('m') && c.chord !== 'Unknown'
      ).length;
      
      const scale = majorChords >= minorChords ? 'major' : 'minor';
      return { key: tonic, scale };
    }

    return { key: null, scale: null };
  }

  /**
   * Simple BPM estimation using onset detection
   */
  private estimateBPM(audioData: Float32Array, sampleRate: number): number | null {
    const hopSize = 512;
    const onsets: number[] = [];
    let prevEnergy = 0;

    // Detect onsets (sudden increases in energy)
    for (let i = 0; i < audioData.length - hopSize; i += hopSize) {
      const frame = audioData.slice(i, i + hopSize);
      const energy = frame.reduce((sum, val) => sum + val * val, 0);
      
      if (energy > prevEnergy * 1.5 && energy > 0.01) {
        onsets.push(i / sampleRate);
      }
      prevEnergy = energy;
    }

    if (onsets.length < 2) return null;

    // Calculate average interval between onsets
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;

    // Sanity check (typical music is 60-180 BPM)
    return bpm >= 40 && bpm <= 200 ? Math.round(bpm) : null;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export const songAnalyzer = new SongAnalyzer();
