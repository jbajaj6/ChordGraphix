import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import songsData from '../backend/songs.json';

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

// Check if we're on web platform
const isWeb = Platform.OS === 'web';
// API URL for the backend
const API_URL = 'http://localhost:5001';

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

class SongStorageService {
  // Helper to get bundled songs as fallback
  private getBundledSongs(): SavedSong[] {
    try {
      if (songsData && Array.isArray(songsData) && songsData.length > 0) {
        return songsData.map(normalizeSong);
      }
    } catch (e) {
      console.error('Error loading from bundled songs.json:', e);
    }
    return [];
  }

  // Save a new analyzed song
  async saveSong(songData: Omit<SavedSong, 'id' | 'dateAnalyzed'>): Promise<SavedSong> {
    try {
      const newSong: SavedSong = {
        ...songData,
        id: Date.now().toString(),
        dateAnalyzed: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong),
      });

      if (!response.ok) {
        throw new Error('Failed to save song to backend');
      }

      console.log('Song saved successfully with ID:', newSong.id);

      return newSong;
    } catch (error) {
      console.error('Error saving song:', error);
      throw error;
    }
  }

  // Export all songs to a downloadable JSON file (web only)
  async exportToDownloadableFile(): Promise<void> {
    if (!isWeb || typeof document === 'undefined') {
      throw new Error('Export to downloadable file is only available on web platform');
    }

    try {
      const allSongs = await this.getAllSongs();
      const jsonData = JSON.stringify(allSongs, null, 2);

      // Create a downloadable file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `songs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Exported', allSongs.length, 'songs to downloadable JSON file');
    } catch (error) {
      console.error('Error exporting to downloadable file:', error);
      throw error;
    }
  }

  // Export songs back to source file (requires backend)
    async exportToSourceFile(): Promise<void> {
        try {
        const allSongs = await this.getAllSongs();
        
        if (allSongs.length === 0) {
            throw new Error('No songs to export');
        }
    
        const response = await fetch(`${API_URL}/songs/export`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(allSongs),
        });
    
        if (!response.ok) {
            throw new Error('Failed to export songs to source file');
        }
    
        console.log('Exported', allSongs.length, 'songs to songs.json');
        } catch (error) {
        console.error('Error exporting to source file:', error);
        throw error;
        }
    }

  // Get all saved songs
  async getAllSongs(): Promise<SavedSong[]> {
    try {
      const response = await fetch(`${API_URL}/songs`);
      if (!response.ok) {
        console.warn('Failed to fetch songs from API, falling back to bundled.');
        return this.getBundledSongs();
      }
      const songs = await response.json();
      return songs.map(normalizeSong);
    } catch (error) {
      //console.error('Error getting songs:', error);
      // Fallback to bundled songs if API is unreachable
      return this.getBundledSongs();
    }
  }

  // Get a specific song by ID
  async getSongById(id: string): Promise<SavedSong | null> {
    try {
      const songs = await this.getAllSongs();
      const song = songs.find(song => song.id === id);
      return song || null;
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }

  // Delete a song
  async deleteSong(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/songs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete song');
      }

      console.log('Song deleted from backend');
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  // Update a song
  async updateSong(id: string, updates: Partial<SavedSong>): Promise<void> {
    try {
      const song = await this.getSongById(id);

      if (song) {
        const updatedSong = { ...song, ...updates };

        const response = await fetch(`${API_URL}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedSong),
        });

        if (!response.ok) {
          throw new Error('Failed to update song');
        }

        console.log('Song updated in backend');
      } else {
        console.warn('Song not found for update:', id);
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

      if (!clipboardContent) {
        throw new Error('Clipboard is empty. Please copy the export data first.');
      }

      // Trim whitespace
      clipboardContent = clipboardContent.trim();

      // Try to find JSON array in the content (in case there's extra text)
      const jsonMatch = clipboardContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        clipboardContent = jsonMatch[0];
      }

      let importedSongs: SavedSong[];
      try {
        importedSongs = JSON.parse(clipboardContent);
      } catch (parseError: any) {
        throw new Error(`Invalid JSON format. Error: ${parseError.message}`);
      }

      if (!Array.isArray(importedSongs)) {
        throw new Error('Data is not an array of songs');
      }

      if (importedSongs.length === 0) {
        throw new Error('No songs found in the data');
      }

      // Validate the structure of first song
      const firstSong = importedSongs[0];
      if (!firstSong.id || !firstSong.name || !Array.isArray(firstSong.chords)) {
        throw new Error('Invalid song data structure');
      }

      const existingSongs = await this.getAllSongs();
      const existingIds = new Set(existingSongs.map(s => s.id));

      // Only import songs that don't already exist
      const newSongs = importedSongs.filter(s => !existingIds.has(s.id));

      // Save each new song
      for (const song of newSongs) {
        // We can't use saveSong because it generates a new ID and date.
        // We want to preserve the imported song's ID and date if possible, or at least its data.
        // But the backend expects POST /songs to save whatever we send.
        // Let's use the backend directly.
        await fetch(`${API_URL}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(song)
        });
      }

      console.log('Imported', newSongs.length, 'new songs');
      return newSongs.length;
    } catch (error) {
      console.error('Error importing songs:', error);
      throw error;
    }
  }
}

export const songStorage = new SongStorageService();