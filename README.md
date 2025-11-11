# ChordGraphix

An Expo (React Native) app that renders a 2–octave piano keyboard and detects musical chords from pressed keys. It includes a clean UI with realistic white/black keys and local chord detection powered by `@tonaljs`. An optional Flask backend is provided but not required for detection.

## Features

- Two-octave interactive piano (14 white keys, 10 black keys)
- Individual key highlighting (octave-aware)
- On-device chord detection with alternatives via `@tonaljs/chord-detect`
- Manual fallback detector for common chords (major, minor, 7th, sus, extended)
- Optional Flask API (`/check-chord`) for server-side detection

## Project Structure

- `app/index.tsx` – Home screen with navigation
- `app/piano.tsx` – Piano UI and interactions
- `app/chordDetection.ts` – Chord detection helper (tonaljs + fallback)
- `backend/app.py` – Optional Flask server
- `backend/chord_detection.py` – Simple server-side detector example

## Prerequisites

- Node.js (LTS recommended)
- npm
- For iOS simulator: Xcode; for Android: Android Studio/Emulator

## Install

```bash
npm install
```

Note: Project scripts call the local Expo CLI directly. No global Expo install is required.

## Run

```bash
# Start Metro and open the platform menu
npm run start

# Or directly start a platform
npm run ios
npm run android
npm run web
```

If you see an "expo: command not found" error when using other tools, prefer these npm scripts, which invoke the bundled CLI via `node node_modules/.bin/expo`.

## Usage

1. Launch the app and open the Piano screen.
2. Tap white or black keys to select notes (keys highlight individually, per octave).
3. Press "Check Chord" to detect the chord. The app shows the detected chord, alternative interpretations, and the pressed notes.
4. Click "Analyze a Song" to upload an m4a file and have it parse the chords in the first 30 seconds. 

## Optional: Run the Flask Backend

The app performs detection locally, but you can also run the backend for experimentation.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py  # serves on http://localhost:5001
```

In `app/piano.tsx`, the local detector is used. You can adapt it to call `http://localhost:5001/check-chord` if you want to compare results.

## Tech Stack

- React Native + Expo Router
- `@tonaljs/chord-detect`, `@tonaljs/chord`, `@tonaljs/note`
- TypeScript
- (Optional) Flask + Flask-CORS

## AI Usage

We used AI to help us come up with some of the implementation ideas and code for the chord detection and song parsing.
