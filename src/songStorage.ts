import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import songsData from './songs.json';

export interface SavedChord {
  time: number;
  duration: number;
  chord: string;
  notes: string[];
}

export interface SavedSong {
  id: string;
  name: string;
  artist?: string;
  dateAnalyzed: string;
  duration?: number;
  analyzedDuration: number;
  key: string | null;
  scale: string | null;
  bpm: number | null;
  chords: SavedChord[];
}

const STORAGE_KEY = '@analyzed_songs';

// Normalize song data from JSON to match SavedSong interface
function normalizeSong(song: any): SavedSong {
  // Normalize chords
  const normalizedChords: SavedChord[] = [];
  let currentTime = 0;

  for (let i = 0; i < song.chords.length; i++) {
    const chord = song.chords[i];
    
    // Handle time - use provided time or calculate from previous chords
    const time = chord.time !== undefined ? 
      (typeof chord.time === 'string' ? parseFloat(chord.time) : chord.time) : 
      currentTime;
    
    // Handle duration
    const duration = typeof chord.duration === 'string' ? 
      parseFloat(chord.duration) : 
      chord.duration;
    
    // Handle notes - convert string to array if needed
    let notes: string[];
    if (typeof chord.notes === 'string') {
      // Split comma-separated string and trim
      notes = chord.notes.split(',').map((n: string) => n.trim());
    } else if (Array.isArray(chord.notes)) {
      notes = chord.notes;
    } else {
      notes = [];
    }
    
    normalizedChords.push({
      time,
      duration,
      chord: chord.chord,
      notes,
    });
    
    // Update currentTime for next chord if time wasn't provided
    currentTime = time + duration;
  }
  
  // Normalize analyzedDuration
  const analyzedDuration = typeof song.analyzedDuration === 'string' ?
    parseFloat(song.analyzedDuration) :
    song.analyzedDuration;
  
  // Normalize duration (optional field)
  const duration = song.duration !== undefined ?
    (typeof song.duration === 'string' ? parseFloat(song.duration) : song.duration) :
    undefined;
  
  return {
    id: song.id,
    name: song.name,
    artist: song.artist,
    dateAnalyzed: song.dateAnalyzed || new Date().toISOString(),
    duration,
    analyzedDuration,
    key: song.key || null,
    scale: song.scale || null,
    bpm: song.bpm || null,
    chords: normalizedChords,
  };
}

// Load songs from JSON file
function loadSongsFromJSON(): SavedSong[] {
  try {
    if (!songsData || !Array.isArray(songsData)) {
      return [];
    }
    
    return songsData.map(normalizeSong);
  } catch (error) {
    console.error('Error loading songs from JSON:', error);
    return [];
  }
}

class SongStorageService {
  // Save a new analyzed song
  async saveSong(songData: Omit<SavedSong, 'id' | 'dateAnalyzed'>): Promise<SavedSong> {
    try {
      const songs = await this.getAllSongs();
      
      const newSong: SavedSong = {
        ...songData,
        id: Date.now().toString(),
        dateAnalyzed: new Date().toISOString(),
      };
      
      songs.push(newSong);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
      
      return newSong;
    } catch (error) {
      console.error('Error saving song:', error);
      throw error;
    }
  }

  // Get all saved songs (from both JSON and AsyncStorage)
  async getAllSongs(): Promise<SavedSong[]> {
    try {
      // Load songs from JSON file
      const jsonSongs = loadSongsFromJSON();
      
      // Load songs from AsyncStorage
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      let storageSongs: SavedSong[] = [];
      
      if (data) {
        const parsed = JSON.parse(data);
        storageSongs = parsed.map((song: SavedSong) => ({
          ...song,
          chords: song.chords.map(chord => ({
            ...chord,
            time: typeof chord.time === 'string' ? parseFloat(chord.time) : chord.time,
            duration: typeof chord.duration === 'string' ? parseFloat(chord.duration) : chord.duration,
          }))
        }));
      }
      
      // Merge songs, with AsyncStorage songs taking precedence (they can override JSON songs)
      const songMap = new Map<string, SavedSong>();
      
      // First, add JSON songs
      jsonSongs.forEach(song => {
        songMap.set(song.id, song);
      });
      
      // Then, add/override with AsyncStorage songs
      storageSongs.forEach(song => {
        songMap.set(song.id, song);
      });
      
      // Convert map to array and sort by dateAnalyzed (newest first)
      const allSongs = Array.from(songMap.values());
      allSongs.sort((a, b) => {
        const dateA = new Date(a.dateAnalyzed).getTime();
        const dateB = new Date(b.dateAnalyzed).getTime();
        return dateB - dateA;
      });
      
      return allSongs;
    } catch (error) {
      console.error('Error getting songs:', error);
      // Fallback to just JSON songs if AsyncStorage fails
      return loadSongsFromJSON();
    }
  }

