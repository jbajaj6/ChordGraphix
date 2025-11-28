import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the chord names as a type for type safety
export type ChordName = 
  | 'A Major' | 'A Minor'
  | 'A# Major' | 'A# Minor'
  | 'B Major' | 'B Minor'
  | 'C Major' | 'C Minor'
  | 'C# Major' | 'C# Minor'
  | 'D Major' | 'D Minor'
  | 'D# Major' | 'D# Minor'
  | 'E Major' | 'E Minor'
  | 'F Major' | 'F Minor'
  | 'F# Major' | 'F# Minor'
  | 'G Major' | 'G Minor'
  | 'G# Major' | 'G# Minor';

// Default color presets
const COLOR_PRESETS = [
  '#FF6B6B', '#FF69B4', '#9B59B6', '#4A90E2',
  '#3498DB', '#1ABC9C', '#2ECC71', '#F1C40F',
  '#E67E22', '#8B6F47', '#D4AF37', '#808000',
];

// All chord names in order
export const ALL_CHORD_NAMES: ChordName[] = [
  'A Major', 'A Minor',
  'A# Major', 'A# Minor',
  'B Major', 'B Minor',
  'C Major', 'C Minor',
  'C# Major', 'C# Minor',
  'D Major', 'D Minor',
  'D# Major', 'D# Minor',
  'E Major', 'E Minor',
  'F Major', 'F Minor',
  'F# Major', 'F# Minor',
  'G Major', 'G Minor',
  'G# Major', 'G# Minor',
];

// Type for the chord colors storage
export type ChordColors = {
  [key in ChordName]: string;
};

// Context type
interface ChordColorsContextType {
  chordColors: ChordColors;
  setChordColor: (chordName: ChordName, color: string) => void;
  getChordColor: (chordName: ChordName) => string;
  resetChordColors: () => void;
}

// Create the context
const ChordColorsContext = createContext<ChordColorsContextType | undefined>(undefined);

// Initialize default colors (random from presets)
const initializeDefaultColors = (): ChordColors => {
  const colors = {} as ChordColors;
  ALL_CHORD_NAMES.forEach(chordName => {
    colors[chordName] = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
  });
  return colors;
};

// Provider component
export const ChordColorsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chordColors, setChordColors] = useState<ChordColors>(() => {
    console.log('ChordColorsProvider: Initializing colors');
    return initializeDefaultColors();
  });

  React.useEffect(() => {
    console.log('ChordColorsProvider: Mounted');
    return () => console.log('ChordColorsProvider: Unmounted');
  }, []);

  const setChordColor = (chordName: ChordName, color: string) => {
    setChordColors(prev => ({
      ...prev,
      [chordName]: color
    }));
  };

  const getChordColor = (chordName: ChordName): string => {
    return chordColors[chordName];
  };

  const resetChordColors = () => {
    setChordColors(initializeDefaultColors());
  };

  return (
    <ChordColorsContext.Provider 
      value={{ 
        chordColors, 
        setChordColor, 
        getChordColor,
        resetChordColors 
      }}
    >
      {children}
    </ChordColorsContext.Provider>
  );
};

// Custom hook to use chord colors
export const useChordColors = () => {
  const context = useContext(ChordColorsContext);
  if (context === undefined) {
    throw new Error('useChordColors must be used within a ChordColorsProvider');
  }
  return context;
};

// Helper function to get color by chord name (for use outside of React components)
export const getChordColorByName = (chordName: ChordName, chordColors: ChordColors): string => {
  return chordColors[chordName];
};