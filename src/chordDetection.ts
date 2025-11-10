import { detect as detectChordLib } from '@tonaljs/chord-detect';

function normalizeNote(note: string): string {
  if (note.includes('#')) return note;
  if (note.includes('b')) return note;
  return note;
}

export function detectChord(keys: string[]): string {
  if (keys.length === 0) return 'No keys pressed';
  if (keys.length < 2) return 'Not enough notes (need at least 2)';

  try {
    const normalizedKeys = keys.map(normalizeNote);
    const detectedChords = detectChordLib(normalizedKeys);
    if (detectedChords.length > 0) return detectedChords[0];
    return detectChordManual(normalizedKeys);
  } catch {
    return detectChordManual(keys);
  }
}

function detectChordManual(keys: string[]): string {
  if (keys.length < 2) return 'Not enough notes';

  const noteToSemitone: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
    F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9,
    'A#': 10, Bb: 10, B: 11,
  };

  const semitones = keys
    .map((n) => noteToSemitone[n] ?? -1)
    .filter((s) => s >= 0)
    .sort((a, b) => a - b);

  if (semitones.length < 2) return 'Invalid notes';

  const root = semitones[0];
  const uniqueIntervals = [...new Set(semitones.map((s) => (s - root + 12) % 12))].sort((a, b) => a - b);

  const chordPatterns: Record<string, string> = {
    '0,4,7': 'Major',
    '0,3,7': 'Minor',
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
  const rootNote = keys[0];

  if (chordPatterns[intervalString]) return `${rootNote} ${chordPatterns[intervalString]}`;

  for (const [pattern, chordType] of Object.entries(chordPatterns)) {
    const patternIntervals = pattern.split(',').map(Number);
    const allPresent = patternIntervals.every((i) => uniqueIntervals.includes(i));
    if (allPresent) return `${rootNote} ${chordType}`;
  }

  return `Unknown (${keys.join(', ')})`;
}

export function detectChordDetailed(keys: string[]): { chord: string; alternatives: string[]; intervals: number[] } {
  if (keys.length === 0) return { chord: 'No keys pressed', alternatives: [], intervals: [] };

  try {
    const normalizedKeys = keys.map(normalizeNote);
    const detectedChords = detectChordLib(normalizedKeys);
    return {
      chord: detectedChords.length > 0 ? detectedChords[0] : detectChordManual(normalizedKeys),
      alternatives: detectedChords.slice(1),
      intervals: [],
    };
  } catch {
    const chord = detectChordManual(keys);
    return { chord, alternatives: [], intervals: [] };
  }
}
