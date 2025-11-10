import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Link } from 'expo-router';

import { theme } from './theme';

const PaletteSwatch = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.swatchItem}>
    <View style={[styles.swatch, { backgroundColor: color }]} />
    <Text style={styles.swatchLabel}>{label}</Text>
  </View>
);

export default function Index() {
  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isCompact && styles.scrollContentCompact]}>
        <View
          style={[
            styles.hero,
            isCompact && {
              flexDirection: 'column',
              paddingVertical: theme.spacing(5),
              paddingHorizontal: theme.spacing(3),
              gap: theme.spacing(3),
            },
          ]}
        >
          <View style={[styles.heroContent, isCompact && { gap: theme.spacing(2) }]}
          >
            <Text style={styles.heroBadge}>ChordGraphix</Text>
            <Text style={styles.heroTitle}>Play, detect, and explore chords with ease.</Text>
            <Text style={styles.heroSubtitle}>
              A focused toolkit for songwriters: visualize two vibrant piano octaves, confirm your
              voicings instantly, and keep your creative flow in motion.
            </Text>

            <View style={[styles.heroActions, isCompact && { flexDirection: 'column', alignItems: 'stretch' }]}
            >
              <Link href="/piano" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Open Piano Studio</Text>
                </Pressable>
              </Link>

              <Link href="/songAnalyzer" asChild>
                <Pressable style={[styles.secondaryButton, isCompact && { alignItems: 'center' }]}
                >
                  <Text style={styles.secondaryButtonText}>Analyze a Song</Text>
                </Pressable>
              </Link>
            </View>

            <View
              style={[
                styles.metricRow,
                isCompact && { flexDirection: 'column', gap: theme.spacing(1.5) },
              ]}
            >
              <View style={[styles.metricCard, isCompact && { width: '100%' }]}>
                <Text style={styles.metricValue}>2</Text>
                <Text style={styles.metricLabel}>Octaves dynamically sized</Text>
              </View>
              <View style={[styles.metricCard, isCompact && { width: '100%' }]}>
                <Text style={styles.metricValue}>∞</Text>
                <Text style={styles.metricLabel}>Chords detected with tonal.js</Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.heroPreview,
              isCompact && { alignSelf: 'stretch', justifyContent: 'center' },
            ]}
          >
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Session Snapshot</Text>
              <Text style={styles.previewBody}>Pressed: C, E, G</Text>
              <Text style={styles.previewAccent}>Detected: C Major</Text>
              <View style={styles.previewBadges}>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>Multitouch friendly</Text>
                </View>
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>Live audio feedback</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.styleGuideCard}>
          <Text style={styles.styleGuideTitle}>Style Guide</Text>
          <Text style={styles.styleGuideSubtitle}>
            Updated design system for ChordGraphix — consistent across piano and analyzer screens.
          </Text>

          <View style={styles.styleGuideSection}>
            <Text style={styles.sectionTitle}>Typography</Text>
            <Text style={styles.sectionBody}>
              • Display headers use Inter/SF rounded at 34/700 with subtle tracking.
              {'\n'}• Headlines use 24/700, body copy 16/500, captions 13/500.
              {'\n'}• Text contrasts with deep-navy surfaces for comfortable reading.
            </Text>
          </View>

          <View style={styles.styleGuideSection}>
            <Text style={styles.sectionTitle}>Color Palette</Text>
            <Text style={styles.sectionBody}>
              • Midnight Navy surfaces with indigo primary and cyan highlights.
              {'\n'}• Muted slate borders and soft glows emphasize active states.
            </Text>
            <View style={[styles.swatchRow, isCompact && { justifyContent: 'space-between' }]}>
              <PaletteSwatch color={theme.colors.background} label="Background" />
              <PaletteSwatch color={theme.colors.surface} label="Surface" />
              <PaletteSwatch color={theme.colors.primary} label="Primary" />
              <PaletteSwatch color={theme.colors.accent} label="Accent" />
            </View>
          </View>

          <View style={styles.styleGuideSection}>
            <Text style={styles.sectionTitle}>Components & Shape</Text>
            <Text style={styles.sectionBody}>
              • Cards: 16–24px radius, layered shadows, gradient fills for hero preview.
              {'\n'}• Buttons: pill-shaped with glowing focus ring and consistent padding.
              {'\n'}• Piano keys: adaptive width, soft highlights, 3D-inspired depth cues.
            </Text>
          </View>

          <View style={styles.styleGuideSection}>
            <Text style={styles.sectionTitle}>Motion & Feedback</Text>
            <Text style={styles.sectionBody}>
              • Button presses lighten the surface; key presses animate the fill color.
              {'\n'}• Inline feedback replaces pop-up alerts for a smoother workflow.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing(10),
  },
  scrollContentCompact: {
    paddingBottom: theme.spacing(6),
    paddingHorizontal: theme.spacing(2.5),
  },
  hero: {
    borderBottomLeftRadius: theme.radii.xl,
    borderBottomRightRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing(8),
    paddingHorizontal: theme.spacing(5),
    flexDirection: 'row',
    gap: theme.spacing(4),
    ...theme.shadows.card,
  },
  heroContent: {
    flex: 1,
    gap: theme.spacing(3),
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroTitle: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  heroActions: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    borderRadius: 999,
    ...theme.shadows.soft,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.md,
    padding: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metricLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  heroPreview: {
    flex: 0.9,
    justifyContent: 'flex-end',
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    ...theme.shadows.card,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing(1),
  },
  previewBody: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  previewAccent: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: theme.spacing(1.5),
  },
  previewBadges: {
    flexDirection: 'row',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  previewBadge: {
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
    borderRadius: 999,
  },
  previewBadgeText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  styleGuideCard: {
    marginTop: theme.spacing(5),
    marginHorizontal: theme.spacing(3),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing(3),
  },
  styleGuideTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  styleGuideSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  styleGuideSection: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radii.md,
    padding: theme.spacing(2.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing(1.5),
  },
  sectionTitle: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary,
  },
  sectionBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  swatchItem: {
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  swatchLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
  },
});