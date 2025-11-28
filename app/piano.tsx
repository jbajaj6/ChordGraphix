import { useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { chordPlayer } from '../src/audioPlayer';
import { detectChordDetailed } from '../src/chordDetection';
import { theme } from '../src/theme';
import { useChordColors, ChordName } from '../src/ChordColorsContext';

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
  const { getChordColor } = useChordColors();
  const [result, setResult] = useState<string>('Tap keys to preview their tone and build a chord.');

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

  const pointerKeyMap = useRef<Map<string, string>>(new Map());
  const lastInteractionWasTouch = useRef(false);

  const toggleKey = async (key: PianoKey) => {
    const { uniqueKey, note, octave } = key;
    const isPressed = pressedKeys.includes(uniqueKey);

    if (!isPressed) {
      try {
        await chordPlayer.playNote(`${note}${octave}`, 0.45);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    }

    setPressedKeys((prev) =>
      prev.includes(uniqueKey) ? prev.filter((k) => k !== uniqueKey) : [...prev, uniqueKey],
    );
  };

  //gets preset color for the chord
  const getChordDisplayColor = (chordName: string): string => {
    try {
      return getChordColor(chordName as ChordName);
    } catch {
      return theme.colors.accent; // Fallback color
    }
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

  const handleTouchStart = (key: PianoKey) => (event: GestureResponderEvent) => {
    lastInteractionWasTouch.current = true;
    const touches = event.nativeEvent.changedTouches ?? [];
    touches.forEach((touch) => {
      const id = String(touch.identifier ?? touch.target ?? 0);
      if (!pointerKeyMap.current.has(id)) {
        pointerKeyMap.current.set(id, key.uniqueKey);
        toggleKey(key);
      }
    });
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const touches = event.nativeEvent.changedTouches ?? [];
    touches.forEach((touch) => {
      const id = String(touch.identifier ?? touch.target ?? 0);
      pointerKeyMap.current.delete(id);
    });
  };

  const handlePress = (key: PianoKey) => {
    if (lastInteractionWasTouch.current) {
      lastInteractionWasTouch.current = false;
      return;
    }
    toggleKey(key);
  };

  const checkChord = () => {
    if (pressedKeys.length === 0) {
      setResult('No keys selected yet. Tap a triad to detect its chord.');
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

  const chordColor = result ? getChordDisplayColor(result) : theme.colors.accent;

  const playCurrentChord = async () => {
    const notesWithOctave = getPressedNotesWithOctave();
    if (notesWithOctave.length === 0) {
      setResult('Select at least one key before playing a chord.');
      return;
    }

    try {
      await chordPlayer.playChord(notesWithOctave, 1.35);
    } catch (error) {
      console.error('Error playing chord:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Piano Chord Studio</Text>
          <Text style={styles.subtitle}>
            Adaptive {octaveCount}-octave keyboard with live audio and tonal.js detection.
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isCompact ? 'Compact mode' : 'Wide mode'}</Text>
        </View>
      </View>

      <View style={styles.keyboardPanel}>
        <View style={[styles.keyboardContainer, { width: keyboardWidth }]}>
          <View style={[styles.blackKeysRow, { width: keyboardWidth }]} pointerEvents="box-none">
            {blackKeys.map((key) => {
              const leftPosition = (key.position + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;
              const isPressed = pressedKeys.includes(key.uniqueKey);
              return (
                <Pressable
                  key={key.uniqueKey}
                  style={[
                    styles.blackKey,
                    { left: leftPosition, width: BLACK_KEY_WIDTH },
                    isPressed && styles.blackKeyPressed,
                  ]}
                  onTouchStart={handleTouchStart(key)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onPress={() => handlePress(key)}
                >
                  <Text style={styles.blackKeyLabel}>{key.displayLabel}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.whiteKeysRow, { width: keyboardWidth }]}>
            {whiteKeys.map((key) => {
              const isPressed = pressedKeys.includes(key.uniqueKey);
              return (
                <Pressable
                  key={key.uniqueKey}
                  style={[
                    styles.whiteKey,
                    isPressed && styles.whiteKeyPressed,
                    { width: WHITE_KEY_WIDTH },
                  ]}
                  onTouchStart={handleTouchStart(key)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onPress={() => handlePress(key)}
                >
                  <Text style={styles.whiteKeyLabel}>{key.displayLabel}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.primaryButton} onPress={checkChord}>
          <Text style={styles.primaryButtonText}>Check Chord</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={playCurrentChord}>
          <Text style={styles.secondaryButtonText}>Play Selection</Text>
        </Pressable>
        <Pressable
          style={styles.surfaceButton}
          onPress={() => {
            setPressedKeys([]);
            setResult('Cleared. Select new notes to begin.');
          }}
        >
          <Text style={styles.surfaceButtonText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Session Status</Text>
        <Text style={[styles.statusBody, {color : chordColor}]}>{result}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: theme.spacing(6), paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(6), gap: theme.spacing(4) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing(2) },
  title: { ...theme.typography.title, fontSize: 28, color: theme.colors.textPrimary },
  subtitle: { color: theme.colors.textSecondary, fontSize: 15, marginTop: theme.spacing(1), lineHeight: 22 },
  badge: { backgroundColor: theme.colors.accentSoft, paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.75), borderRadius: 999 },
  badgeText: { color: theme.colors.accent, fontSize: 13, fontWeight: '600' },
  keyboardPanel: { padding: theme.spacing(2), borderRadius: theme.radii.md, backgroundColor: 'transparent', borderWidth: 0, alignItems: 'center' },
  keyboardContainer: { position: 'relative', marginBottom: theme.spacing(2), alignItems: 'center', overflow: 'visible' },
  whiteKeysRow: { flexDirection: 'row', borderWidth: 2, borderColor: '#333', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  whiteKey: { height: 200, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#ddd', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 15, shadowColor: '#000', shadowOffset: { width: 1, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  whiteKeyPressed: { backgroundColor: '#e8f4fd', borderColor: '#007AFF', borderWidth: 2 },
  whiteKeyLabel: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  blackKeysRow: { position: 'absolute', top: 0, left: 0, height: 130, zIndex: 1 },
  blackKey: { position: 'absolute', width: 36, height: 130, backgroundColor: '#1a1a1a', borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5, borderWidth: 1, borderColor: '#000' },
  blackKeyPressed: { backgroundColor: '#007AFF', borderColor: '#0056b3' },
  blackKeyLabel: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  controlsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) },
  primaryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing(2.5), paddingVertical: theme.spacing(1.5), borderRadius: 999, ...theme.shadows.soft },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: theme.spacing(2.5), paddingVertical: theme.spacing(1.5), borderWidth: 1, borderColor: theme.colors.primary },
  secondaryButtonText: { color: theme.colors.accent, fontSize: 16, fontWeight: '600' },
  surfaceButton: { backgroundColor: 'transparent', borderRadius: 999, paddingHorizontal: theme.spacing(2.5), paddingVertical: theme.spacing(1.5), borderWidth: 1, borderColor: theme.colors.border },
  surfaceButtonText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },
  statusCard: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.md, padding: theme.spacing(2.5), borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(1.5) },
  statusTitle: { ...theme.typography.headline, color: theme.colors.textPrimary },
  statusBody: { ...theme.typography.body, lineHeight: 24 },
});
