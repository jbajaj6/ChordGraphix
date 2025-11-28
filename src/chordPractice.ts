import { detectChordDetailed } from './chordDetection';

// Define common chord types and their intervals
export type ChordType = 
  | 'Major'
  | 'Minor'
  | 'Dominant 7th'
  | 'Major 7th'
  | 'Minor 7th'
  | 'Diminished'
  | 'Augmented'
  | 'Sus2'
  | 'Sus4';

export type Note = 
  | 'C' | 'C#' 
  | 'D' | 'D#' 
  | 'E' 
  | 'F' | 'F#' 
  | 'G' | 'G#' 
  | 'A' | 'A#' 
  | 'B';

export interface ChordChallenge {
  name: string;
  type: ChordType;
  notes: string[];
  displayName: string;
}

// Map chord types to their interval patterns (semitones from root)
const CHORD_INTERVALS: Record<ChordType, number[]> = {
  'Major': [0, 4, 7],
  'Minor': [0, 3, 7],
  'Dominant 7th': [0, 4, 7, 10],
  'Major 7th': [0, 4, 7, 11],
  'Minor 7th': [0, 3, 7, 10],
  'Diminished': [0, 3, 6],
  'Augmented': [0, 4, 8],
  'Sus2': [0, 2, 7],
  'Sus4': [0, 5, 7],
};

// Available root notes
const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// All available chord types for random selection
const AVAILABLE_CHORD_TYPES: ChordType[] = [
  'Major',
  'Minor',
  'Dominant 7th',
  'Major 7th',
  'Minor 7th',
  'Diminished',
  'Augmented',
  'Sus2',
  'Sus4',
];

// Difficulty levels with different chord type selections
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_CHORDS: Record<DifficultyLevel, ChordType[]> = {
  beginner: ['Major', 'Minor'],
  intermediate: ['Major', 'Minor', 'Major 7th', 'Sus2', 'Sus4'],
  advanced: AVAILABLE_CHORD_TYPES,
};

const DIFFICULTY_NOTES: Record<DifficultyLevel, Note[]> = {
    beginner: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    intermediate: ['C', 'C#', 'D', 'D#', 'E', 'F', 'G', 'A', 'A#', 'B'],
    advanced: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  };

// Convert semitone intervals to actual notes
function intervalsToNotes(root: string, intervals: number[]): string[] {
  const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = noteSequence.indexOf(root);
  
  if (rootIndex === -1) return [];
  
  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return noteSequence[noteIndex];
  });
}

/**
 * Generate a random chord challenge based on difficulty level
 */
export function generateChordChallenge(difficulty: DifficultyLevel = 'beginner'): ChordChallenge {
  const availableTypes = DIFFICULTY_CHORDS[difficulty];
  const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const availableRoots = DIFFICULTY_NOTES[difficulty];
  const randomRoot = availableRoots[Math.floor(Math.random() * availableRoots.length)];
  
  const intervals = CHORD_INTERVALS[randomType];
  const notes = intervalsToNotes(randomRoot, intervals);
  
  return {
    name: randomRoot,
    type: randomType,
    notes,
    displayName: `${randomRoot} ${randomType}`,
  };
}

/**
 * Normalize chord names for comparison
 * Handles variations like "C Major" vs "CM" vs "Cmaj"
 */
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

/**
 * Check if the played notes match the target chord
 */
export function checkChordMatch(
  targetChord: ChordChallenge,
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
  const normalizedTarget = normalizeChordName(targetChord.displayName);
  const normalizedDetected = normalizeChordName(detectedChord);

  // Check for exact match
  if (normalizedTarget === normalizedDetected) {
    return {
      isCorrect: true,
      feedback: `Perfect! You played ${targetChord.displayName} correctly! 🎉`,
      detectedChord,
      similarity: 100,
    };
  }

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

  return {
    isCorrect: false,
    feedback: `You played ${detectedChord}. The target chord is ${targetChord.displayName}. Expected notes: ${targetChord.notes.join(', ')}.`,
    detectedChord,
    similarity,
  };
}

/**
 * Get a hint for the target chord
 */
export function getChordHint(chord: ChordChallenge): string {
  const noteCount = chord.notes.length;
  const firstNote = chord.notes[0];
  
  if (noteCount === 3) {
    return `This is a triad (3 notes). Start with ${firstNote}.`;
  } else if (noteCount === 4) {
    return `This is a seventh chord (4 notes). Start with ${firstNote}.`;
  }
  
  return `Start with ${firstNote} and add ${noteCount - 1} more notes.`;
}

/**
 * Generate a sequence of progressive challenges
 */
export function generateChordSequence(
  difficulty: DifficultyLevel,
  count: number = 5
): ChordChallenge[] {
  const challenges: ChordChallenge[] = [];
  const usedChords = new Set<string>();
  
  while (challenges.length < count) {
    const challenge = generateChordChallenge(difficulty);
    
    // Avoid duplicates
    if (!usedChords.has(challenge.displayName)) {
      challenges.push(challenge);
      usedChords.add(challenge.displayName);
    }
  }
  
  return challenges;
}