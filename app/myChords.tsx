import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, PanResponder } from 'react-native';
import { theme } from '../src/theme';
import { useChordColors, ChordName } from '../src/ChordColorsContext';

// Define chord data - note positions for each chord
const CHORD_DATA: Array<{ name: ChordName; root: string; type: string; notes: number[] }> = [
  // A chords
  { name: 'A Major', root: 'A', type: 'Major', notes: [9, 13, 16] }, // A, C#, E
  { name: 'A Minor', root: 'A', type: 'Minor', notes: [9, 12, 16] }, // A, C, E
  // A# / Bb chords
  { name: 'A# Major', root: 'A#', type: 'Major', notes: [10, 14, 17] },
  { name: 'A# Minor', root: 'A#', type: 'Minor', notes: [10, 13, 17] },
  // B chords
  { name: 'B Major', root: 'B', type: 'Major', notes: [11, 15, 18] },
  { name: 'B Minor', root: 'B', type: 'Minor', notes: [11, 14, 18] },
  // C chords
  { name: 'C Major', root: 'C', type: 'Major', notes: [0, 4, 7] },
  { name: 'C Minor', root: 'C', type: 'Minor', notes: [0, 3, 7] },
  // C# / Db chords
  { name: 'C# Major', root: 'C#', type: 'Major', notes: [1, 5, 8] },
  { name: 'C# Minor', root: 'C#', type: 'Minor', notes: [1, 4, 8] },
  // D chords
  { name: 'D Major', root: 'D', type: 'Major', notes: [2, 6, 9] },
  { name: 'D Minor', root: 'D', type: 'Minor', notes: [2, 5, 9] },
  // D# / Eb chords
  { name: 'D# Major', root: 'D#', type: 'Major', notes: [3, 7, 10] },
  { name: 'D# Minor', root: 'D#', type: 'Minor', notes: [3, 6, 10] },
  // E chords
  { name: 'E Major', root: 'E', type: 'Major', notes: [4, 8, 11] },
  { name: 'E Minor', root: 'E', type: 'Minor', notes: [4, 7, 11] },
  // F chords
  { name: 'F Major', root: 'F', type: 'Major', notes: [5, 9, 12] },
  { name: 'F Minor', root: 'F', type: 'Minor', notes: [5, 8, 12] },
  // F# / Gb chords
  { name: 'F# Major', root: 'F#', type: 'Major', notes: [6, 10, 13] },
  { name: 'F# Minor', root: 'F#', type: 'Minor', notes: [6, 9, 13] },
  // G chords
  { name: 'G Major', root: 'G', type: 'Major', notes: [7, 11, 14] },
  { name: 'G Minor', root: 'G', type: 'Minor', notes: [7, 10, 14] },
  // G# / Ab chords
  { name: 'G# Major', root: 'G#', type: 'Major', notes: [8, 12, 15] },
  { name: 'G# Minor', root: 'G#', type: 'Minor', notes: [8, 11, 15] },
];

// Color palette options
const COLOR_OPTIONS = [
  { name: 'Red', color: '#FF6B6B' },
  { name: 'Pink', color: '#FF69B4' },
  { name: 'Purple', color: '#9B59B6' },
  { name: 'Blue', color: '#4A90E2' },
  { name: 'Cyan', color: '#3498DB' },
  { name: 'Teal', color: '#1ABC9C' },
  { name: 'Green', color: '#2ECC71' },
  { name: 'Yellow', color: '#F1C40F' },
  { name: 'Orange', color: '#E67E22' },
  { name: 'Brown', color: '#8B6F47' },
  { name: 'Gold', color: '#D4AF37' },
  { name: 'Olive', color: '#808000' },
];

// Quick color presets
const COLOR_PRESETS = [
    '#FF6B6B', '#FF69B4', '#9B59B6', '#4A90E2',
    '#3498DB', '#1ABC9C', '#2ECC71', '#F1C40F',
    '#E67E22', '#8B6F47', '#D4AF37', '#808000',
];
  
  // Helper functions for color conversion
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
};
  
const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};
  
const hslToHex = (h: number, s: number, l: number): string => {
    const [r, g, b] = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
};
  
const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
  
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
  
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
  
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};
  
  // Hue gradient component (simulated with color blocks)
