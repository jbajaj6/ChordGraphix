import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { chordPlayer } from './audioPlayer';
import { detectChordDetailed } from './chordDetection';

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const BLACK_NOTE_DEFS = [
  { note: 'C#', leftIndex: 0 },
  { note: 'D#', leftIndex: 1 },
  { note: 'F#', leftIndex: 3 },
  { note: 'G#', leftIndex: 4 },
  { note: 'A#', leftIndex: 5 },
] as const;
const BASE_OCTAVE = 4;
const WHITE_KEY_WIDTH = 60;
const BLACK_KEY_WIDTH = 36;

type PianoKey = {
  note: string;
  octave: number;
  uniqueKey: string;
  position: number;
  displayLabel: string;
};

const toSubscript = (value: number) =>
  String(value)
    .split('')
    .map((digit) =>
      ({
        '0': '₀',
        '1': '₁',
        '2': '₂',
        '3': '₃',
        '4': '₄',
        '5': '₅',
        '6': '₆',
        '7': '₇',
        '8': '₈',
        '9': '₉',
      }[digit] ?? digit),
    )
    .join('');

export default function Piano() {
  const { width } = useWindowDimensions();
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');

  const isCompact = width < 620;
  const octaveCount = isCompact ? 1 : 2;
  const keyboardWidth = WHITE_KEY_WIDTH * WHITE_NOTES.length * octaveCount;

  const whiteKeys = useMemo<PianoKey[]>(() => {
    const keys: PianoKey[] = [];
    for (let octave = 0; octave < octaveCount; octave++) {
      WHITE_NOTES.forEach((note, index) => {
        const position = octave * WHITE_NOTES.length + index;
        const octaveNumber = BASE_OCTAVE + octave;
        const uniqueKey = `${note}-${position}`;
        const displayLabel = `${note}${toSubscript(octaveNumber)}`;
        keys.push({ note, octave: octaveNumber, uniqueKey, position, displayLabel });
      });
    }
    return keys;
  }, [octaveCount]);

  const blackKeys = useMemo<PianoKey[]>(() => {
    const keys: PianoKey[] = [];
    for (let octave = 0; octave < octaveCount; octave++) {
      BLACK_NOTE_DEFS.forEach(({ note, leftIndex }) => {
        const position = octave * WHITE_NOTES.length + leftIndex;
        const octaveNumber = BASE_OCTAVE + octave;
        const uniqueKey = `${note}-${position}`;
        const displayLabel = `${note}${toSubscript(octaveNumber)}`;
        keys.push({ note, octave: octaveNumber, uniqueKey, position, displayLabel });
      });
    }
    return keys;
  }, [octaveCount]);

  const keyLookup = useMemo(() => {
    const map = new Map<string, PianoKey>();
    [...whiteKeys, ...blackKeys].forEach((key) => {
      map.set(key.uniqueKey, key);
    });
    return map;
  }, [whiteKeys, blackKeys]);

  const toggleKey = async (key: PianoKey) => {
    const { uniqueKey, note, octave } = key;
    const isPressed = pressedKeys.includes(uniqueKey);

    if (!isPressed) {
      try {
        await chordPlayer.playNote(`${note}${octave}`, 0.5);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    }

    setPressedKeys((prev) =>
      prev.includes(uniqueKey)
        ? prev.filter((k) => k !== uniqueKey)
        : [...prev, uniqueKey],
    );
  };

  const getPressedNoteNames = (): string[] =>
    pressedKeys.map((key) => keyLookup.get(key)?.note ?? key.split('-')[0]);

  const getPressedNotesWithOctave = (): string[] =>
    pressedKeys
      .map((key) => {
        const lookup = keyLookup.get(key);
        if (lookup) return `${lookup.note}${lookup.octave}`;
        const [note] = key.split('-');
        return `${note}${BASE_OCTAVE}`;
      })
      .filter(Boolean);

  const checkChord = () => {
    if (pressedKeys.length === 0) {
      setResult('No keys selected. Tap piano keys to build a chord.');
      return;
    }

    try {
      const noteNames = getPressedNoteNames();
      const chordInfo = detectChordDetailed(noteNames);
      const detectedChord = chordInfo.chord;

      let resultText = `Detected: ${detectedChord}`;
      if (chordInfo.alternatives.length > 0) {
        resultText += `\nAlternatives: ${chordInfo.alternatives.join(', ')}`;
      }
      resultText += `\nNotes: ${noteNames.join(', ')}`;

      setResult(resultText);
    } catch (error) {
      console.error('Error detecting chord:', error);
      setResult('Error detecting chord. Please try again.');
    }
  };

  const playCurrentChord = async () => {
    const notesWithOctave = getPressedNotesWithOctave();
    if (notesWithOctave.length === 0) {
      setResult('No keys selected. Tap piano keys to build a chord.');
      return;
    }

    try {
      await chordPlayer.playChord(notesWithOctave, 1.5);
    } catch (error) {
      console.error('Error playing chord:', error);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Piano Chord Detector</Text>
      
      <Text style={styles.info}>
        Pressed: {getPressedNoteNames().join(', ') || 'None'}
      </Text>

      <View style={[styles.keyboardContainer, { width: keyboardWidth }]}>
        {/* Black keys row */}
        <View style={[styles.blackKeysRow, { width: keyboardWidth }]}>
          {blackKeys.map((key) => {
            const leftPosition = (key.position + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
            return (
              <Pressable
                key={key.uniqueKey}
                style={[
                  styles.blackKey,
                  {
                    left: leftPosition,
                  },
                  pressedKeys.includes(key.uniqueKey) && styles.blackKeyPressed,
                ]}
                onPress={() => toggleKey(key)}
              >
                <Text style={styles.blackKeyLabel}>{key.displayLabel}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* White keys row */}
        <View style={[styles.whiteKeysRow, { width: keyboardWidth }]}>
          {whiteKeys.map((key) => (
            <Pressable
              key={key.uniqueKey}
              style={[styles.whiteKey, pressedKeys.includes(key.uniqueKey) && styles.whiteKeyPressed]}
              onPress={() => toggleKey(key)}
            >
              <Text style={styles.whiteKeyLabel}>{key.displayLabel}</Text>
            </Pressable>
          ))}
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
    marginBottom: 10,
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