import React, { useMemo, useRef, useState } from 'react';
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
import { theme } from '../src/theme';
import {
  ChordChallenge,
  DifficultyLevel,
  checkChordMatch,
  generateChordChallenge,
  getChordHint,
} from '../src/chordPractice';

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
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      }[digit] ?? digit),
    )
    .join('');

export default function ChordPractice() {
  const { width } = useWindowDimensions();
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [result, setResult] = useState<string>('Tap keys to preview their tone and build a chord.');
  const [currentChallenge, setCurrentChallenge] = useState<ChordChallenge | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string>('Select a difficulty to start practicing!');
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);

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

  const startNewChallenge = () => {
    const challenge = generateChordChallenge(difficulty);
    setCurrentChallenge(challenge);
    setPressedKeys([]);
    setFeedback(`Play the chord: ${challenge.displayName}`);
    setShowHint(false);
  };

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

  const getPressedNotesWithOctave = (): string[] =>
    pressedKeys
      .map((key) => {
        const lookup = keyLookup.get(key);
        if (lookup) return `${lookup.note}${lookup.octave}`;
        const [note] = key.split('-');
        return `${note}${BASE_OCTAVE}`;
      })
      .filter(Boolean);

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

  const getPressedNoteNames = (): string[] =>
    pressedKeys.map((key) => keyLookup.get(key)?.note ?? key.split('-')[0]);

  const checkAnswer = () => {
    if (!currentChallenge) {
      setFeedback('Start a new challenge first!');
      return;
    }

    const playedNotes = getPressedNoteNames();
    const result = checkChordMatch(currentChallenge, playedNotes);

    setFeedback(result.feedback);
    setAttempts(prev => prev + 1);

    if (result.isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      
      // Auto-advance after a short delay
      setTimeout(() => {
        startNewChallenge();
      }, 2000);
    } else {
      setStreak(0);
    }
  };

  const playTargetChord = async () => {
    if (!currentChallenge) return;

    try {
      const notesWithOctave = currentChallenge.notes.map(note => `${note}${BASE_OCTAVE}`);
      await chordPlayer.playChord(notesWithOctave, 1.35);
    } catch (error) {
      console.error('Error playing target chord:', error);
    }
  };

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

  const accuracyRate = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.screen}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Chord Practice</Text>
          <Text style={styles.subtitle}>
            Master your chord recognition with randomized challenges
          </Text>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreLabel}>Correct</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{attempts}</Text>
            <Text style={styles.scoreLabel}>Attempts</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{accuracyRate}%</Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{streak}</Text>
            <Text style={styles.scoreLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Difficulty Selection */}
      <View style={styles.difficultyCard}>
        <Text style={styles.difficultyTitle}>Difficulty</Text>
        <View style={styles.difficultyButtons}>
          {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((level) => (
            <Pressable
              key={level}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.difficultyButtonActive,
              ]}
              onPress={() => {
                setDifficulty(level);
                setScore(0);
                setAttempts(0);
                setStreak(0);
                setCurrentChallenge(null);
                setFeedback(`Difficulty set to ${level}. Start a new challenge!`);
              }}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  difficulty === level && styles.difficultyButtonTextActive,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Challenge Display */}
      {currentChallenge && (
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>Current Challenge</Text>
          <Text style={styles.challengeChord}>{currentChallenge.displayName}</Text>
          {showHint && (
            <Text style={styles.challengeNotes}>
                Expected notes: {currentChallenge.notes.join(', ')}
            </Text>
          )}
          
        </View>
      )}

      {/* Piano Keyboard */}
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

      {/* Controls */}
      <View style={styles.controlsRow}>
        <Pressable 
          style={styles.primaryButton} 
          onPress={startNewChallenge}
        >
          <Text style={styles.primaryButtonText}>
            {currentChallenge ? 'Next Challenge' : 'Start Practice'}
          </Text>
        </Pressable>
        
        {currentChallenge && (
          <>
            <Pressable style={styles.secondaryButton} onPress={checkAnswer}>
              <Text style={styles.secondaryButtonText}>Check Answer</Text>
            </Pressable>
            
            <Pressable style={styles.surfaceButton} onPress={playTargetChord}>
              <Text style={styles.surfaceButtonText}>Hear Target</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={playCurrentChord}>
                <Text style={styles.secondaryButtonText}>Play Selection</Text>
            </Pressable>
            
            <Pressable 
              style={styles.surfaceButton} 
              onPress={() => setShowHint(!showHint)}
            >
              <Text style={styles.surfaceButtonText}>
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Text>
            </Pressable>
          </>
        )}
        
        <Pressable
          style={styles.surfaceButton}
          onPress={() => {
            setPressedKeys([]);
          }}
        >
          <Text style={styles.surfaceButtonText}>Clear Keys</Text>
        </Pressable>
      </View>

      {/* Feedback */}
      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>Feedback</Text>
        <Text style={styles.feedbackBody}>{feedback}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { 
    paddingBottom: theme.spacing(6), 
    paddingHorizontal: theme.spacing(3), 
    paddingTop: theme.spacing(6), 
    gap: theme.spacing(4) 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    gap: theme.spacing(2) 
  },
  title: { 
    ...theme.typography.title, 
    fontSize: 28, 
    color: theme.colors.textPrimary 
  },
  subtitle: { 
    color: theme.colors.textSecondary, 
    fontSize: 15, 
    marginTop: theme.spacing(1), 
    lineHeight: 22 
  },
  scoreCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.md,
    padding: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  difficultyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  difficultyTitle: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing(1.5),
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(2),
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  challengeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing(3),
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(1),
  },
  challengeChord: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.accent,
    marginBottom: theme.spacing(1),
  },
  challengeNotes: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing(1),
  },
  keyboardPanel: { 
    padding: theme.spacing(2), 
    borderRadius: theme.radii.md, 
    backgroundColor: 'transparent', 
    borderWidth: 0, 
    alignItems: 'center' 
  },
  keyboardContainer: { 
    position: 'relative', 
    marginBottom: theme.spacing(2), 
    alignItems: 'center', 
    overflow: 'visible' 
  },
  whiteKeysRow: { 
    flexDirection: 'row', 
    borderWidth: 2, 
    borderColor: '#333', 
    borderRadius: 8, 
    overflow: 'hidden', 
    backgroundColor: '#f0f0f0' 
  },
  whiteKey: { 
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
    shadowRadius: 2 
  },
  whiteKeyPressed: { 
    backgroundColor: '#e8f4fd', 
    borderColor: '#007AFF', 
    borderWidth: 2 
  },
  whiteKeyLabel: { 
    color: '#333', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  blackKeysRow: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    height: 130, 
    zIndex: 1 
  },
  blackKey: { 
    position: 'absolute', 
    width: 36, 
    height: 130, 
    backgroundColor: '#1a1a1a', 
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
    borderColor: '#000' 
  },
  blackKeyPressed: { 
    backgroundColor: '#007AFF', 
    borderColor: '#0056b3' 
  },
  blackKeyLabel: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  controlsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: theme.spacing(2) 
  },
  primaryButton: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: theme.spacing(2.5), 
    paddingVertical: theme.spacing(1.5), 
    borderRadius: 999, 
    ...theme.shadows.soft 
  },
  primaryButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  secondaryButton: { 
    backgroundColor: theme.colors.surfaceAlt, 
    borderRadius: 999, 
    paddingHorizontal: theme.spacing(2.5), 
    paddingVertical: theme.spacing(1.5), 
    borderWidth: 1, 
    borderColor: theme.colors.primary 
  },
  secondaryButtonText: { 
    color: theme.colors.accent, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  surfaceButton: { 
    backgroundColor: 'transparent', 
    borderRadius: 999, 
    paddingHorizontal: theme.spacing(2.5), 
    paddingVertical: theme.spacing(1.5), 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  surfaceButtonText: { 
    color: theme.colors.textMuted, 
    fontSize: 15, 
    fontWeight: '600' 
  },
  feedbackCard: { 
    backgroundColor: theme.colors.surfaceAlt, 
    borderRadius: theme.radii.md, 
    padding: theme.spacing(2.5), 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    gap: theme.spacing(1.5) 
  },
  feedbackTitle: { 
    ...theme.typography.headline, 
    color: theme.colors.textPrimary 
  },
  feedbackBody: { 
    ...theme.typography.body, 
    color: theme.colors.textSecondary, 
    lineHeight: 24 
  },
});