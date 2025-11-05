import { detect as detectChordLib } from '@tonaljs/chord-detect';

/**
 * Convert note names to a format that tonaljs can understand
 * Handles sharps and flats properly
 */
function normalizeNote(note: string): string {
  // Handle sharps
  if (note.includes('#')) {
    return note;
  }
  // Handle flats (if needed in the future)
  if (note.includes('b')) {
    return note;
  }
  // Return as is for natural notes
  return note;
}

/**
 * Detect chord from an array of pressed keys
 * Uses @tonaljs/chord-detect library for accurate chord detection
 */
export function detectChord(keys: string[]): string {
  if (keys.length === 0) {
    return 'No keys pressed';
  }

  if (keys.length < 2) {
    return 'Not enough notes (need at least 2)';
  }

  try {
    // Normalize notes and ensure they're in a valid format
    const normalizedKeys = keys.map(normalizeNote);
    
    // Use tonaljs chord detection
    const detectedChords = detectChordLib(normalizedKeys);
    
    if (detectedChords.length > 0) {
      // Return the first (most likely) chord
      // tonaljs returns chords in order of likelihood
      return detectedChords[0];
    }
    
    // Fallback: try manual detection
    return detectChordManual(normalizedKeys);
  } catch (error) {
    console.error('Error detecting chord:', error);
    return detectChordManual(keys);
  }
}

/**
 * Manual chord detection as a fallback
 * Based on interval patterns and common chord types
 */
function detectChordManual(keys: string[]): string {
  if (keys.length < 2) {
    return 'Not enough notes';
  }

  // Map note names to semitones (0-11)
  const noteToSemitone: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };

  // Convert notes to semitones
  const semitones = keys
    .map(note => {
      // Handle sharps
      const normalized = note.replace('#', '#');
      return noteToSemitone[normalized] ?? noteToSemitone[note] ?? -1;
    })
    .filter(s => s >= 0)
    .sort((a, b) => a - b);

  if (semitones.length < 2) {
    return 'Invalid notes';
  }

  // Normalize to start from 0 (root)
  const root = semitones[0];
  const intervals = semitones.map(s => (s - root + 12) % 12);

  // Remove duplicates
  const uniqueIntervals = [...new Set(intervals)].sort((a, b) => a - b);

  // Common chord patterns (intervals from root)
  const chordPatterns: { [key: string]: string } = {
    '0,4,7': 'Major',      // Root, Major 3rd, Perfect 5th
    '0,3,7': 'Minor',      // Root, Minor 3rd, Perfect 5th
    '0,4,7,11': 'Major 7th',
    '0,3,7,10': 'Minor 7th',
    '0,4,7,10': 'Dominant 7th',
    '0,4,8': 'Augmented',
    '0,3,6': 'Diminished',
    '0,4,7,9': 'Major 6th',
    '0,3,7,9': 'Minor 6th',
    '0,2,7': 'Sus2',
    '0,5,7': 'Sus4',
    '0,4,7,10,2': '9th',
    '0,4,7,10,2,5': '11th',
    '0,4,7,10,2,5,9': '13th',
  };

  const intervalString = uniqueIntervals.join(',');
  
  // Try to match interval pattern exactly first
  if (chordPatterns[intervalString]) {
    const rootNote = keys[0];
    return `${rootNote} ${chordPatterns[intervalString]}`;
  }
  
  // Try to match if pattern is a subset (e.g., triad in a 7th chord)
  for (const [pattern, chordType] of Object.entries(chordPatterns)) {
    const patternIntervals = pattern.split(',').map(Number);
    // Check if all intervals in pattern are present
    const allPresent = patternIntervals.every(interval => uniqueIntervals.includes(interval));
    if (allPresent && patternIntervals.length === uniqueIntervals.length) {
      // Exact match
      const rootNote = keys[0];
      return `${rootNote} ${chordType}`;
    } else if (allPresent && patternIntervals.length <= uniqueIntervals.length) {
      // Pattern is a subset - might be a simpler chord
      const rootNote = keys[0];
      return `${rootNote} ${chordType}`;
    }
  }

  // If no pattern matches, return intervals
  return `Unknown (${keys.join(', ')})`;
}

/**
 * Get detailed chord information including all possible interpretations
 */
export function detectChordDetailed(keys: string[]): {
  chord: string;
  alternatives: string[];
  intervals: number[];
} {
  if (keys.length === 0) {
    return { chord: 'No keys pressed', alternatives: [], intervals: [] };
  }

  try {
    const normalizedKeys = keys.map(normalizeNote);
    const detectedChords = detectChordLib(normalizedKeys);
    
    return {
      chord: detectedChords.length > 0 ? detectedChords[0] : detectChordManual(normalizedKeys),
      alternatives: detectedChords.slice(1),
      intervals: [],
    };
  } catch (error) {
    const chord = detectChordManual(keys);
    return { chord, alternatives: [], intervals: [] };
  }
}

