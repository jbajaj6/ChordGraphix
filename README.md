# ChordGraphix 🎹

A comprehensive music learning and analysis app built with React Native and Expo. ChordGraphix helps musicians learn chords, analyze songs, and practice chord progressions through an interactive piano interface and AI-powered audio analysis.

## Features

### Interactive Piano Studio
- **Two-octave piano keyboard** (14 white keys, 10 black keys)
- **Individual key highlighting** with octave-aware visual feedback
- **Real-time chord detection** powered by `@tonaljs`
- **Multiple chord interpretations** - see alternative chord names for the same notes
- **Audio playback** - hear chords and individual notes

### Song Analysis
- **Upload audio files** (MP3, M4A, WAV, etc.) for chord analysis
- **Automatic chord detection** using Essentia.js audio analysis
- **Key and scale detection** - identifies the song's key and scale
- **Chord progression visualization** with timestamps
- **First 30 seconds analysis** - quick preview of song structure

### Song Library
- **Save analyzed songs** for later practice
- **Song library management** - view, organize, and delete saved songs
- **Import/Export functionality** - share songs between devices via clipboard or JSON files
- **Fallback song collection** - pre-loaded example songs in `songs.json`
- **User songs storage** - analyzed songs saved to `userSongs.json`

### Chord Practice
- **Interactive chord practice mode** - practice specific chord progressions
- **Visual chord feedback** - see which chords you're playing correctly
- **Custom chord collections** - save and practice your favorite chords

### Modern UI
- **Clean, intuitive interface** with dark theme support
- **Responsive design** - works on iOS, Android, and Web
- **Smooth animations** and haptic feedback
- **Navigation bar** for easy access to all features

## 📁 Project Structure

```
ChordGraphix/
├── app/                      # Expo Router screens
│   ├── index.tsx            # Home screen with navigation
│   ├── piano.tsx            # Interactive piano interface
│   ├── chordPractice.tsx     # Chord practice mode
│   ├── songAnalyzer.tsx     # Song upload and analysis UI
│   ├── songLibrary.tsx      # Song library management
│   ├── songPractice.tsx     # Practice saved songs
│   └── myChords.tsx         # Custom chord collections
├── src/                      # Core functionality
│   ├── chordDetection.ts    # Chord detection logic (@tonaljs)
│   ├── songAnalyzer.ts      # Audio analysis (Essentia.js)
│   ├── songStorage.ts        # Song storage and management
│   ├── audioPlayer.ts        # Audio playback functionality
│   ├── theme.ts             # App theme and styling
│   ├── songs.json           # Fallback songs (read-only)
│   └── userSongs.json       # User-analyzed songs (writable)
├── backend/                  # Optional Flask backend
│   ├── app.py               # Flask server
│   ├── chord_detection.py  # Server-side chord detection
│   └── requirements.txt     # Python dependencies
└── assets/                   # Images and icons
```

## Getting Started

### Prerequisites

- **Node.js** (LTS version recommended)
- **npm** or **yarn**
- **For iOS development**: Xcode (macOS only)
- **For Android development**: Android Studio and Android SDK
- **For Python backend** (optional): Python 3.8+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChordGraphix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   > **Note**: The project uses local Expo CLI, so no global Expo installation is required.

3. **Start the development server**
   ```bash
   npm start
   ```

   This will start Metro bundler and open the Expo development menu.

### Running on Different Platforms

```bash
# Start Metro and open platform menu
npm start

# Run on iOS simulator (macOS only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

> **Tip**: If you encounter "expo: command not found" errors, use the npm scripts above which invoke the bundled CLI via `node node_modules/.bin/expo`.

## 📖 Usage Guide

### Playing the Piano

1. Navigate to **Piano Studio** from the home screen
2. Tap white or black keys to select notes
3. Keys highlight individually (octave-aware)
4. Press **"Check Chord"** to detect the chord
5. View the detected chord name, alternatives, and pressed notes
6. Use **"Play Chord"** to hear the chord

### Analyzing Songs

1. Go to **Upload Song** from the navigation
2. Tap **"Pick Audio File"** and select an audio file (MP3, M4A, WAV, etc.)
3. Wait for analysis (processes first 30 seconds)
4. Review the results:
   - Detected key and scale
   - Chord progression with timestamps
   - Total and analyzed duration
5. Enter song name and artist (optional)
6. Tap **"Save Song for Practice"** to add to your library

### Managing Your Song Library

1. Open **Song Library** from the navigation
2. View all saved songs (from both fallback and user-analyzed)
3. Tap a song to practice it
4. Use **🗑️** to delete songs (only user songs can be deleted)
5. **Export songs**: Copy to clipboard or download JSON file
6. **Import songs**: Paste from clipboard to add songs from another device

### Practicing Songs

1. Select a song from **Song Library**
2. View the chord progression with timestamps
3. Practice playing along with the chord sequence
4. Use the piano to match the detected chords

## 🔧 Flask Backend (Required for Persistence)

The app requires the Flask backend to be running to save and load songs from the persistent database.

### Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

The server will run on `http://localhost:5001`.
- **API Endpoints**: `/songs` (GET, POST, DELETE)
- **Database**: Creates `songs.db` in the root directory.

