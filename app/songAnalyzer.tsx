import { useState, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

// Simple note-based analyzer without Essentia for now
export default function SongAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const pickAndAnalyzeSong = async () => {
    try {
      // Pick audio file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      setAnalyzing(true);
      setResults(null);

      // For now, show a placeholder since Essentia.js is complex to set up
      // You'll need to implement the actual analysis
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      // Mock results for now
      setResults({
        key: 'E Major',
        duration: '4:21',
        bpm: 104,
        chords: [
          { timestamp: '0:00', chord: 'E Major', duration: '2.00s', notes: 'E, G#, B' },
          { timestamp: '0:02', chord: 'B Major', duration: '2.00s', notes: 'B, D#, F#' },
          { timestamp: '0:04', chord: 'C# Minor', duration: '2.00s', notes: 'C#, E, G#' },
        ]
      });

      Alert.alert('Analysis Complete', 'Song analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing song:', error);
      Alert.alert('Error', 'Failed to analyze song. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Song Chord Analyzer</Text>
      <Text style={styles.subtitle}>Upload a song to detect its chords</Text>
      <Text style={styles.note}>
        Note: This feature is under development. Currently showing sample data.
      </Text>

      <Pressable 
        style={[styles.uploadButton, analyzing && styles.uploadButtonDisabled]} 
        onPress={pickAndAnalyzeSong}
        disabled={analyzing}
      >
        <Text style={styles.buttonText}>
          {analyzing ? 'Analyzing...' : 'Upload Song'}
        </Text>
      </Pressable>

      {analyzing && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}

      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Key:</Text>
            <Text style={styles.resultValue}>{results.key || 'Unknown'}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Duration:</Text>
            <Text style={styles.resultValue}>{results.duration}s</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Beats:</Text>
            <Text style={styles.resultValue}>{results.beats}</Text>
          </View>

          <Text style={styles.chordsTitle}>Chord Progression:</Text>
          <View style={styles.chordsList}>
            {results.chords.map((chord: any, index: number) => (
              <View key={index} style={styles.chordItem}>
                <Text style={styles.chordTime}>{chord.timestamp}</Text>
                <Text style={styles.chordName}>{chord.chord}</Text>
                <Text style={styles.chordNotes}>{chord.notes}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginTop: 40,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#aaa',
    width: 100,
  },
  resultValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  chordsTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  chordsList: {
    maxHeight: 300,
  },
  chordItem: {
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chordTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  chordName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  chordNotes: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});




/*
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
// @ts-ignore
import { Essentia, EssentiaWASM } from 'essentia.js';
import * as DocumentPicker from 'expo-document-picker';

class SongChordAnalyzer {
  essentia: any;
  sampleRate: number;

  constructor() {
    this.essentia = null;
    this.sampleRate = 44100;
  }

  async initialize() {
    this.essentia = new Essentia(EssentiaWASM);
    console.log('Essentia initialized');
  }

  async analyzeSongFromFile(file: File) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    return this.analyzeAudioBuffer(audioBuffer);
  }

  analyzeAudioBuffer(audioBuffer: AudioBuffer) {
    let audioData: Float32Array;
    if (audioBuffer.numberOfChannels > 1) {
      audioData = this.stereoToMono(audioBuffer);
    } else {
      audioData = audioBuffer.getChannelData(0);
    }

    const signal = this.essentia.arrayToVector(audioData);
    
    const key = this.detectKey(signal, audioBuffer.sampleRate);
    const melody = this.extractMelody(signal, audioBuffer.sampleRate);
    const beats = this.detectBeats(signal, audioBuffer.sampleRate);
    const chordProgression = this.analyzeChords(audioData, beats, audioBuffer.sampleRate);
    
    return {
      key,
      duration: audioBuffer.duration,
      beats: beats.length,
      chords: chordProgression,
      melody
    };
  }

  stereoToMono(audioBuffer: AudioBuffer): Float32Array {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const mono = new Float32Array(left.length);
    
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2;
    }
    
    return mono;
  }

  detectKey(signal: any, sampleRate: number): string | null {
    try {
      const keyData = this.essentia.KeyExtractor(signal, sampleRate);
      return `${keyData.key} ${keyData.scale}`;
    } catch (e) {
      console.error('Key detection failed:', e);
      return null;
    }
  }

  extractMelody(signal: any, sampleRate: number) {
    const pitchMelody = this.essentia.PredominantPitchMelodia(
      signal,
      sampleRate,
      4096,
      2048,
      20,
      20000
    );
    
    const frequencies = this.essentia.vectorToArray(pitchMelody.pitch);
    const confidences = this.essentia.vectorToArray(pitchMelody.pitchConfidence);
    
    const hopSize = 2048;
    const notes = frequencies.map((freq: number, i: number) => {
      const time = (i * hopSize) / sampleRate;
      const confidence = confidences[i];
      
      if (confidence > 0.8 && freq > 0) {
        return {
          time,
          frequency: freq,
          note: this.frequencyToNote(freq),
          confidence
        };
      }
      return null;
    }).filter(Boolean);
    
    return notes;
  }

  detectBeats(signal: any, sampleRate: number): number[] {
    const beatTracker = this.essentia.RhythmExtractor2013(signal, sampleRate);
    const beats = this.essentia.vectorToArray(beatTracker.ticks);
    return beats;
  }

  analyzeChords(audioData: Float32Array, beats: number[], sampleRate: number) {
    const chords: any[] = [];
    const windowSize = 4;
    
    for (let i = 0; i < beats.length - windowSize; i += windowSize) {
      const startTime = beats[i];
      const endTime = beats[i + windowSize];
      
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      
      const segment = audioData.slice(startSample, endSample);
      const segmentVector = this.essentia.arrayToVector(segment);
      
      const pitchMelody = this.essentia.PredominantPitchMelodia(segmentVector, sampleRate);
      
      const frequencies = this.essentia.vectorToArray(pitchMelody.pitch);
      const confidences = this.essentia.vectorToArray(pitchMelody.pitchConfidence);
      
      const notes = this.getSegmentNotes(frequencies, confidences);
      
      if (notes.length >= 3) {
        chords.push({
          time: startTime,
          duration: endTime - startTime,
          notes,
          chord: this.detectChordFromNotes(notes)
        });
      }
    }
    
    return chords;
  }

  getSegmentNotes(frequencies: number[], confidences: number[], threshold: number = 0.8): string[] {
    const noteCount: { [key: string]: number } = {};
    
    frequencies.forEach((freq, i) => {
      if (confidences[i] > threshold && freq > 0) {
        const noteName = this.frequencyToNote(freq);
        const pitchClass = noteName.slice(0, -1);
        noteCount[pitchClass] = (noteCount[pitchClass] || 0) + 1;
      }
    });
    
    const sortedNotes = Object.entries(noteCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([note]) => note);
    
    return sortedNotes;
  }

  detectChordFromNotes(notes: string[]): string {
    // Simple chord detection - you could integrate tonaljs here
    if (notes.length < 3) return 'Unknown';
    return notes.join('-');
  }

  frequencyToNote(frequency: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatChordProgression(chords: any[]) {
    return chords.map(c => ({
      timestamp: this.formatTime(c.time),
      chord: c.chord,
      duration: c.duration.toFixed(2) + 's',
      notes: c.notes.join(', ')
    }));
  }
}

export default function SongAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [analyzer] = useState(() => new SongChordAnalyzer());

  const pickAndAnalyzeSong = async () => {
    try {
      // Pick audio file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      setAnalyzing(true);
      setResults(null);

      // Initialize analyzer if needed
      if (!analyzer.essentia) {
        await analyzer.initialize();
      }

      // Convert to File object
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const file = new File([blob], result.assets[0].name || 'song.mp3');

      // Analyze
      const analysis = await analyzer.analyzeSongFromFile(file);
      const formatted = analyzer.formatChordProgression(analysis.chords);

      setResults({
        key: analysis.key,
        duration: analysis.duration.toFixed(2),
        beats: analysis.beats,
        chords: formatted
      });

      Alert.alert('Analysis Complete', `Found ${formatted.length} chord segments`);
    } catch (error) {
      console.error('Error analyzing song:', error);
      Alert.alert('Error', 'Failed to analyze song. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Song Chord Analyzer</Text>
      <Text style={styles.subtitle}>Upload a song to detect its chords</Text>

      <Pressable 
        style={[styles.uploadButton, analyzing && styles.uploadButtonDisabled]} 
        onPress={pickAndAnalyzeSong}
        disabled={analyzing}
      >
        <Text style={styles.buttonText}>
          {analyzing ? 'Analyzing...' : 'Upload Song'}
        </Text>
      </Pressable>

      {analyzing && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}

      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Key:</Text>
            <Text style={styles.resultValue}>{results.key || 'Unknown'}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Duration:</Text>
            <Text style={styles.resultValue}>{results.duration}s</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Beats:</Text>
            <Text style={styles.resultValue}>{results.beats}</Text>
          </View>

          <Text style={styles.chordsTitle}>Chord Progression:</Text>
          <View style={styles.chordsList}>
            {results.chords.map((chord: any, index: number) => (
              <View key={index} style={styles.chordItem}>
                <Text style={styles.chordTime}>{chord.timestamp}</Text>
                <Text style={styles.chordName}>{chord.chord}</Text>
                <Text style={styles.chordNotes}>{chord.notes}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginTop: 40,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#aaa',
    width: 100,
  },
  resultValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  chordsTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  chordsList: {
    maxHeight: 300,
  },
  chordItem: {
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chordTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  chordName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
  chordNotes: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});

*/