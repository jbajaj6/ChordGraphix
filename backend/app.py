from flask import Flask, request, jsonify
from flask_cors import CORS
from chord_detection import detect_chord

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)