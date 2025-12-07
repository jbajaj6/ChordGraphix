import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, useWindowDimensions, GestureResponderEvent } from 'react-native';
import { SavedSong } from '../src/songStorage';
import { theme } from '../src/theme';
import {
    ChordChallenge,
    DifficultyLevel,
    generateChordChallenge,
    getChordHint
  } from '../src/chordPractice';
 import { useChordColors, ChordName } from '../src/ChordColorsContext';
 import { detectChordDetailed } from './chordDetection';
 import { chordPlayer } from '../src/audioPlayer';

interface SongPracticeProps {
  song: SavedSong;
  onBack: () => void;
}

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const BLACK_NOTE_DEFS = [
  { note: 'C#', leftIndex: 0 },
  { note: 'D#', leftIndex: 1 },
  { note: 'F#', leftIndex: 3 },
  { note: 'G#', leftIndex: 4 },
  { note: 'A#', leftIndex: 5 },
] as const;
const BASE_OCTAVE = 4;
// Dynamic sizing based on screen width
const getKeyDimensions = (width: number, isCompact: boolean) => {
    const isTablet = width >= 768; // iPad and larger
    
    if (isTablet) {
      return {
        whiteKeyWidth: 90,
        blackKeyWidth: 54,
        whiteKeyHeight: 280,
        blackKeyHeight: 180,
      };
    } else if (!isCompact) {
      return {
        whiteKeyWidth: 60,
        blackKeyWidth: 36,
        whiteKeyHeight: 200,
        blackKeyHeight: 130,
      };
    } else {
      return {
        whiteKeyWidth: 50,
        blackKeyWidth: 30,
        whiteKeyHeight: 180,
        blackKeyHeight: 120,
      };
    }
};

