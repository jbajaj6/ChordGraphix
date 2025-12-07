
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { songAnalyzer } from '../src/songAnalyzer';
import { songStorage } from '../src/songStorage';
import { theme } from '../src/theme';
import { Link } from 'expo-router';

export default function SongAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [rawAnalysis, setRawAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState('');
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');

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
      setRawAnalysis(null);
      setProgress('Loading audio file...');

      //set the song name
      const fileName = result.assets[0].name || 'Unknown Song';
      setSongName(fileName.replace(/\.[^/.]+$/, '')); // Remove extension

      // Convert to File object for web
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const file = new File([blob], result.assets[0].name || 'song.mp3', {
        type: blob.type
      });

      setProgress('Analyzing first 30 seconds...');

      // Analyze only the first 30 seconds
      const analysis = await songAnalyzer.analyzeFile(file, 30);

      setProgress('Complete!');
      setRawAnalysis(analysis);

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

  const saveSongData = async () => {

      if (!rawAnalysis) {
        Alert.alert('Error', 'No analysis data available');
        return;
      }
  
      try {
        console.log('Saving with raw analysis:', {
          firstChord: rawAnalysis.chords[0],
          chordsCount: rawAnalysis.chords.length
        });
  
        const savedSong = await songStorage.saveSong({
          name: songName || 'Untitled Song',
          artist: artistName || undefined,
          duration: rawAnalysis.duration,
          analyzedDuration: rawAnalysis.analyzedDuration,
          key: rawAnalysis.key,
          scale: rawAnalysis.scale,
          bpm: rawAnalysis.bpm,
          chords: rawAnalysis.chords.map((c: any) => ({
            time: c.time,           // Now this is a number!
            duration: c.duration,   // Now this is a number!
            chord: c.chord,
            notes: c.notes          // Now this is an array!
          }))
        });
  
        console.log('Song saved successfully:', {
          id: savedSong.id,
          firstChordTime: savedSong.chords[0]?.time
        });

      Alert.alert('Success', `"${savedSong.name}" saved! You can now practice with it.`);
      
      // Clear form
      setSongName('');
      setArtistName('');
      setResults(null);
    } catch (error) {
      console.error('Error saving song:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to save song: ${errorMessage}`);
    }
  };

  return (
         

    <View style={styles.screen}>
       {/* Navigation Bar */}
       <View style={styles.nav}>
        <Link href="/songLibrary" asChild>
                  <Pressable style={styles.navItem}>
                    <Text style={styles.navIcon}>♪</Text>
                    <Text style={styles.navLabel}>Song Library</Text>
                  </Pressable>
                </Link>
            
    
            <Link href="/chordPractice" asChild>
              <Pressable style={styles.navItem}>
                <View style={styles.pianoIcon}>
                  <View style={styles.pianoKey} />
                  <View style={styles.pianoKey} />
                  <View style={styles.pianoKey} />
                </View>
                <Text style={styles.navLabel}>Chord Practice</Text>
              </Pressable>
            </Link>
    
            
          <Pressable style={[styles.navItem, styles.navItemActive]}>
              <Text style={styles.navIcon}>↑</Text>
              <Text style={styles.navLabel}>Upload Song</Text>
            </Pressable>
        
    
            <Link href="/piano" asChild>
              <Pressable style={styles.navItem}>
                <Text style={styles.navIcon}>#</Text>
                <Text style={styles.navLabel}>Piano Studio</Text>
              </Pressable>
            </Link>
              
            <Link href="/myChords" asChild>
              <Pressable style={styles.navItem}>
                <View style={styles.chordGridIcon}>
                  <View style={styles.chordDot} />
                  <View style={styles.chordDot} />
                  <View style={styles.chordDot} />
                </View>
                <Text style={styles.navLabel}>My Chords</Text>
              </Pressable>
            </Link>
    
            <Link href="/" asChild>
                <Pressable style={styles.navItem}>
                    <View style={styles.profileIcon}>
                    <View style={styles.profileIconInner} />
                    </View>
                    <Text style={styles.navLabel}>Profile</Text>
                </Pressable>
            </Link>
          </View>
      <View style={styles.container}>
      <Text style={styles.title}>Song Chord Analyzer</Text>
      <Text style={styles.subtitle}>Upload a song to detect its chords</Text>

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
          <Text style={styles.resultTitle}>Song Information</Text>
          
          <Text style={styles.inputLabel}>Song Name:</Text>
          <TextInput
            style={styles.input}
            value={songName}
            onChangeText={setSongName}
            placeholder="Enter song name"
            placeholderTextColor="#666"
          />

          <Text style={styles.inputLabel}>Artist (optional):</Text>
          <TextInput
            style={styles.input}
            value={artistName}
            onChangeText={setArtistName}
            placeholder="Enter artist name"
            placeholderTextColor="#666"
          />

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Key:</Text>
            <Text style={styles.resultValue}>{results.key || 'Unknown'} {results.scale}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>BPM:</Text>
            <Text style={styles.resultValue}>{results.bpm || 'Unknown'}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Chords Found:</Text>
            <Text style={styles.resultValue}>{results.chords.length}</Text>
          </View>

          <Pressable style={styles.saveButton} onPress={saveSongData}>
            <Text style={styles.saveButtonText}>💾 Save Song for Practice</Text>
          </Pressable>

          <Text style={styles.chordsTitle}>Chord Progression:</Text>
          {results.chords.map((chord: any, index: number) => (
            <View key={index} style={styles.chordItem}>
              <Text style={styles.chordTime}>{songAnalyzer.formatTime(chord.time)}</Text>
              <Text style={styles.chordName}>{chord.chord}</Text>
              <Text style={styles.chordNotes}>Notes: {chord.notes}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Navigation
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
    nav: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: theme.spacing(2),
      paddingHorizontal: theme.spacing(3),
      justifyContent: 'space-around',
    },
    navItem: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1),
      borderRadius: theme.radii.md,
    },
    navItemActive: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    navIcon: {
      fontSize: 28,
      color: theme.colors.textPrimary,
      marginBottom: 4,  // Match the profileIcon marginBottom
      height: 28,  // Add explicit height
      lineHeight: 28,  // Match the height
      textAlignVertical: 'center'
    },
    navLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    pianoIcon: {
      flexDirection: 'row',
      gap: 2,
      marginBottom: 4,  // Changed from 2
      height: 28,       // Added
      alignItems: 'center'
    },
    pianoKey: {
      width: 6,
      height: 20,
      backgroundColor: theme.colors.textPrimary,
      borderRadius: 2,
    },
    chordGridIcon: {
      width: 24,
      height: 28,
      borderWidth: 1,
      borderColor: theme.colors.textPrimary,
      borderRadius: 4,
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 2,
      gap: 2,
      marginBottom: 4,
    },
    chordDot: {
      width: 6,
      height: 6,
      backgroundColor: theme.colors.textPrimary,
      borderRadius: 3,
    },
    profileIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.textPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    profileIconInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.textPrimary,
    },
  inputLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    //backgroundColor: ,
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    //backgroundColor: '#1a1a1a',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...theme.typography.title, 
    fontSize: 35, 
    color: theme.colors.textPrimary,
    marginTop: 40,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.textSecondary, 
    fontSize: 15, 
    marginTop: theme.spacing(1), 
    lineHeight: 22,
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
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.md,
    padding: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 3,
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


