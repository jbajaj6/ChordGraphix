import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { detectChordDetailed } from './chordDetection';

interface Key {
  note: string;
  isBlack: boolean;
  position: number; // Index in white keys array for positioning
}

export default function Piano() {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');

  // White keys
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Black keys with their positions relative to white keys
  const blackKeys: Key[] = [
    { note: 'C#', isBlack: true, position: 0 }, // Between C and D
    { note: 'D#', isBlack: true, position: 1 }, // Between D and E
    { note: 'F#', isBlack: true, position: 3 }, // Between F and G
    { note: 'G#', isBlack: true, position: 4 }, // Between G and A
    { note: 'A#', isBlack: true, position: 5 }, // Between A and B
  ];

  const toggleKey = (note: string) => {
    console.log('Key pressed:', note);
    if (pressedKeys.includes(note)) {
      setPressedKeys(pressedKeys.filter(k => k !== note));
    } else {
      setPressedKeys([...pressedKeys, note]);
    }
  };

  const checkChord = () => {
    if (pressedKeys.length === 0) {
      Alert.alert('No Keys Pressed', 'Please press some keys to detect a chord.');
      setResult('');
      return;
    }

    try {
      console.log('Checking keys:', pressedKeys);
      
      // Use local chord detection
      const chordInfo = detectChordDetailed(pressedKeys);
      const detectedChord = chordInfo.chord;
      
      // Format result with alternatives if available
      let resultText = `Detected: ${detectedChord}`;
      if (chordInfo.alternatives.length > 0) {
        resultText += `\nAlternatives: ${chordInfo.alternatives.join(', ')}`;
      }
      resultText += `\nNotes: ${pressedKeys.join(', ')}`;
      
      setResult(resultText);
      
      // Also show alert for immediate feedback
      Alert.alert(
        'Chord Detected',
        `Chord: ${detectedChord}\n${chordInfo.alternatives.length > 0 ? `Alternatives: ${chordInfo.alternatives.join(', ')}\n` : ''}Notes: ${pressedKeys.join(', ')}`
      );
      
    } catch (error) {
      console.error('Error detecting chord:', error);
      Alert.alert('Error', 'Failed to detect chord. Please try again.');
      setResult('Error detecting chord');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Piano Chord Detector</Text>
      
      <Text style={styles.info}>
        Pressed: {pressedKeys.join(', ') || 'None'}
      </Text>

      <View style={styles.keyboardContainer}>
        {/* Black keys row */}
        <View style={styles.blackKeysRow}>
          {blackKeys.map((key) => {
            // Position black key centered between white keys
            // White keys are 60px wide, black keys are 36px wide
            // Formula: left = (position + 1) * 60 - 36/2 = (position + 1) * 60 - 18
            const leftPosition = (key.position + 1) * 60 - 18;
            
            return (
              <Pressable
                key={key.note}
                style={[
                  styles.blackKey,
                  {
                    left: leftPosition,
                  },
                  pressedKeys.includes(key.note) && styles.blackKeyPressed
                ]}
                onPress={() => toggleKey(key.note)}
              >
                <Text style={styles.blackKeyLabel}>{key.note}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* White keys row */}
        <View style={styles.whiteKeysRow}>
          {whiteKeys.map((note) => (
            <Pressable
              key={note}
              style={[
                styles.whiteKey,
                pressedKeys.includes(note) && styles.whiteKeyPressed
              ]}
              onPress={() => toggleKey(note)}
            >
              <Text style={styles.whiteKeyLabel}>{note}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.checkButton} onPress={checkChord}>
        <Text style={styles.buttonText}>Check Chord</Text>
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
    width: 420, // Match white keys width: 7 keys * 60px
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