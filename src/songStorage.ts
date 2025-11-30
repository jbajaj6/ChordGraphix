import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

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
  duration: number;
  analyzedDuration: number;
  key: string | null;
  scale: string | null;
  bpm: number | null;
  chords: SavedChord[];
}

const STORAGE_KEY = '@analyzed_songs';

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

  // Get all saved songs
  async getAllSongs(): Promise<SavedSong[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const songs = JSON.parse(data);
      
      return songs.map((song: SavedSong) => ({
        ...song,
        chords: song.chords.map(chord => ({
          ...chord,
          time: typeof chord.time === 'string' ? parseFloat(chord.time) : chord.time,
          duration: typeof chord.duration === 'string' ? parseFloat(chord.duration) : chord.duration,
        }))
      }));
    } catch (error) {
      console.error('Error getting songs:', error);
      return [];
    }
  }

  // Get a specific song by ID
  async getSongById(id: string): Promise<SavedSong | null> {
    try {
      const songs = await this.getAllSongs();
      const song = songs.find(song => song.id === id);
      
      if (song) {
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