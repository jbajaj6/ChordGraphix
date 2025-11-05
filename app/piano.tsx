import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useState } from 'react';

export default function Piano() {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');

  const toggleKey = (note: string) => {
    console.log('Key pressed:', note);
    if (pressedKeys.includes(note)) {
      setPressedKeys(pressedKeys.filter(k => k !== note));
    } else {
      setPressedKeys([...pressedKeys, note]);
    }
  };

  const checkChord = async () => {
    Alert.alert('Button Pressed!', `Keys: ${pressedKeys.join(', ')}`);

    try {
      console.log('Checking keys:', pressedKeys);
      
      const response = await fetch('http://localhost:5001/check-chord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: pressedKeys,
          expected_chord: 'C Major'
        })
      });

      const data = await response.json();
      console.log('Response:', data);
      
      setResult(`Detected: ${data.detected_chord}\n${data.is_correct ? '✓ Correct!' : '✗ Incorrect'}`);
      
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Could not connect to backend');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Piano Chord Detector</Text>
      
      <Text style={styles.info}>
        Pressed: {pressedKeys.join(', ') || 'None'}
      </Text>

      <View style={styles.keyboard}>
        {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
          <Pressable
            key={note}
            style={[
              styles.key,
              pressedKeys.includes(note) && styles.keyPressed
            ]}
            onPress={() => toggleKey(note)}
          >
            <Text style={styles.keyLabel}>{note}</Text>
          </Pressable>
        ))}
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
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
  },
  keyboard: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  key: {
    width: 40,
    height: 120,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  keyPressed: {
    backgroundColor: '#007AFF',
  },
  keyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
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
  },
});