const HueGradient = () => {
    const hueColors = [
      '#ff0000', '#ff8000', '#ffff00', '#80ff00',
      '#00ff00', '#00ff80', '#00ffff', '#0080ff',
      '#0000ff', '#8000ff', '#ff00ff', '#ff0080', '#ff0000',
    ];
  
    return (
      <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
        {hueColors.map((color, index) => (
          <View key={index} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </View>
    );
};
  
  // Saturation/Lightness gradient component
const SLGradient = ({ hue }: { hue: number }) => {
    const baseColor = hslToHex(hue, 100, 50);
    
    return (
      <View style={{ width: '100%', height: '100%', position: 'relative' }}>
        <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: baseColor }} />
        
        {/* White overlay for saturation */}
        <View style={{ position: 'absolute', width: '100%', height: '100%', flexDirection: 'row' }}>
          {[...Array(10)].map((_, i) => (
            <View key={`sat-${i}`} style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: 1 - (i / 9) }} />
          ))}
        </View>
        
        {/* Black overlay for lightness */}
        <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
          {[...Array(10)].map((_, i) => (
            <View key={`light-${i}`} style={{ flex: 1, backgroundColor: '#000000', opacity: i / 9 }} />
          ))}
        </View>
      </View>
    );
};

// Piano keyboard component
const PianoKeyboard = ({ highlightedNotes, color }: { highlightedNotes: number[], color: string }) => {
  const keys = [
    { note: 0, isBlack: false, name: 'C1' },
    { note: 1, isBlack: true, name: 'C1#' },
    { note: 2, isBlack: false, name: 'D1' },
    { note: 3, isBlack: true, name: 'D1#' },
    { note: 4, isBlack: false, name: 'E1' },
    { note: 5, isBlack: false, name: 'F1' },
    { note: 6, isBlack: true, name: 'F1#' },
    { note: 7, isBlack: false, name: 'G1' },
    { note: 8, isBlack: true, name: 'G1#' },
    { note: 9, isBlack: false, name: 'A1' },
    { note: 10, isBlack: true, name: 'A1#' },
    { note: 11, isBlack: false, name: 'B1' },
    { note: 12, isBlack: false, name: 'C2' },
    { note: 13, isBlack: true, name: 'C2#'},
    { note: 14, isBlack: false, name: 'D2' },
    { note: 15, isBlack: true, name: 'D2#' },
    { note: 16, isBlack: false, name: 'E2' },
    { note: 17, isBlack: false, name: 'F2' },
    { note: 18, isBlack: true, name: 'F2#' },
    { note: 19, isBlack: false, name: 'G2' }
  ];

  return (
    <View style={styles.pianoContainer}>
      <View style={styles.pianoKeys}>
        {/* White keys */}
        {keys.filter(k => !k.isBlack).map((key) => (
          <View
            key={`white-${key.note}`}
            style={[
              styles.whiteKey,
              highlightedNotes.includes(key.note) && { backgroundColor: color }
            ]}
          />
        ))}
      </View>
      {/* Black keys overlay */}
      <View style={styles.blackKeysContainer}>
        {keys.map((key, index) => {
          if (!key.isBlack) return <View key={`spacer-${index}`} style={styles.blackKeySpacer} />;
          return (
            <View
              key={`black-${key.note}`}
              style={[
                styles.blackKey,
                highlightedNotes.includes(key.note) && { backgroundColor: color }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

// Chord card component
const ChordCard = ({ 
  chord, 
  color, 
  onColorSelect 
}: { 
  chord: typeof CHORD_DATA[0], 
  color: string,
  onColorSelect: () => void 
}) => {
  return (
    <Pressable style={styles.chordCard} onPress={onColorSelect}>
      <Text style={styles.chordName}>{chord.name}</Text>
      <PianoKeyboard highlightedNotes={chord.notes} color={color} />
    </Pressable>
  );
};

// Advanced color picker modal with hue and saturation/lightness controls
const ColorPickerModal = ({ 
    visible, 
    onClose, 
    onSelectColor,
    currentColor 
  }: { 
    visible: boolean, 
    onClose: () => void,
    onSelectColor: (color: string) => void,
    currentColor: string
  }) => {
    const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(currentColor));
    const [hue, saturation, lightness] = hsl;
    const [tempColor, setTempColor] = useState(currentColor);

    const slSelectorRef = React.useRef<View>(null);
    const hueSliderRef = React.useRef<View>(null);

    React.useEffect(() => {
        if (visible) {
          const newHsl = hexToHsl(currentColor);
          setHsl(newHsl);
          setTempColor(currentColor);
        }
      }, [visible, currentColor]);
  
    // Update when modal opens with new color
    useState(() => {
      if (visible) {
        const newHsl = hexToHsl(currentColor);
        setHsl(newHsl);
        setTempColor(currentColor);
      }
    });
  
    const updateColor = (newHsl: [number, number, number]) => {
      setHsl(newHsl);
      const hex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
      setTempColor(hex);
    };
  
    // Hue slider pan responder with proper coordinate handling
    const hueSliderResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
        if (hueSliderRef.current) {
            hueSliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newHue = Math.max(0, Math.min(360, (touchX / width) * 360));
            updateColor([newHue, saturation, lightness]);
            });
        }
        },
        onPanResponderMove: (evt) => {
        if (hueSliderRef.current) {
            hueSliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = evt.nativeEvent.pageX - pageX;
            const newHue = Math.max(0, Math.min(360, (touchX / width) * 360));
            updateColor([newHue, saturation, lightness]);
            });
        }
        },
    });
  
    // Saturation/Lightness selector pan responder
    const slSelectorResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (slSelectorRef.current) {
            slSelectorRef.current.measure((x, y, width, height, pageX, pageY) => {
              const touchX = evt.nativeEvent.pageX - pageX;
              const touchY = evt.nativeEvent.pageY - pageY;
              const newSaturation = Math.max(0, Math.min(100, (touchX / width) * 100));
              const newLightness = Math.max(0, Math.min(100, 100 - (touchY / height) * 100));
              updateColor([hue, newSaturation, newLightness]);
            });
          }
        },
        onPanResponderMove: (evt) => {
          if (slSelectorRef.current) {
            slSelectorRef.current.measure((x, y, width, height, pageX, pageY) => {
              const touchX = evt.nativeEvent.pageX - pageX;
              const touchY = evt.nativeEvent.pageY - pageY;
              const newSaturation = Math.max(0, Math.min(100, (touchX / width) * 100));
              const newLightness = Math.max(0, Math.min(100, 100 - (touchY / height) * 100));
              updateColor([hue, newSaturation, newLightness]);
            });
          }
        },
    });

    // Handle saturation/lightness selector touch
    const handleSLTouch = (evt: any) => {
        slSelectorRef.current?.measure((x, y, width, height, pageX, pageY) => {
        console.log('SL Touch:', { pageX, pageY, width, height, touchX: evt.nativeEvent.pageX, touchY: evt.nativeEvent.pageY });
        const touchX = evt.nativeEvent.pageX - pageX;
        const touchY = evt.nativeEvent.pageY - pageY;
        const newSaturation = Math.max(0, Math.min(100, (touchX / width) * 100));
        const newLightness = Math.max(0, Math.min(100, 100 - (touchY / height) * 100));
        console.log('Calculated:', { touchX, touchY, newSaturation, newLightness });
        updateColor([hue, newSaturation, newLightness]);
        });
    };

    // Handle hue slider touch
    const handleHueTouch = (evt: any) => {
        hueSliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
        console.log('Hue Touch:', { pageX, pageY, width, touchX: evt.nativeEvent.pageX });
        const touchX = evt.nativeEvent.pageX - pageX;
        const newHue = Math.max(0, Math.min(360, (touchX / width) * 360));
        console.log('Calculated hue:', { touchX, newHue });
        updateColor([newHue, saturation, lightness]);
        });
    };
  
    const handleSave = () => {
      onSelectColor(tempColor);
      onClose();
    };

    return (
        <Modal
          visible={visible}
          transparent
          animationType="fade"
          onRequestClose={onClose}
        >
          <Pressable style={styles.modalOverlay} onPress={onClose}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select Chord Color</Text>
              
              {/* Preview */}
              <View style={styles.colorPreview}>
                <View style={[styles.colorPreviewBox, { backgroundColor: tempColor }]} />
                <Text style={styles.colorPreviewText}>{tempColor.toUpperCase()}</Text>
              </View>
    
              {/* Quick presets */}
              <Text style={styles.sectionLabel}>Quick Colors</Text>
              <View style={styles.presetsGrid}>
                {COLOR_PRESETS.map((preset, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.presetSwatch,
                      { backgroundColor: preset },
                      tempColor.toUpperCase() === preset.toUpperCase() && styles.presetSelected
                    ]}
                    onPress={() => {
                      setTempColor(preset);
                      setHsl(hexToHsl(preset));
                    }}
                  />
                ))}
              </View>
    
              {/* Saturation/Lightness Selector */}
              <Text style={styles.sectionLabel}>Fine-tune Color</Text>
              <Pressable
                onPress={handleSLTouch}
            >
                <View 
                ref={slSelectorRef}
                style={styles.slSelector}
                {...slSelectorResponder.panHandlers}
                >
                <SLGradient hue={hue} />
                {/* Cursor */}
                <View 
                    style={[
                    styles.slCursor,
                    { 
                        left: (saturation / 100) * 280 - 10,
                        top: ((100 - lightness) / 100) * 200 - 10,
                    }
                    ]}
                    pointerEvents="none"
                />
                </View>
            </Pressable>
    
              {/* Hue Slider */}
              <Text style={styles.sectionLabel}>Hue</Text>
              <Pressable
                onPress={handleHueTouch}
            >
                <View 
                ref={hueSliderRef}
                style={styles.hueSlider}
                {...hueSliderResponder.panHandlers}
                >
                <HueGradient />
                <View 
                    style={[
                    styles.hueCursor,
                    { left: (hue / 360) * 300 - 8 }
                    ]}
                    pointerEvents="none"
                />
                </View>
            </Pressable>
    
              {/* Action buttons */}
              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Color</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      );
};

