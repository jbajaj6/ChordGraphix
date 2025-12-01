import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { songStorage, SavedSong } from '../src/songStorage';
import { Link } from 'expo-router';
import { theme } from '../src/theme';
import * as Clipboard from 'expo-clipboard';


export default function SongLibrary() {
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    const savedSongs = await songStorage.getAllSongs();
    setSongs(savedSongs);
    setLoading(false);
  };

  const handleSelectSong = (song: SavedSong) => {
    router.push({
      pathname: '/songPractice',
      params: { songId: song.id }
    });
  };

  const handleDeleteSong = (id: string, name: string) => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await songStorage.deleteSong(id);
            loadSongs();
          }
        }
      ]
    );
  };

  const handleExport = async () => {
    try {
      if (songs.length === 0) {
        Alert.alert('No Songs', 'You need to save some songs before exporting');
        return;
      }
      
      await songStorage.exportSongs();
      Alert.alert(
        '📋 Copied to Clipboard!', 
        `${songs.length} song(s) copied!\n\nTo transfer to another device:\n1. Paste into Notes/Messages app\n2. Send to your other device\n3. Copy the text\n4. Tap Import on the other device`
      );
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Failed to export songs');
    }
  };
  
  const handleImport = async () => {
    try {
      const count = await songStorage.importSongs();
      if (count > 0) {
        Alert.alert('✅ Import Successful', `Imported ${count} new song(s)!`);
        loadSongs();
      } else {
        Alert.alert('No New Songs', 'All songs from clipboard already exist in your library');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import songs';
      Alert.alert(
        'Import Failed', 
        `${message}\n\nMake sure you:\n1. Copied valid song data\n2. The data is in JSON format`
      );
    }
  };

  const handleExportDownload = async () => {
    try {
      if (songs.length === 0) {
        Alert.alert('No Songs', 'You need to save some songs before exporting');
        return;
      }
      
      const allSongs = await songStorage.getAllSongs();
      const jsonData = JSON.stringify(allSongs, null, 2);
      
      if (Platform.OS === 'web') {
        // Create a download link on web
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chord_songs_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Downloaded!', 'Check your Downloads folder for the JSON file. Send this file to your iPad.');
      } else {
        // On mobile, copy to clipboard
        await Clipboard.setStringAsync(jsonData);
        Alert.alert('Copied!', 'Song data copied to clipboard');
      }
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Failed to export');
    }
  };

  const renderSongItem = ({ item }: { item: SavedSong }) => (
    <View style={styles.songItem}>
      <Pressable 
        style={styles.songContent} 
        onPress={() => handleSelectSong(item)}
      >
        <Text style={styles.songName}>{item.name}</Text>
        {item.artist && <Text style={styles.artistName}>{item.artist}</Text>}
        <View style={styles.songDetails}>
          <Text style={styles.detailText}>
            {item.key && `${item.key} ${item.scale} • `}
            {item.chords.length} chords
          </Text>
        </View>
      </Pressable>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeleteSong(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading songs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.nav}>
        <Pressable style={[styles.navItem, styles.navItemActive]}>
        <Text style={styles.navIcon}>♪</Text>
        <Text style={styles.navLabel}>Song Library</Text>
        </Pressable>

        <Link href="/chordPractice" asChild>
            <Pressable style={styles.navItem}>
            <View style={styles.pianoIcon}>
                <View style={styles.pianoKey} />
                <View style={styles.pianoKey} />
                <View style={styles.pianoKey} />
            </View>
            <Text style={styles.navLabel}>Chord Practice</Text>
            </Pressable>
        </Link>

        <Link href="/songAnalyzer" asChild>
            <Pressable style={styles.navItem}>
            <Text style={styles.navIcon}>↑</Text>
            <Text style={styles.navLabel}>Upload Song</Text>
            </Pressable>
        </Link>

        <Link href="/piano" asChild>
            <Pressable style={styles.navItem}>
            <Text style={styles.navIcon}>#</Text>
            <Text style={styles.navLabel}>Piano Studio</Text>
            </Pressable>
        </Link>

        <Link href="/myChords" asChild>
            <Pressable style={styles.navItem}>
                <View style={styles.chordGridIcon}>
                <View style={styles.chordDot} />
                <View style={styles.chordDot} />
                <View style={styles.chordDot} />
                </View>
                <Text style={styles.navLabel}>My Chords</Text>
            </Pressable>
        </Link>

        <Link href="/" asChild>
            <Pressable style={styles.navItem}>
                <View style={styles.profileIcon}>
                <View style={styles.profileIconInner} />
                </View>
                <Text style={styles.navLabel}>Profile</Text>
            </Pressable>
        </Link>
        </View>
      <Text style={styles.title}>Your Song Library</Text>
      {songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No songs saved yet</Text>
          <Text style={styles.emptySubtext}>Analyze a song to get started</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

        <View style={styles.actionButtons}>
        {Platform.OS === 'web' ? (
            <Pressable style={[styles.actionButton, { flex: 2 }]} onPress={handleExportDownload}>
            <Text style={styles.actionButtonText}>💾 Download JSON File</Text>
            </Pressable>
        ) : (
            <Pressable style={styles.actionButton} onPress={handleExport}>
            <Text style={styles.actionButtonText}>📤 Export</Text>
            </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={handleImport}>
            <Text style={styles.actionButtonText}>📥 Import Songs</Text>
        </Pressable>
        </View>
    </View>
  );
}


const styles = StyleSheet.create({

// Navigation
    nav: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: theme.spacing(2),
        paddingHorizontal: theme.spacing(3),
        justifyContent: 'space-around',
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing(2),
        paddingVertical: theme.spacing(1),
        borderRadius: theme.radii.md,
    },
    navItemActive: {
        backgroundColor: theme.colors.surfaceAlt,
    },
    navIcon: {
        fontSize: 28,
        color: theme.colors.textPrimary,
        marginBottom: 4,  // Match the profileIcon marginBottom
        height: 28,  // Add explicit height
        lineHeight: 28,  // Match the height
        textAlignVertical: 'center'
    },
    navLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    pianoIcon: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,  // Changed from 2
        height: 28,       // Added
        alignItems: 'center'
    },
    pianoKey: {
        width: 6,
        height: 20,
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 2,
    },
    chordGridIcon: {
        width: 24,
        height: 28,
        borderWidth: 1,
        borderColor: theme.colors.textPrimary,
        borderRadius: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 2,
        gap: 2,
        marginBottom: 4,
    },
    chordDot: {
        width: 6,
        height: 6,
        backgroundColor: theme.colors.textPrimary,
        borderRadius: 3,
    },
    profileIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    profileIconInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.textPrimary,
    },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background ,
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  listContainer: {
    paddingBottom: 20,
  },
  songItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  songContent: {
    flex: 1,
  },
  songName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
  },
  songDetails: {
    flexDirection: 'row',
  },
  detailText: {
    fontSize: 12,
    color: '#007AFF',
  },
  deleteButton: {
    padding: 10,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  actionButtons: {
    padding: 10,
    justifyContent: 'center',
    flexDirection: 'row'
  },
  actionButton: {
    padding: 10, 
    color: theme.colors.accent
  }, 
  actionButtonText: {
    fontSize: 20,
    color: theme.colors.textMuted
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#aaa',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});