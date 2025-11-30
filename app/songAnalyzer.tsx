
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { songAnalyzer } from '../src/songAnalyzer';

export default function SongAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState('');

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
      setProgress('Loading audio file...');

      // Convert to File object for web
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const file = new File([blob], result.assets[0].name || 'song.mp3', {
        type: blob.type
      });

      setProgress('Analyzing first 30 seconds...');

      // Analyze only the first 30 seconds
      const analysis = await songAnalyzer.analyzeFile(file, 30)

      setProgress('Complete!');

      setResults({
        key: analysis.key,
        scale: analysis.scale,
        bpm: analysis.bpm,
        totalDuration: analysis.duration.toFixed(2),
        analyzedDuration: analysis.analyzedDuration.toFixed(2),
        chords: analysis.chords.map(c => ({
          timestamp: songAnalyzer.formatTime(c.time),
          chord: c.chord,
          duration: c.duration.toFixed(2) + 's',
          notes: c.notes.join(', '),
          strength: c.strength.toFixed(3)
        }))
      });

      Alert.alert(
        'Analysis Complete', 
        `Analyzed first ${analysis.analyzedDuration}s of ${analysis.duration.toFixed(0)}s\nFound ${analysis.chords.length} chord segments in ${analysis.key || 'Unknown key'}`
      );
    } catch (error) {
      console.error('Error analyzing song:', error);
      Alert.alert('Error', `Failed to analyze song: ${error}`);
    } finally {
      setAnalyzing(false);
      setProgress('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Song Chord Analyzer</Text>
      <Text style={styles.subtitle}>Upload a song to detect its chords</Text>
      <Text style={styles.note}>
        ⚡ Analyzes first 10 seconds for faster results
      </Text>

      <Pressable 
        style={[styles.uploadButton, analyzing && styles.uploadButtonDisabled]} 
        onPress={pickAndAnalyzeSong}
        disabled={analyzing}
      >
        <Text style={styles.buttonText}>
          {analyzing ? 'Analyzing...' : '📁 Upload Song'}
        </Text>
      </Pressable>

      {analyzing && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.progressText}>{progress}</Text>
        </View>
      )}

      {results && (
        <ScrollView style={styles.resultsScrollView} contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Key:</Text>
            <Text style={styles.resultValue}>{results.key || 'Unknown'}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Analyzed:</Text>
            <Text style={styles.resultValue}>{results.analyzedDuration}s of {results.totalDuration}s</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Segments:</Text>
            <Text style={styles.resultValue}>{results.chords.length}</Text>
          </View>

          <Text style={styles.chordsTitle}>Chord Progression:</Text>
          {results.chords.map((chord: any, index: number) => (
            <View key={index} style={styles.chordItem}>
              <Text style={styles.chordTime}>{chord.timestamp}</Text>
              <Text style={styles.chordName}>{chord.chord}</Text>
              <Text style={styles.chordNotes}>Notes: {chord.notes}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
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
    marginBottom: 5,
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
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
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  resultsScrollView: {
    width: '100%',
    maxWidth: 600,
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


