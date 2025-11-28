import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { theme } from '../src/theme';

const sx = (...parts: any[]) => StyleSheet.flatten(parts.filter(Boolean));

export default function Index() {
  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  // Sample data - replace with actual data from your app state
  const userName = "Eloise";
  const mySongs = [
    { title: "Sign of the Times", artist: "Harry Styles" },
    { title: "First Step (Interstellar)", artist: "Hans Zimmer" },
    { title: "Best", artist: "Gracie Abrams" },
    { title: "Romantic Flight (How to Train Your Dragon)", artist: "John Powell" },
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "The Greatest", artist: "Lana Del Rey" },
    { title: "The Light of the Seven (Game of Thrones)", artist: "Ramin Djawadi" },
    { title: "The Imitation Game", artist: "Alexandre Desplat" },
    { title: "Halley's Comet", artist: "Billie Eilish" },
    { title: "Hotel California", artist: "Eagles" },
  ];

  // Practice history - sample calendar data (true = practiced that day)
  const practiceCalendar = [
    [false, true, true, false, false, true, false], // Week 1
    [false, false, false, true, true, false, false], // Week 2
    [true, true, false, true, false, false, true],   // Week 3
    [false, false, true, true, false, false, true],  // Week 4
  ];

  const chordStats = {
    bestChordPracticeScore: 24,
    bestSongPracticeScore: 15,
    favoriteKey: "C Minor"
  };

  const containerStyle = sx(styles.container, isCompact && styles.containerCompact);
  const cardsRowStyle = sx(styles.cardsRow, isCompact && styles.cardsRowCompact);

  return (
    <View style={styles.screen}>
      {/* Navigation Bar */}
      <View style={styles.nav}>
        {/*
        <Link href="/songPractice" asChild>
          <Pressable style={styles.navItem}>
            <Text style={styles.navIcon}>♪</Text>
            <Text style={styles.navLabel}>Song Practice</Text>
          </Pressable>
        </Link>
        */}

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

        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.profileIcon}>
            <View style={styles.profileIconInner} />
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={containerStyle}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back, {userName}!</Text>
          <Pressable style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* Cards Row */}
        <View style={cardsRowStyle}>
          {/* My Songs Card */}
          <View style={sx(styles.card, styles.songsCard, isCompact && styles.cardCompact)}>
            <Text style={styles.cardTitle}>My Songs:</Text>
            <ScrollView style={styles.songsList} showsVerticalScrollIndicator={false}>
              {mySongs.map((song, index) => (
                <View key={index} style={styles.songItem}>
                  <Text style={styles.heartIcon}>♡</Text>
                  <View style={styles.songTextContainer}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songArtist}> - {song.artist}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Right Column */}
          <View style={sx(styles.rightColumn, isCompact && styles.rightColumnCompact)}>
            {/* Practice History Card */}
            <View style={sx(styles.card, styles.practiceCard)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Practice History:</Text>
                <View style={styles.timeFilter}>
                  <Text style={styles.timeFilterText}>Last: </Text>
                  <View style={styles.timeFilterPill}>
                    <Text style={styles.timeFilterPillText}>Month</Text>
                  </View>
                  <Text style={styles.timeFilterIcon}>☰</Text>
                </View>
              </View>
              
              <View style={styles.calendar}>
                <View style={styles.calendarHeader}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <Text key={i} style={styles.calendarDay}>{day}</Text>
                  ))}
                </View>
                {practiceCalendar.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarWeek}>
                    {week.map((practiced, dayIndex) => (
                      <View key={dayIndex} style={styles.calendarCell}>
                        {practiced && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Chord Stats Card */}
            <View style={sx(styles.card, styles.statsCard)}>
              <Text style={styles.cardTitle}>Chord Stats:</Text>
              <Text style={styles.statText}>Best Chord Practice Score: {chordStats.bestChordPracticeScore}</Text>
              <Text style={styles.statText}>Best Song Practice Score: {chordStats.bestSongPracticeScore}</Text>
              <Text style={styles.statText}>Favorite Key: {chordStats.favoriteKey}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  
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
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  pianoIcon: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  pianoKey: {
    width: 6,
    height: 20,
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 2,
  },
  chordGridIcon: {
    width: 24,
    height: 24,
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

  // Container
  container: {
    paddingTop: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    paddingBottom: theme.spacing(6),
  },
  containerCompact: {
    paddingHorizontal: theme.spacing(2),
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontStyle: 'italic',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
  },

  // Cards Layout
  cardsRow: {
    flexDirection: 'row',
    gap: theme.spacing(3),
  },
  cardsRowCompact: {
    flexDirection: 'column',
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardCompact: {
    marginBottom: theme.spacing(3),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing(2),
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },

  // Songs Card
  songsCard: {
    flex: 1,
    maxHeight: 600,
  },
  songsList: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
  },
  heartIcon: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing(1.5),
    marginTop: 2,
  },
  songTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  songTitle: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  songArtist: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },

  // Right Column
  rightColumn: {
    flex: 1,
    gap: theme.spacing(3),
  },
  rightColumnCompact: {
    width: '100%',
  },

  // Practice History Card
  practiceCard: {
    flex: 1,
  },
  timeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  timeFilterText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  timeFilterPill: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeFilterPillText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  timeFilterIcon: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  calendar: {
    marginTop: theme.spacing(1),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing(1.5),
    paddingBottom: theme.spacing(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  calendarDay: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing(1),
  },
  calendarCell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.accent,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    backgroundColor: theme.colors.surface,
  },
  statText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing(1.5),
    fontStyle: 'italic',
  },
});