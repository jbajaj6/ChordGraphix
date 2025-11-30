import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SavedSong } from '../src/songStorage';
import { theme } from '../src/theme';

interface SongPracticeProps {
  song: SavedSong;
  onBack: () => void;
}

export default function SongPractice({ song, onBack }: SongPracticeProps) {
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  // Add debug logging
  React.useEffect(() => {
    if (song && song.chords) {
      console.log('Song chords data:', song.chords.slice(0, 3)); // Log first 3 chords
      console.log('First chord:', song.chords[0]);
      console.log('First chord time:', song.chords[0]?.time, typeof song.chords[0]?.time);
    }
  }, [song]);

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add null check
  if (!song || !song.chords || song.chords.length === 0) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No chords available</Text>
        </View>
      </View>
    );
  }

  const currentChord = song.chords[currentChordIndex];

  const goToNextChord = () => {
    if (currentChordIndex < song.chords.length - 1) {
      setCurrentChordIndex(currentChordIndex + 1);
    }
  };

  const goToPrevChord = () => {
    if (currentChordIndex > 0) {
      setCurrentChordIndex(currentChordIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Library</Text>
      </Pressable>

      <Text style={styles.songTitle}>{song.name}</Text>
      {song.artist && <Text style={styles.artistName}>{song.artist}</Text>}
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Key: {song.key} {song.scale}</Text>
        {song.bpm && <Text style={styles.infoText}>BPM: {song.bpm}</Text>}
      </View>

      {/* Current Chord Display */}
      <View style={styles.currentChordContainer}>
        <Text style={styles.chordLabel}>Current Chord</Text>
        <Text style={styles.currentChordName}>{currentChord.chord}</Text>
        <Text style={styles.currentChordNotes}>
          {currentChord.notes}
        </Text>
        <Text style={
              styles.chordListTime}>
              {formatTime(currentChord.time)}
            </Text>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <Pressable 
          style={[styles.navButton, currentChordIndex === 0 && styles.navButtonDisabled]}
          onPress={goToPrevChord}
          disabled={currentChordIndex === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </Pressable>
        
        <Text style={styles.progressText}>
          {currentChordIndex + 1} / {song.chords.length}
        </Text>
        
        <Pressable 
          style={[styles.navButton, currentChordIndex === song.chords.length - 1 && styles.navButtonDisabled]}
          onPress={goToNextChord}
          disabled={currentChordIndex === song.chords.length - 1}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </Pressable>
      </View>

      {/* Full Chord List */}
      <Text style={styles.listTitle}>All Chords</Text>
      <ScrollView style={styles.chordList}>
        {song.chords.map((chord, index) => (
          <Pressable
            key={index}
            style={[
              styles.chordListItem,
              index === currentChordIndex && styles.chordListItemActive
            ]}
            onPress={() => setCurrentChordIndex(index)}
          >
            <Text style={[
              styles.chordListTime,
              index === currentChordIndex && styles.chordListTimeActive
            ]}>
              {formatTime(chord.time)}
            </Text>
            <Text style={styles.chordListName}>{chord.chord}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background ,
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  songTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artistName: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
  },
  currentChordContainer: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  chordLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  currentChordName: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  currentChordNotes: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 10,
  },
  chordTime: {
    fontSize: 14,
    color: '#666',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#555',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 16,
    color: '#aaa',
  },
  listTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chordList: {
    flex: 1,
  },
  chordListItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  chordListItemActive: {
    backgroundColor: '#007AFF',
  },
  chordListTime: {
    fontSize: 14,
    color: '#aaa',
    width: 50,
  },
  chordListName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  chordListTimeActive: {
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#aaa',
  },
});