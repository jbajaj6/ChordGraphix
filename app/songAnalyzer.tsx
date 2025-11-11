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

/*
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../src/theme';

// Temporary mock analysis flow until the Essentia pipeline lands
export default function SongAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  const pickAndAnalyzeSong = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setFeedback({ type: 'info', message: 'Selection cancelled.' });
        return;
      }

      setAnalyzing(true);
      setResults(null);
      setFeedback({ type: 'info', message: 'Analyzing waveform – this may take a few seconds.' });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResults({
        fileName: result.assets?.[0]?.name ?? 'Unknown track',
        key: 'E Major',
        duration: '4:21',
        bpm: 104,
        chords: [
          { timestamp: '0:00', chord: 'E Major', duration: '2.00s', notes: 'E, G#, B' },
          { timestamp: '0:02', chord: 'B Major', duration: '2.00s', notes: 'B, D#, F#' },
          { timestamp: '0:04', chord: 'C# Minor', duration: '2.00s', notes: 'C#, E, G#' },
        ],
      });

      setFeedback({ type: 'success', message: 'Analysis complete. Scroll down for chord details.' });
    } catch (error) {
      console.error('Error analyzing song:', error);
      setFeedback({ type: 'error', message: 'Failed to analyze song. Please try again.' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Song Chord Analyzer</Text>
          <Text style={styles.headerSubtitle}>
            Import a track to preview its key, tempo, and a mocked chord progression while the full
            analyzer is under construction.
          </Text>
          <View style={styles.heroTags}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>WAV · MP3 · M4A</Text>
            </View>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>Async processing</Text>
            </View>
          </View>
        </View>
        <Image
          source={require('../assets/images/partial-react-logo.png')}
          style={styles.heroGraphic}
          resizeMode="contain"
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Upload a song</Text>
        <Text style={styles.panelBody}>
          Choose any local audio file to simulate an analysis run. We’ll mock results until the full
          audio pipeline is live.
        </Text>

        <Pressable
          style={[styles.primaryButton, analyzing && styles.primaryButtonDisabled]}
          onPress={pickAndAnalyzeSong}
          disabled={analyzing}
        >
          <Text style={styles.primaryButtonText}>{analyzing ? 'Analyzing…' : 'Select audio file'}</Text>
        </Pressable>

        {analyzing && <ActivityIndicator size="large" color={theme.colors.accent} />}

        {feedback && (
          <View
            style={[
              styles.feedbackCard,
              feedback.type === 'success' && styles.feedbackSuccess,
              feedback.type === 'error' && styles.feedbackError,
            ]}
          >
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        )}
      </View>

      {results && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Analysis results</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Track</Text>
            <Text style={styles.resultValue}>{results.fileName}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Key</Text>
            <Text style={styles.resultValue}>{results.key}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Duration</Text>
            <Text style={styles.resultValue}>{results.duration}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tempo</Text>
            <Text style={styles.resultValue}>{results.bpm} BPM</Text>
          </View>

          <Text style={styles.chordsHeading}>Chord progression</Text>
          <View style={styles.chordList}>
            {results.chords.map((chord: any, index: number) => (
              <View key={index} style={styles.chordRow}>
                <View style={styles.chordTimeBadge}>
                  <Text style={styles.chordTime}>{chord.timestamp}</Text>
                </View>
                <View style={styles.chordInfo}>
                  <Text style={styles.chordName}>{chord.chord}</Text>
                  <Text style={styles.chordMeta}>{`${chord.duration} • ${chord.notes}`}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(3), paddingBottom: theme.spacing(8), gap: theme.spacing(3) },
  headerCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing(3), borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), ...theme.shadows.card },
  headerTextGroup: { flex: 1, gap: theme.spacing(1.5) },
  headerTitle: { ...theme.typography.title, fontSize: 30, color: theme.colors.textPrimary },
  headerSubtitle: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 24 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) },
  heroTag: { backgroundColor: theme.colors.accentSoft, borderRadius: 999, paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.5) },
  heroTagText: { color: theme.colors.accent, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  heroGraphic: { width: 120, height: 120, opacity: 0.75 },
  panel: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing(3), gap: theme.spacing(2) },
  panelTitle: { ...theme.typography.headline, color: theme.colors.textPrimary },
  panelBody: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 23 },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: theme.radii.md, paddingVertical: theme.spacing(1.5), alignItems: 'center', ...theme.shadows.soft },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  feedbackCard: { borderRadius: theme.radii.md, padding: theme.spacing(1.5), borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  feedbackSuccess: { borderColor: theme.colors.success, backgroundColor: 'rgba(52, 211, 153, 0.12)' },
  feedbackError: { borderColor: theme.colors.danger, backgroundColor: 'rgba(248, 113, 113, 0.12)' },
  feedbackText: { ...theme.typography.body, color: theme.colors.textPrimary },
  resultsCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing(3), gap: theme.spacing(2) },
  resultsTitle: { ...theme.typography.headline, color: theme.colors.textPrimary },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: theme.colors.border, paddingVertical: theme.spacing(1.25) },
  resultLabel: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  resultValue: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  chordsHeading: { ...theme.typography.headline, fontSize: 18, color: theme.colors.accent, marginTop: theme.spacing(1.5) },
  chordList: { gap: theme.spacing(1) },
  chordRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), padding: theme.spacing(1.25), borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  chordTimeBadge: { backgroundColor: theme.colors.primarySoft, borderRadius: theme.radii.sm, paddingHorizontal: theme.spacing(1), paddingVertical: theme.spacing(0.5) },
  chordTime: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  chordInfo: { flex: 1 },
  chordName: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' },
  chordMeta: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 2 },
});

*/
