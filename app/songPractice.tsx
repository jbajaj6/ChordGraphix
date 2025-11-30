import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import SongPractice from '../src/songPractice';
import { songStorage, SavedSong } from '../src/songStorage';
import { theme } from '../src/theme';

export default function SongPracticeScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const [song, setSong] = useState<SavedSong | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSong();
  }, [songId]);

  const loadSong = async () => {
    if (songId) {
      const loadedSong = await songStorage.getSongById(songId);
      setSong(loadedSong);
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Song not found</Text>
      </View>
    );
  }

  return <SongPractice song={song} onBack={handleBack} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background ,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
});

