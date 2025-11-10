def detect_chord(keys):
    """Detect chord from list of pressed keys"""
    keys_set = set(sorted(keys))
    
    # Define your chord patterns
    chords = {
        frozenset(['C', 'E', 'G']): 'C Major',
        frozenset(['A', 'C', 'E']): 'A Minor',
        frozenset(['G', 'B', 'D']): 'G Major',
        # Add more chords...
    }
    
    for chord_keys, chord_name in chords.items():
        if keys_set == chord_keys:
            return chord_name
    
    return 'Unknown'