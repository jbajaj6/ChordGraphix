from flask import Flask, request, jsonify
from flask_cors import CORS
from chord_detection import detect_chord
import sqlite3
import json
import os

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

DB_FILE = 'songs.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_FILE):
        conn = get_db_connection()
        conn.execute('''
            CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                date_analyzed TEXT
            )
        ''')
        conn.commit()
        conn.close()
        print("Database initialized.")

init_db()

@app.route('/check-chord', methods=['POST', 'OPTIONS'])
def check_chord():
    if request.method == 'OPTIONS':
        return '', 200
    
    data = request.json
    pressed_keys = data.get('keys', [])
    
    chord = detect_chord(pressed_keys)
    
    return jsonify({
        'detected_chord': chord,
        'is_correct': chord == data.get('expected_chord')
    })


@app.route('/songs', methods=['GET', 'POST', 'OPTIONS'])
def handle_songs():
    if request.method == 'OPTIONS':
        return '', 200

    if request.method == 'GET':
        conn = get_db_connection()
        songs = conn.execute('SELECT data FROM songs ORDER BY date_analyzed DESC').fetchall()
        conn.close()
        return jsonify([json.loads(song['data']) for song in songs])

    if request.method == 'POST':
        song_data = request.json
        song_id = song_data.get('id')
        date_analyzed = song_data.get('dateAnalyzed')
        
        if not song_id:
            return jsonify({'error': 'Song ID required'}), 400

        conn = get_db_connection()
        conn.execute('INSERT OR REPLACE INTO songs (id, data, date_analyzed) VALUES (?, ?, ?)',
                     (song_id, json.dumps(song_data), date_analyzed))
        conn.commit()
        conn.close()
        return jsonify(song_data), 201

@app.route('/songs/<song_id>', methods=['DELETE', 'OPTIONS'])
def delete_song(song_id):
    if request.method == 'OPTIONS':
        return '', 200

    conn = get_db_connection()
    conn.execute('DELETE FROM songs WHERE id = ?', (song_id,))
    conn.commit()
    conn.close()
    return '', 204

@app.route('/songs/export', methods=['POST', 'OPTIONS'])
def export_songs_to_file():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Get all songs from the request
        songs_data = request.json
        
        conn = get_db_connection()
        
        # Clear all existing songs from database
        conn.execute('DELETE FROM songs')
        
        # Insert all songs from the request
        for song in songs_data:
            song_id = song.get('id')
            date_analyzed = song.get('dateAnalyzed')
            conn.execute('INSERT INTO songs (id, data, date_analyzed) VALUES (?, ?, ?)',
                        (song_id, json.dumps(song), date_analyzed))
        
        conn.commit()
        conn.close()
        
        # Also write to songs.json file for backup
        with open('songs.json', 'w') as f:
            json.dump(songs_data, f, indent=2)
        
        return jsonify({'message': f'Successfully exported {len(songs_data)} songs'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)