function normalizeChordName(chordName: string): string {
    // Remove spaces first
    let normalized = chordName.replace(/\s+/g, '');

    // Handle case-sensitive M vs m BEFORE converting to lowercase
    // CM, BM, etc. (uppercase M) = major
    normalized = normalized.replace(/^([A-G][#b]?)M(?!ajor|inor|aj|in)/, '$1major');
    // Cm, Bm, etc. (lowercase m) = minor  
    normalized = normalized.replace(/^([A-G][#b]?)m(?!ajor|inor|aj|in)/, '$1minor');

    // NOW convert to lowercase for remaining processing
    normalized = normalized.toLowerCase();

    // Handle seventh chords
    normalized = normalized
        .replace(/maj7|major7th/, 'major7th')
        .replace(/min7|minor7th/, 'minor7th')
        .replace(/dom7|dominant7th/, 'dominant7th')
        .replace(/7(?!th)/, 'dominant7th');  // Plain "7" becomes dominant 7th

    // Handle diminished and augmented
    normalized = normalized
        .replace(/dim|diminished/, 'diminished')
        .replace(/aug|augmented/, 'augmented');

    // Handle sus chords
    normalized = normalized
        .replace(/sus2/, 'sus2')
        .replace(/sus4/, 'sus4');

    // Handle other major/minor variations
    normalized = normalized
        .replace(/^([a-g][#b]?)maj(?!or)/, '$1major')  // Matches "cmaj" but not "cmajor"
        .replace(/^([a-g][#b]?)min(?!or)/, '$1minor'); // Matches "cmin" but not "cminor"

    // If it's just a note name (c, d, e, etc.), assume major
    if (/^[a-g][#b]?$/.test(normalized)) {
        normalized += 'major';
    }

    return normalized;
}

function normalizeChordNameUpper(chordName: string): string {
    // Remove spaces first
    let normalized = chordName.replace(/\s+/g, '');

    // Handle case-sensitive M vs m BEFORE converting to lowercase
    // CM, BM, etc. (uppercase M) = major
    normalized = normalized.replace(/^([A-G][#b]?)M(?!ajor|inor|aj|in)/, '$1 Major');
    // Cm, Bm, etc. (lowercase m) = minor  
    normalized = normalized.replace(/^([A-G][#b]?)m(?!ajor|inor|aj|in)/, '$1 Minor');

    // NOW convert to lowercase for remaining processing
   // normalized = normalized.toLowerCase();

    // Handle seventh chords
    normalized = normalized
        .replace(/maj7|major7th/, 'Major7th')
        .replace(/min7|minor7th/, 'Minor7th')
        .replace(/dom7|dominant7th/, 'Dominant7th')
        .replace(/7(?!th)/, 'Dominant7th');  // Plain "7" becomes dominant 7th

    // Handle diminished and augmented
    normalized = normalized
        .replace(/dim|diminished/, 'diminished')
        .replace(/aug|augmented/, 'augmented');

    // Handle sus chords
    normalized = normalized
        .replace(/sus2/, 'sus2')
        .replace(/sus4/, 'sus4');

    // Handle other major/minor variations
    normalized = normalized
        .replace(/^([a-g][#b]?)maj(?!or)/, '$1 Major')  // Matches "cmaj" but not "cmajor"
        .replace(/^([a-g][#b]?)min(?!or)/, '$1 Minor'); // Matches "cmin" but not "cminor"

    // If it's just a note name (c, d, e, etc.), assume major
    if (/^[a-g][#b]?$/.test(normalized)) {
        normalized += ' Major';
    }

    //normalized = normalized.replace(/[a-z]/, (match) => match.toUpperCase());
    //console.log(normalized);
    return normalized;
}

export function checkChordMatch(
  targetChord: string,
  playedNotes: string[]
): {
  isCorrect: boolean;
  feedback: string;
  detectedChord: string;
  similarity: number;
} {
  if (playedNotes.length === 0) {
    return {
      isCorrect: false,
      feedback: 'No notes played yet. Try playing the chord!',
      detectedChord: 'None',
      similarity: 0,
    };
  }

  // Detect what chord was played
  const detection = detectChordDetailed(playedNotes);
  const detectedChord = detection.chord;

  // Normalize both chord names for comparison
  const normalizedTarget = normalizeChordName(targetChord);
  const normalizedDetected = normalizeChordName(detectedChord);

  // Check for exact match
  if (normalizedTarget === normalizedDetected) {
    return {
      isCorrect: true,
      feedback: `Perfect! You played ${targetChord} correctly! 🎉`,
      detectedChord,
      similarity: 100,
    };
  }
  /*
  // Check if the right root note is played
  const targetRoot = targetChord.name.toLowerCase();
  const detectedRoot = detectedChord.split(' ')[0]?.toLowerCase() || '';

  // Calculate similarity based on shared notes
  const targetNoteSet = new Set(targetChord.notes.map(n => n.toLowerCase()));
  const playedNoteSet = new Set(playedNotes.map(n => n.toLowerCase()));
  
  const intersection = new Set([...targetNoteSet].filter(n => playedNoteSet.has(n)));
  const similarity = Math.round((intersection.size / targetNoteSet.size) * 100);

  // Provide specific feedback
  if (detectedRoot !== targetRoot) {
    return {
      isCorrect: false,
      feedback: `Not quite. You played ${detectedChord}, but the target is ${targetChord.displayName}. Try starting with ${targetChord.name}.`,
      detectedChord,
      similarity,
    };
  }

  if (similarity >= 66) {
    return {
      isCorrect: false,
      feedback: `Close! You have the right root (${targetChord.name}), but you played ${detectedChord}. The target is ${targetChord.displayName}.`,
      detectedChord,
      similarity,
    };
  }
    */

  return {
    isCorrect: false,
    feedback: `You played ${detectedChord}. The target chord is ${targetChord}.`,
    detectedChord,
    similarity: 50,
  };
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

  /*code for actually practicing using the song */

    const { width } = useWindowDimensions();
    const { getChordColor } = useChordColors();
    const [pressedKeys, setPressedKeys] = useState<string[]>([]);
    const [result, setResult] = useState<string>('Tap keys to preview their tone and build a chord.');
    const [currentChallenge, setCurrentChallenge] = useState<ChordChallenge | null>(null);
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [feedback, setFeedback] = useState<string>('Select a difficulty to start practicing!');
    const [showHint, setShowHint] = useState(false);
    const [streak, setStreak] = useState(0);
    const [checked, setChecked] = useState(false);
  
    const isCompact = width < 620;
    const isTablet = width >= 768;
    const octaveCount = isCompact ? 1 : 2;
    
    const keyDimensions = getKeyDimensions(width, isCompact);
    const { whiteKeyWidth, blackKeyWidth, whiteKeyHeight, blackKeyHeight } = keyDimensions;
    const keyboardWidth = whiteKeyWidth * WHITE_NOTES.length * octaveCount;

    const currentChord = song.chords[currentChordIndex];
  
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
  
    //gets preset color for the chord
    const getChordDisplayColor = (chordName: string): string => {
      try {
        return getChordColor(chordName as ChordName);
      } catch {
        return theme.colors.accent; // Fallback color
      }
    };
  
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
      //const challenge = currentChord.chord;
      //setCurrentChallenge(challenge);
      setPressedKeys([]);
      //setFeedback(`Play the chord: ${challenge.displayName}`);
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
  
      const playedNotes = getPressedNoteNames();
      const result = checkChordMatch(currentChord.chord, playedNotes);
  
      setFeedback(result.feedback);
      setAttempts(prev => prev + 1);
      setChecked(true);
  
      if (result.isCorrect) {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        
        // Auto-advance after a short delay
        setTimeout(() => {
            goToNextChord();
          setChecked(false);
        }, 2000);
      } else {
        setStreak(0);
      }
    };
    
    /*
    const playTargetChord = async () => {
      if (!currentChallenge) return;
  
      try {
        const notesWithOctave = currentChallenge.notes.map(note => `${note}${BASE_OCTAVE}`);
        await chordPlayer.playChord(notesWithOctave, 1.35);
      } catch (error) {
        console.error('Error playing target chord:', error);
      }
    };
    */
  
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
  
    const challengeColor = currentChord 
    ? getChordDisplayColor(normalizeChordNameUpper(currentChord.chord))
    : theme.colors.accent;

    console.log('chord color:', challengeColor); 
    console.log('chord normalized:', normalizeChordNameUpper(currentChord.chord));


  const goToNextChord = () => {
    if (currentChordIndex < song.chords.length - 1) {
      setCurrentChordIndex(currentChordIndex + 1);
    }
    startNewChallenge();
  };

  const goToPrevChord = () => {
    if (currentChordIndex > 0) {
      setCurrentChordIndex(currentChordIndex - 1);
    }
    startNewChallenge();
  };

  return (

    <View style={styles.container}>
    <ScrollView style={styles.chordList}>
        <View style={styles.topsection}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Library</Text>
      </Pressable>

        <View style={styles.songTitleContainer}>
      <Text style={styles.songTitle}>{song.name}</Text>
      </View>
      {song.artist && <Text style={styles.artistName}>{song.artist}</Text>}
      
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Key: {song.key} {song.scale}</Text>
        {song.bpm && <Text style={styles.infoText}>BPM: {song.bpm}</Text>}
      </View>
      </View>

      {/* Current Chord Display */}
      <View style={styles.currentChordContainer}>
        <Text style={styles.chordLabel}>Current Chord</Text>
        <Text style={styles.currentChordName}>{currentChord.chord}</Text>
        <Text style={styles.currentChordNotes}>
          {currentChord.notes}
        </Text>
        <Text style={
              styles.chordTime}>
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

      {/* Controls */}
      
      
        <View style={styles.controlsRow}>
            {/*}
        <Pressable 
            style={styles.primaryButton} 
            onPress={startNewChallenge}
        >
            <Text style={styles.primaryButtonText}>
            {currentChord ? 'Next Challenge' : 'Start Practice'}
            </Text>
        </Pressable>
        */}
        
        {currentChord && (
            <>
            <Pressable style={styles.secondaryButton} onPress={checkAnswer}>
                <Text style={styles.secondaryButtonText}>Check Answer</Text>
            </Pressable>
            {/*}
            <Pressable style={styles.surfaceButton} onPress={playTargetChord}>
                <Text style={styles.surfaceButtonText}>Hear Target</Text>
            </Pressable>
            */}

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
        {/* Bottom section with piano */}

        <View style={styles.tabletPianoSection}>
        <View style={styles.keyboardPanel}>
            <View style={[styles.keyboardContainer, { width: keyboardWidth }]}>
            <View style={[styles.blackKeysRow, { width: keyboardWidth, height: blackKeyHeight }]} pointerEvents="box-none">
                {blackKeys.map((key) => {
                const leftPosition = (key.position + 1) * whiteKeyWidth - blackKeyWidth / 2;
                const isPressed = pressedKeys.includes(key.uniqueKey);
                return (
                    <Pressable
                    key={key.uniqueKey}
                    style={[
                        styles.blackKey,
                        { left: leftPosition, width: blackKeyWidth, height: blackKeyHeight },
                        isPressed && { backgroundColor: challengeColor },
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
                        { width: whiteKeyWidth, height: whiteKeyHeight },
                        isPressed && { backgroundColor: challengeColor },
                        isPressed && styles.whiteKeyPressed,
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
        </View>
                

      {/* Full Chord List */}
      <Text style={styles.listTitle}>All Chords</Text>
      
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
    // Tablet layout
  tabletContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  tabletTopSection: {
    flex: 1,
  },
  tabletScrollContent: {
    paddingBottom: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(3),
    gap: theme.spacing(3),
  },
  tabletPianoSection: {
    backgroundColor: theme.colors.surfaceAlt,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background ,
    padding: 20,
  },
  topsection: {
    flex: 1,
    flexDirection: 'column',
    //alignItems: 'center'
  },

  backButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  songTitleContainer: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  songTitle: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
  },
  currentChordContainer: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 5,
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
    marginTop: 10
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
  hintText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing(1),
  },
  keyboardPanel: { 
    padding: theme.spacing(1), 
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
    height: 300, 
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
    gap: theme.spacing(1) 
  },
  primaryButton: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: theme.spacing(1.5), 
    paddingVertical: theme.spacing(.5), 
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
    padding: theme.spacing(1.5), 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    gap: theme.spacing(1),
    marginTop: 10,
    marginBottom: 10
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