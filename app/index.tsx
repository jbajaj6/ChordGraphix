import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.page}>
      {/* Left: original Hello World content */}
      <View style={styles.container}>
        <Text style={styles.text}>Hello World!</Text>
        <Text style={styles.subtitle}>My First React Native App</Text>

        <Link href="/piano" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Go to Piano</Text>
          </Pressable>
        </Link>
      </View>

      {/* Right: Style Guide */}
      <View style={styles.styleGuide}>
        <Text style={styles.guideHeader}>Style Guide</Text>

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Typography</Text>
          <Text style={styles.guideText}>
            • Headers: Rounded cursive / script font (friendly + welcoming){"\n"}
            • Body: Clean sans-serif, medium weight{"\n"}
            • Example: Large “Welcome back” uses ~36pt, bold
          </Text>
        </View>

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Color Palette</Text>
          <Text style={styles.guideText}>
            • Primary: #007AFF (vibrant blue accent){"\n"}
            • Secondary: #F2F2F2 (light neutral background){"\n"}
            • Text dark: #222 / #333{"\n"}
            • Accent gray lines: #DDD{"\n"}
            • Buttons: Blue with white text, rounded corners
          </Text>
        </View>

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Shapes & Layout</Text>
          <Text style={styles.guideText}>
            • Cards: Soft rounded corners (10–12px), thin outlines{"\n"}
            • Buttons: Rounded with subtle shadows{"\n"}
            • Containers: Lightly padded, centered content
          </Text>
        </View>

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Iconography</Text>
          <Text style={styles.guideText}>
            • Simple line icons (musical note, piano, upload, chord, profile){"\n"}
            • Minimal shading — black or dark gray lines only
          </Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
// Style Guide section
  styleGuide: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    padding: 20,
    borderLeftColor: '#DDD',
    borderLeftWidth: 1,
    justifyContent: 'flex-start',
    overflow: 'scroll',
  },
  guideHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
  },
  guideSection: {
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderColor: '#EEE',
    borderWidth: 1,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 6,
  },
  guideText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
});