export default function MyChords() {
  // State to track colors for each chord (default to theme accent color)
  const { chordColors, setChordColor, getChordColor } = useChordColors();

  const [selectedChord, setSelectedChord] = useState<ChordName | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleColorSelect = (chordName: ChordName) => {
    setSelectedChord(chordName);
    setModalVisible(true);
  };

  const handleColorChange = (color: string) => {
    if (selectedChord) {
      setChordColor(selectedChord, color);
    }
  };

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

        <Pressable style={[styles.navItem, styles.navItemActive]}>
        <View style={styles.chordGridIcon}>
            <View style={styles.chordDot} />
            <View style={styles.chordDot} />
            <View style={styles.chordDot} />
        </View>
        <Text style={styles.navLabel}>My Chords</Text>
        </Pressable>

        <Link href="/" asChild>
            <Pressable style={styles.navItem}>
                <View style={styles.profileIcon}>
                <View style={styles.profileIconInner} />
                </View>
                <Text style={styles.navLabel}>Profile</Text>
            </Pressable>
        </Link>
        </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Chords</Text>
        <Text style={styles.pageSubtitle}>Tap any chord to customize its color</Text>
        
        <View style={styles.chordsGrid}>
          {CHORD_DATA.map((chord) => (
            <ChordCard
              key={chord.name}
              chord={chord}
              color={chordColors[chord.name]}
              onColorSelect={() => handleColorSelect(chord.name)}
            />
          ))}
        </View>
      </ScrollView>

      <ColorPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectColor={handleColorChange}
        currentColor={selectedChord ? chordColors[selectedChord] : ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
  
    // Container
    container: {
      paddingTop: theme.spacing(3),
      paddingHorizontal: theme.spacing(3),
      paddingBottom: theme.spacing(6),
    },
  
    // Page Title
    pageTitle: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing(1),
      fontStyle: 'italic',
    },
    pageSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing(4),
    },
  
    // Chords Grid
    chordsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: theme.spacing(3),
    },
  
    // Chord Card
    chordCard: {
      width: '48%',
      minWidth: 280,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      padding: theme.spacing(2.5),
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    chordName: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing(2),
      fontStyle: 'italic',
    },
  
    // Piano Keyboard
    pianoContainer: {
      position: 'relative',
      height: 100,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.sm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pianoKeys: {
      flexDirection: 'row',
      height: '100%',
    },
    whiteKey: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRightWidth: 1,
      borderColor: '#333',
    },
    blackKeysContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60%',
      flexDirection: 'row',
      paddingHorizontal: 2,
    },
    blackKeySpacer: {
      flex: 1,
    },
    blackKey: {
      width: 20,
      height: '100%',
      backgroundColor: '#000000',
      marginHorizontal: -10,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#444',
    },
  
    // Color Picker Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.xl,
      padding: theme.spacing(4),
      width: '90%',
      maxWidth: 500,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing(3),
      textAlign: 'center',
    },
  
    // Color Preview
    colorPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing(3),
    },
    colorPreviewBox: {
      width: 60,
      height: 60,
      borderRadius: theme.radii.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginRight: theme.spacing(2),
    },
    colorPreviewText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      fontFamily: 'monospace',
    },
  
    // Section labels
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing(1.5),
      marginTop: theme.spacing(2),
    },
  
    // Quick Presets
    presetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing(2),
    },
    presetSwatch: {
      width: 40,
      height: 40,
      borderRadius: theme.radii.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      marginRight: theme.spacing(1.5),
      marginBottom: theme.spacing(1.5),
    },
    presetSelected: {
      borderColor: theme.colors.textPrimary,
      borderWidth: 3,
    },
  
    // Saturation/Lightness Selector
    slSelector: {
      width: 280,
      height: 200,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing(2),
    },
    slCursor: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
      elevation: 5,
    },
  
    // Hue Slider
    hueSlider: {
      width: 300,
      height: 30,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing(3),
    },
    hueCursor: {
      position: 'absolute',
      width: 16,
      height: '100%',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
      elevation: 5,
    },
  
    // Action Buttons
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing(2),
      marginTop: theme.spacing(2),
    },
    cancelButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: theme.spacing(1.5),
      paddingHorizontal: theme.spacing(3),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing(1.5),
      paddingHorizontal: theme.spacing(3),
      borderRadius: 999,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
});