> **Important**: You must run the backend for the song library to work. If the backend is not running, the app will fall back to a read-only list of bundled songs.

## Tech Stack

### Frontend
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.25) - Development platform and tooling
- **Expo Router** (~6.0.15) - File-based routing
- **TypeScript** (~5.9.2) - Type-safe JavaScript
- **React** (19.1.0) - UI library

### Music & Audio
- **@tonaljs** - Music theory library for chord detection
  - `@tonaljs/chord-detect` - Chord detection algorithms
  - `@tonaljs/chord` - Chord manipulation
  - `@tonaljs/note` - Note utilities
- **Essentia.js** (^0.1.3) - Audio analysis and feature extraction
- **Tone.js** (^15.1.22) - Web Audio API framework
- **expo-av** - Audio playback

### Storage & File System
- **expo-file-system** - File system operations
- **@react-native-async-storage** - Async storage (legacy support)
- **expo-clipboard** - Clipboard operations for import/export

### Backend (Required for Persistence)
- **Flask** (3.0.0) - Python web framework
- **Flask-CORS** (4.0.0) - Cross-origin resource sharing
- **SQLite** - Persistent database for song library

## 📝 Data Storage

### Persistent Song Library (SQLite)

The app now uses a **SQLite database** (`songs.db`) hosted by the Flask backend to store songs.

- **Shared Library**: All users accessing the backend share the **same song library**.
- **Persistence**: Songs are saved to `songs.db` and persist across app restarts and server restarts.
- **Real-time Updates**: Changes made by one user (adding/deleting songs) are immediately visible to others if they refresh.

> **Note**: Since there is no authentication, anyone with access to the app can add or delete songs from the shared library.

### Legacy/Fallback Storage
- **`songs.json`** (read-only): Fallback songs bundled with the app (used if backend is unreachable).
- **`userSongs.json`**: Deprecated local storage (migrated to backend).

### Export/Import

- **Export**: Songs can be exported to clipboard or downloaded as JSON
- **Import**: Paste JSON data from clipboard to import songs
- **Format**: Standard JSON array of song objects with chord progressions

## 🎨 Customization

### Theme

The app uses a centralized theme system in `src/theme.ts`. Modify colors, spacing, and typography there to customize the appearance.

### Adding Fallback Songs

Add songs to `src/songs.json` following this structure:

```json
[
  {
    "id": "unique-id",
    "name": "Song Name",
    "artist": "Artist Name",
    "dateAnalyzed": "2024-01-01T00:00:00.000Z",
    "analyzedDuration": 30,
    "key": "C",
    "scale": "major",
    "bpm": 120,
    "chords": [
      {
        "time": 0,
        "duration": 2,
        "chord": "C",
        "notes": ["C", "E", "G"]
      }
    ]
  }
]
```

## 🐛 Troubleshooting

### Common Issues

**"expo: command not found"**
- Use the npm scripts (`npm start`, `npm run ios`, etc.) instead of calling `expo` directly

**Audio file not analyzing**
- Ensure the file format is supported (MP3, M4A, WAV)
- Check that the file is not corrupted
- Try a shorter audio file (< 5 minutes)

**Songs not saving**
- Check file system permissions
- Ensure the app has write access to the document directory

**Backend not connecting**
- Verify Flask server is running on port 5001
- Check CORS settings if accessing from web
- Ensure firewall allows localhost connections

## 📄 License

This project is private and not licensed for public use.

## Acknowledgments

- **@tonaljs** - Excellent music theory library
- **Essentia.js** - Powerful audio analysis
- **Expo** - Great development platform
- AI assistance was used for implementation ideas

## 🔮 Future Enhancements

Potential features for future versions:
- Real-time audio input analysis
- MIDI file support
- Chord progression suggestions
- Metronome functionality
- Practice statistics and progress tracking
- Social sharing of chord progressions
- Advanced music theory analysis

---
