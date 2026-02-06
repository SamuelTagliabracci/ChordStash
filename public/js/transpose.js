// Chord transposition utilities

const Transpose = {
  // Note names in order (using sharps)
  notesSharp: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
  notesFlat: ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'],

  // Get index of a note (0-11)
  getNoteIndex(note) {
    const normalized = note.replace('♯', '#').replace('♭', 'b');
    let idx = this.notesSharp.indexOf(normalized);
    if (idx === -1) idx = this.notesFlat.indexOf(normalized);
    return idx;
  },

  // Transpose a single note by semitones
  transposeNote(note, semitones, preferFlats = false) {
    const idx = this.getNoteIndex(note);
    if (idx === -1) return note;

    const newIdx = ((idx + semitones) % 12 + 12) % 12;
    const notes = preferFlats ? this.notesFlat : this.notesSharp;
    return notes[newIdx];
  },

  // Detect if chord uses flats
  usesFlats(chord) {
    return chord.includes('b') && !chord.includes('dim');
  },

  // Transpose a full chord name
  chord(chordName, semitones) {
    if (semitones === 0) return chordName;

    // Parse the chord: root + optional bass note
    // Examples: Am, C#maj7, Dm/F, G7/B
    const match = chordName.match(/^([A-G][#b♯♭]?)(.*)$/);
    if (!match) return chordName;

    const [, root, suffix] = match;
    const preferFlats = this.usesFlats(chordName);

    // Check for bass note
    const bassMatch = suffix.match(/^(.*)\/([A-G][#b♯♭]?)$/);

    if (bassMatch) {
      const [, quality, bass] = bassMatch;
      const newRoot = this.transposeNote(root, semitones, preferFlats);
      const newBass = this.transposeNote(bass, semitones, preferFlats);
      return `${newRoot}${quality}/${newBass}`;
    }

    const newRoot = this.transposeNote(root, semitones, preferFlats);
    return `${newRoot}${suffix}`;
  },

  // Transpose all chords in a text string
  text(text, semitones) {
    if (semitones === 0) return text;

    // Match chord patterns in brackets
    return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
      return `[${this.chord(chord, semitones)}]`;
    });
  },

  // Get the key signature from a list of chords (simple heuristic)
  detectKey(chords) {
    // Common chord progressions and their likely keys
    const keyWeights = {};

    for (const chord of chords) {
      const root = chord.match(/^[A-G][#b]?/)?.[0];
      if (!root) continue;

      const isMinor = chord.includes('m') && !chord.includes('maj');
      const key = isMinor ? root + 'm' : root;

      keyWeights[key] = (keyWeights[key] || 0) + 1;

      // First chord often indicates key
      if (chords.indexOf(chord) === 0) {
        keyWeights[key] += 2;
      }
    }

    // Find most likely key
    let bestKey = null;
    let bestWeight = 0;
    for (const [key, weight] of Object.entries(keyWeights)) {
      if (weight > bestWeight) {
        bestWeight = weight;
        bestKey = key;
      }
    }

    return bestKey;
  },

  // Get common transposition targets
  getTranspositionSuggestions(currentKey) {
    if (!currentKey) return [];

    const root = currentKey.match(/^[A-G][#b]?/)?.[0];
    const isMinor = currentKey.includes('m');
    const idx = this.getNoteIndex(root);

    // Common transpositions: perfect 4th up, perfect 5th up, etc.
    const suggestions = [
      { semitones: 5, label: 'Perfect 4th up' },
      { semitones: 7, label: 'Perfect 5th up' },
      { semitones: -2, label: 'Whole step down' },
      { semitones: 2, label: 'Whole step up' },
    ];

    return suggestions.map(s => {
      const newIdx = ((idx + s.semitones) % 12 + 12) % 12;
      const newRoot = this.notesSharp[newIdx];
      const newKey = isMinor ? `${newRoot}m` : newRoot;
      return { ...s, targetKey: newKey };
    });
  }
};

window.Transpose = Transpose;