  // Get a specific song by ID
  async getSongById(id: string): Promise<SavedSong | null> {
    try {
      const songs = await this.getAllSongs();
      const song = songs.find(song => song.id === id);
      
      if (song) {
        // Ensure chords are normalized
        song.chords = song.chords.map(chord => ({
          ...chord,
          time: typeof chord.time === 'string' ? parseFloat(chord.time) : chord.time,
          duration: typeof chord.duration === 'string' ? parseFloat(chord.duration) : chord.duration,
        }));
      }
      
      return song || null;
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }

  // Delete a song
  async deleteSong(id: string): Promise<void> {
    try {
      const songs = await this.getAllSongs();
      const filtered = songs.filter(song => song.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  // Update a song
  async updateSong(id: string, updates: Partial<SavedSong>): Promise<void> {
    try {
      const songs = await this.getAllSongs();
      const index = songs.findIndex(song => song.id === id);
      
      if (index !== -1) {
        songs[index] = { ...songs[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
      }
    } catch (error) {
      console.error('Error updating song:', error);
      throw error;
    }
  }

  // Export songs to clipboard
  async exportSongs(): Promise<void> {
    try {
      const songs = await this.getAllSongs();
      
      if (songs.length === 0) {
        throw new Error('No songs to export');
      }
      
      const jsonData = JSON.stringify(songs, null, 2);
      await Clipboard.setStringAsync(jsonData);
      
      console.log('Exported', songs.length, 'songs to clipboard');
    } catch (error) {
      console.error('Error exporting songs:', error);
      throw error;
    }
  }

  // Import songs from clipboard
async importSongs(): Promise<number> {
    try {
      let clipboardContent = await Clipboard.getStringAsync();
      
      console.log('=== IMPORT DEBUG START ===');
      console.log('Clipboard empty?', !clipboardContent);
      console.log('Clipboard length:', clipboardContent?.length);
      
      if (!clipboardContent) {
        throw new Error('Clipboard is empty. Please copy the export data first.');
      }
      
      // Trim whitespace
      clipboardContent = clipboardContent.trim();
      
      console.log('After trim length:', clipboardContent.length);
      console.log('First 50 chars:', clipboardContent.substring(0, 50));
      console.log('Last 50 chars:', clipboardContent.substring(clipboardContent.length - 50));
      console.log('Starts with [:', clipboardContent.startsWith('['));
      console.log('Ends with ]:', clipboardContent.endsWith(']'));
      
      // Try to find JSON array in the content (in case there's extra text)
      const jsonMatch = clipboardContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        console.log('Found JSON pattern, extracting...');
        clipboardContent = jsonMatch[0];
      }
      
      let importedSongs: SavedSong[];
      try {
        importedSongs = JSON.parse(clipboardContent);
        console.log('Parse successful! Songs count:', importedSongs.length);
      } catch (parseError: any) {
        console.error('JSON parse error details:', {
          message: parseError.message,
          position: parseError.message.match(/position (\d+)/)?.[1],
        });
        
        // Show a snippet around the error if possible
        const posMatch = parseError.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          console.error('Content around error:', clipboardContent.substring(Math.max(0, pos - 50), pos + 50));
        }
        
        throw new Error(`Invalid JSON format. Error: ${parseError.message}`);
      }
      
      if (!Array.isArray(importedSongs)) {
        console.error('Not an array, got:', typeof importedSongs);
        throw new Error('Data is not an array of songs');
      }
      
      if (importedSongs.length === 0) {
        throw new Error('No songs found in the data');
      }
      
      // Validate the structure of first song
      const firstSong = importedSongs[0];
      console.log('First song structure:', {
        hasId: !!firstSong.id,
        hasName: !!firstSong.name,
        hasChords: Array.isArray(firstSong.chords),
        chordsCount: firstSong.chords?.length
      });
      
      if (!firstSong.id || !firstSong.name || !Array.isArray(firstSong.chords)) {
        throw new Error('Invalid song data structure');
      }
      
      const existingSongs = await this.getAllSongs();
      const existingIds = new Set(existingSongs.map(s => s.id));
      
      // Only import songs that don't already exist
      const newSongs = importedSongs.filter(s => !existingIds.has(s.id));
      
      if (newSongs.length > 0) {
        const allSongs = [...existingSongs, ...newSongs];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allSongs));
      }
      
      console.log('=== IMPORT DEBUG END ===');
      console.log('Imported', newSongs.length, 'new songs');
      return newSongs.length;
    } catch (error) {
      console.error('Error importing songs:', error);
      throw error;
    }
  }
}

export const songStorage = new SongStorageService();