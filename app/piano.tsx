import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { detectChordDetailed } from './chordDetection';
import { chordPlayer } from './audioPlayer';

interface Key {
  note: string;
  isBlack: boolean;
  position: number; // Index in white keys array for positioning
}

export default function Piano() {
  // Store unique key identifiers (e.g., "B-6", "B-13" to distinguish between octaves)
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');

  // White keys - 2 octaves (C to B, C to B)
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Black keys with their positions relative to white keys - 2 octaves
  const blackKeys: Key[] = [
    // First octave
    { note: 'C#', isBlack: true, position: 0 }, // Between C and D (1st octave)
    { note: 'D#', isBlack: true, position: 1 }, // Between D and E (1st octave)
    { note: 'F#', isBlack: true, position: 3 }, // Between F and G (1st octave)
    { note: 'G#', isBlack: true, position: 4 }, // Between G and A (1st octave)
    { note: 'A#', isBlack: true, position: 5 }, // Between A and B (1st octave)
    // Second octave
    { note: 'C#', isBlack: true, position: 7 }, // Between C and D (2nd octave)
    { note: 'D#', isBlack: true, position: 8 }, // Between D and E (2nd octave)
    { note: 'F#', isBlack: true, position: 10 }, // Between F and G (2nd octave)
    { note: 'G#', isBlack: true, position: 11 }, // Between G and A (2nd octave)
    { note: 'A#', isBlack: true, position: 12 }, // Between A and B (2nd octave)
  ];

  const toggleKey = async (uniqueKey: string, note: string) => {
    console.log('Key pressed:', note, 'unique:', uniqueKey);
    
    // Play the note sound
    await chordPlayer.playNote(`${note}4`, 0.5);
    
    if (pressedKeys.includes(uniqueKey)) {
      setPressedKeys(pressedKeys.filter(k => k !== uniqueKey));
    } else {
      setPressedKeys([...pressedKeys, uniqueKey]);
    }
  };

  // Extract note names from pressed keys for chord detection (removes octave info)
  const getPressedNoteNames = (): string[] => {
    return pressedKeys.map(key => {
      // Extract note name from unique key (e.g., "B-6" -> "B", "C#-0" -> "C#")
      // Format is "NOTE-INDEX" or "NOTE#-INDEX"
      const parts = key.split('-');
      if (parts.length > 0) {
        return parts[0]; // Return the note name part (before the dash)
      }
      return key; // Fallback if format is unexpected
    });
  };

  const checkChord = () => {
    if (pressedKeys.length === 0) {
      Alert.alert('No Keys Pressed', 'Please press some keys to detect a chord.');
      setResult('');
      return;
    }

    try {
      // Get note names (without octave info) for chord detection
      const noteNames = getPressedNoteNames();
      console.log('Checking keys:', noteNames);
      
      // Use local chord detection
      const chordInfo = detectChordDetailed(noteNames);
      const detectedChord = chordInfo.chord;
      
      // Format result with alternatives if available
      let resultText = `Detected: ${detectedChord}`;
      if (chordInfo.alternatives.length > 0) {
        resultText += `\nAlternatives: ${chordInfo.alternatives.join(', ')}`;
      }
      resultText += `\nNotes: ${noteNames.join(', ')}`;
      
      setResult(resultText);
      
      // Also show alert for immediate feedback
      Alert.alert(
        'Chord Detected',
        `Chord: ${detectedChord}\n${chordInfo.alternatives.length > 0 ? `Alternatives: ${chordInfo.alternatives.join(', ')}\n` : ''}Notes: ${noteNames.join(', ')}`
      );
      
    } catch (error) {
      console.error('Error detecting chord:', error);
      Alert.alert('Error', 'Failed to detect chord. Please try again.');
      setResult('Error detecting chord');
    }
  };

  const playCurrentChord = async () => {
    const noteNames = getPressedNoteNames();
    if (noteNames.length > 0) {
      await chordPlayer.playChord(noteNames, 2);
    } else {
      Alert.alert('No Keys Pressed', 'Please press some keys first.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Piano Chord Detector</Text>
      
      <Text style={styles.info}>
        Pressed: {getPressedNoteNames().join(', ') || 'None'}
      </Text>

      <View style={styles.keyboardContainer}>
        {/* Black keys row */}
        <View style={styles.blackKeysRow}>
          {blackKeys.map((key, index) => {
            // Position black key centered between white keys
            // White keys are 60px wide, black keys are 36px wide
            // Formula: left = (position + 1) * 60 - 36/2 = (position + 1) * 60 - 18
            const leftPosition = (key.position + 1) * 60 - 18;
            // Create unique key for React
            const uniqueKey = `${key.note}-${index}`;
            // For display, show octave indicator for second octave black keys
            const displayNote = index >= 5 ? `${key.note}₂` : key.note;
            
            return (
              <Pressable
                key={uniqueKey}
                style={[
                  styles.blackKey,
                  {
                    left: leftPosition,
                  },
                  pressedKeys.includes(uniqueKey) && styles.blackKeyPressed
                ]}
                onPress={() => toggleKey(uniqueKey, key.note)}
              >
                <Text style={styles.blackKeyLabel}>{displayNote}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* White keys row */}
        <View style={styles.whiteKeysRow}>
          {whiteKeys.map((note, index) => {
            // Create unique key by combining note and index
            // This allows us to distinguish between same notes in different octaves
            const uniqueKey = `${note}-${index}`;
            // For display, show octave indicator (1 for first octave, 2 for second)
            const octave = index < 7 ? 1 : 2;
            const displayNote = index === 7 ? 'C₂' : (index === 0 ? 'C₁' : note);
            
            return (
              <Pressable
                key={uniqueKey}
                style={[
                  styles.whiteKey,
                  pressedKeys.includes(uniqueKey) && styles.whiteKeyPressed
                ]}
                onPress={() => toggleKey(uniqueKey, note)}
              >
                <Text style={styles.whiteKeyLabel}>{displayNote}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.checkButton} onPress={checkChord}>
        <Text style={styles.buttonText}>Check Chord</Text>
      </Pressable>

      <Pressable style={[styles.checkButton, styles.playButton]} onPress={playCurrentChord}>
          <Text style={styles.buttonText}>🔊 Play Chord</Text>
        </Pressable>

      {result ? (
        <Text style={styles.result}>{result}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
  },
  keyboardContainer: {
    position: 'relative',
    marginBottom: 30,
    alignItems: 'center',
  },
  whiteKeysRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  whiteKey: {
    width: 60,
    height: 200,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  whiteKeyPressed: {
    backgroundColor: '#e8f4fd',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  whiteKeyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  blackKeysRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 840, // Match white keys width: 14 keys * 60px (2 octaves)
    height: 130,
    zIndex: 1,
  },
  blackKey: {
    position: 'absolute',
    width: 36,
    height: 130,
    backgroundColor: '#1a1a1a',
    borderRadius: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  blackKeyPressed: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  blackKeyLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  result: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
});