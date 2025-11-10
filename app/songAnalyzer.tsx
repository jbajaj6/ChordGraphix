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
