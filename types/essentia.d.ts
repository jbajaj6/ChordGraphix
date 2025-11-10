declare module 'essentia.js' {
    export interface EssentiaModule {
      EssentiaJS: any;
    }
  
    export class Essentia {
      constructor(essentiaWASM: any, isDebug?: boolean);
      
      arrayToVector(array: Float32Array | number[]): any;
      vectorToArray(vector: any): number[];
      shutdown(): void;
      delete(): void;
      
      // Chord detection
      ChordsDetection(
        pcp: any,
        pcpSize?: number,
        hopSize?: number,
        windowSize?: number
      ): { chords: any; strength: any };
      
      // Chromagram for chord detection
      Chromagram(
        signal: any,
        sampleRate: number,
        frameSize?: number,
        hopSize?: number
      ): { chromagram: any };
      
      // High-level chord extractor
      ChordsDescriptors(
        signal: any,
        sampleRate: number
      ): { chords: any; chordsChanges: any; key: string; scale: string };
      
      // Pitch detection
      PredominantPitchMelodia(
        signal: any,
        sampleRate: number,
        frameSize?: number,
        hopSize?: number,
        minFrequency?: number,
        maxFrequency?: number
      ): { pitch: any; pitchConfidence: any };
      
      // Key detection
      KeyExtractor(signal: any, sampleRate: number): {
        key: string;
        scale: string;
        strength: number;
      };
      
      // Beat tracking
      RhythmExtractor2013(signal: any, sampleRate: number): {
        ticks: any;
        confidence: number;
        bpm: number;
        estimates: any;
        bpmIntervals: any;
      };
      
      // HPCP (Harmonic Pitch Class Profile) - better for chords
      HPCP(
        signal: any,
        sampleRate: number
      ): { hpcp: any };
    }
  
    export const EssentiaWASM: EssentiaModule;
  }