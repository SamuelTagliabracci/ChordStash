// Chord database for multiple instruments
// Format: [fret positions] or [piano keys] depending on instrument
// Guitar/Bass/Ukulele: array of fret numbers per string (x = muted, 0 = open)
// Piano: array of semitones from root (0 = root)

const CHORD_DB = {
  guitar: {
    // Major chords
    'A':      { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'B':      { frets: ['x', 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: 2 },
    'C':      { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'D':      { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'E':      { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'F':      { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
    'G':      { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },

    // Minor chords
    'Am':     { frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'Bm':     { frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },
    'Cm':     { frets: ['x', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: 3 },
    'Dm':     { frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    'Em':     { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'Fm':     { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
    'Gm':     { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: 3 },

    // 7th chords
    'A7':     { frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
    'B7':     { frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
    'C7':     { frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    'D7':     { frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
    'E7':     { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    'F7':     { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: 1 },
    'G7':     { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },

    // Minor 7th chords
    'Am7':    { frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    'Bm7':    { frets: ['x', 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], barre: 2 },
    'Cm7':    { frets: ['x', 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], barre: 3 },
    'Dm7':    { frets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
    'Em7':    { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0] },
    'Fm7':    { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barre: 1 },
    'Gm7':    { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barre: 3 },

    // Major 7th chords
    'Amaj7':  { frets: ['x', 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    'Bmaj7':  { frets: ['x', 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], barre: 2 },
    'Cmaj7':  { frets: ['x', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    'Dmaj7':  { frets: ['x', 'x', 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
    'Emaj7':  { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
    'Fmaj7':  { frets: [1, 'x', 2, 2, 1, 0], fingers: [1, 0, 3, 4, 2, 0] },
    'Gmaj7':  { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },

    // Sus chords
    'Asus2':  { frets: ['x', 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
    'Asus4':  { frets: ['x', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'Dsus2':  { frets: ['x', 'x', 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
    'Dsus4':  { frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
    'Esus2':  { frets: [0, 2, 4, 4, 0, 0], fingers: [0, 1, 3, 4, 0, 0] },
    'Esus4':  { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0] },
    'Gsus2':  { frets: [3, 0, 0, 0, 3, 3], fingers: [1, 0, 0, 0, 2, 3] },
    'Gsus4':  { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
    'Csus2':  { frets: ['x', 3, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 2, 3] },
    'Csus4':  { frets: ['x', 3, 3, 0, 1, 1], fingers: [0, 2, 3, 0, 1, 1] },
    'Fsus2':  { frets: ['x', 'x', 3, 0, 1, 1], fingers: [0, 0, 3, 0, 1, 1] },
    'Fsus4':  { frets: [1, 1, 3, 3, 1, 1], fingers: [1, 1, 2, 3, 1, 1], barre: 1 },

    // 7sus4 chords
    'A7sus4': { frets: ['x', 0, 2, 0, 3, 0], fingers: [0, 0, 1, 0, 3, 0] },
    'B7sus4': { frets: ['x', 2, 4, 2, 5, 2], fingers: [0, 1, 3, 1, 4, 1], barre: 2 },
    'C7sus4': { frets: ['x', 3, 3, 3, 1, 1], fingers: [0, 2, 3, 4, 1, 1] },
    'D7sus4': { frets: ['x', 'x', 0, 2, 1, 3], fingers: [0, 0, 0, 2, 1, 3] },
    'E7sus4': { frets: [0, 2, 0, 2, 0, 0], fingers: [0, 1, 0, 2, 0, 0] },
    'G7sus4': { frets: [3, 3, 0, 0, 1, 1], fingers: [2, 3, 0, 0, 1, 1] },

    // Add9 chords
    'Cadd9':  { frets: ['x', 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
    'Gadd9':  { frets: [3, 0, 0, 0, 0, 3], fingers: [1, 0, 0, 0, 0, 2] },
    'Dadd9':  { frets: ['x', 'x', 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
    'Aadd9':  { frets: ['x', 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
    'Eadd9':  { frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
    'Fadd9':  { frets: ['x', 'x', 3, 2, 1, 3], fingers: [0, 0, 3, 2, 1, 4] },

    // Slash chords (bass note variations)
    'D/F#':   { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },
    'D/A':    { frets: ['x', 0, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'G/B':    { frets: ['x', 2, 0, 0, 0, 3], fingers: [0, 1, 0, 0, 0, 2] },
    'G/D':    { frets: ['x', 'x', 0, 0, 0, 3], fingers: [0, 0, 0, 0, 0, 1] },
    'G/F#':   { frets: [2, 2, 0, 0, 0, 3], fingers: [1, 2, 0, 0, 0, 3] },
    'C/G':    { frets: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0] },
    'C/E':    { frets: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'C/B':    { frets: ['x', 2, 2, 0, 1, 0], fingers: [0, 2, 3, 0, 1, 0] },
    'Am/G':   { frets: [3, 0, 2, 2, 1, 0], fingers: [3, 0, 2, 2, 1, 0] },
    'Am/E':   { frets: [0, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'Am/C':   { frets: ['x', 3, 2, 2, 1, 0], fingers: [0, 4, 2, 3, 1, 0] },
    'Em/D':   { frets: ['x', 'x', 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0] },
    'Em/B':   { frets: ['x', 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0] },
    'Em/G':   { frets: [3, 2, 2, 0, 0, 0], fingers: [3, 1, 2, 0, 0, 0] },
    'F/C':    { frets: ['x', 3, 3, 2, 1, 1], fingers: [0, 3, 4, 2, 1, 1] },
    'F/A':    { frets: ['x', 0, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] },
    'A/C#':   { frets: ['x', 4, 2, 2, 2, 0], fingers: [0, 4, 1, 2, 3, 0] },
    'A/E':    { frets: [0, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'A/G':    { frets: [3, 0, 2, 2, 2, 0], fingers: [3, 0, 1, 2, 2, 0] },
    'E/G#':   { frets: [4, 2, 2, 1, 0, 0], fingers: [4, 2, 3, 1, 0, 0] },
    'E/B':    { frets: ['x', 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'B/F#':   { frets: [2, 2, 4, 4, 4, 2], fingers: [1, 1, 2, 3, 4, 1], barre: 2 },
    'Bm/A':   { frets: ['x', 0, 4, 4, 3, 2], fingers: [0, 0, 3, 4, 2, 1] },
    'Dm/C':   { frets: ['x', 3, 0, 2, 3, 1], fingers: [0, 3, 0, 2, 4, 1] },
    'Dm/F':   { frets: [1, 'x', 0, 2, 3, 1], fingers: [1, 0, 0, 2, 4, 1] },

    // Power chords
    'A5':     { frets: ['x', 0, 2, 2, 'x', 'x'], fingers: [0, 0, 1, 2, 0, 0] },
    'B5':     { frets: ['x', 2, 4, 4, 'x', 'x'], fingers: [0, 1, 3, 4, 0, 0] },
    'C5':     { frets: ['x', 3, 5, 5, 'x', 'x'], fingers: [0, 1, 3, 4, 0, 0] },
    'D5':     { frets: ['x', 'x', 0, 2, 3, 'x'], fingers: [0, 0, 0, 1, 2, 0] },
    'E5':     { frets: [0, 2, 2, 'x', 'x', 'x'], fingers: [0, 1, 2, 0, 0, 0] },
    'F5':     { frets: [1, 3, 3, 'x', 'x', 'x'], fingers: [1, 3, 4, 0, 0, 0] },
    'G5':     { frets: [3, 5, 5, 'x', 'x', 'x'], fingers: [1, 3, 4, 0, 0, 0] },

    // Diminished
    'Adim':   { frets: ['x', 0, 1, 2, 1, 'x'], fingers: [0, 0, 1, 3, 2, 0] },
    'Bdim':   { frets: ['x', 2, 3, 4, 3, 'x'], fingers: [0, 1, 2, 4, 3, 0] },
    'Cdim':   { frets: ['x', 3, 4, 5, 4, 'x'], fingers: [0, 1, 2, 4, 3, 0] },
    'Ddim':   { frets: ['x', 'x', 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
    'Edim':   { frets: [0, 1, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },

    // Augmented
    'Aaug':   { frets: ['x', 0, 3, 2, 2, 1], fingers: [0, 0, 4, 2, 3, 1] },
    'Caug':   { frets: ['x', 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
    'Eaug':   { frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
    'Gaug':   { frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] },

    // 9th chords
    'A9':     { frets: ['x', 0, 2, 4, 2, 3], fingers: [0, 0, 1, 3, 1, 4] },
    'C9':     { frets: ['x', 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 4] },
    'D9':     { frets: ['x', 'x', 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] },
    'E9':     { frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
    'G9':     { frets: [3, 0, 0, 2, 0, 1], fingers: [3, 0, 0, 2, 0, 1] },

    // Minor 9th
    'Am9':    { frets: ['x', 0, 2, 4, 1, 0], fingers: [0, 0, 2, 4, 1, 0] },
    'Dm9':    { frets: ['x', 'x', 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] },
    'Em9':    { frets: [0, 2, 0, 0, 0, 2], fingers: [0, 1, 0, 0, 0, 2] },

    // 6th chords
    'A6':     { frets: ['x', 0, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1] },
    'C6':     { frets: ['x', 3, 2, 2, 1, 0], fingers: [0, 4, 2, 3, 1, 0] },
    'D6':     { frets: ['x', 'x', 0, 2, 0, 2], fingers: [0, 0, 0, 1, 0, 2] },
    'E6':     { frets: [0, 2, 2, 1, 2, 0], fingers: [0, 2, 3, 1, 4, 0] },
    'G6':     { frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, 0, 0, 0, 0] },

    // Minor 6th
    'Am6':    { frets: ['x', 0, 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
    'Dm6':    { frets: ['x', 'x', 0, 2, 0, 1], fingers: [0, 0, 0, 2, 0, 1] },
    'Em6':    { frets: [0, 2, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },
  },

  ukulele: {
    // Major
    'A':      { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
    'B':      { frets: [4, 3, 2, 2], fingers: [3, 2, 1, 1], barre: 2 },
    'C':      { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
    'D':      { frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0] },
    'E':      { frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1], barre: 2 },
    'F':      { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
    'G':      { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },

    // Minor
    'Am':     { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] },
    'Bm':     { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], barre: 2 },
    'Cm':     { frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
    'Dm':     { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
    'Em':     { frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
    'Fm':     { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
    'Gm':     { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },

    // 7th
    'A7':     { frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
    'B7':     { frets: [2, 3, 2, 2], fingers: [1, 2, 1, 1], barre: 2 },
    'C7':     { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
    'D7':     { frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2], barre: 2 },
    'E7':     { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
    'F7':     { frets: [2, 3, 1, 0], fingers: [2, 3, 1, 0] },
    'G7':     { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },

    // Minor 7th
    'Am7':    { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
    'Bm7':    { frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1], barre: 2 },
    'Dm7':    { frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
    'Em7':    { frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
    'Gm7':    { frets: [0, 2, 1, 1], fingers: [0, 3, 1, 2] },

    // Maj7
    'Amaj7':  { frets: [1, 1, 0, 0], fingers: [1, 2, 0, 0] },
    'Cmaj7':  { frets: [0, 0, 0, 2], fingers: [0, 0, 0, 1] },
    'Dmaj7':  { frets: [2, 2, 2, 4], fingers: [1, 1, 1, 3], barre: 2 },
    'Fmaj7':  { frets: [2, 4, 1, 0], fingers: [2, 4, 1, 0] },
    'Gmaj7':  { frets: [0, 2, 2, 2], fingers: [0, 1, 2, 3] },

    // Sus chords
    'Asus2':  { frets: [2, 4, 0, 2], fingers: [1, 3, 0, 2] },
    'Asus4':  { frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
    'Dsus2':  { frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
    'Dsus4':  { frets: [0, 2, 3, 0], fingers: [0, 1, 2, 0] },
    'Esus4':  { frets: [2, 4, 0, 2], fingers: [1, 3, 0, 2] },
    'Gsus4':  { frets: [0, 2, 3, 3], fingers: [0, 1, 2, 3] },

    // 7sus4
    'A7sus4': { frets: [0, 2, 0, 0], fingers: [0, 1, 0, 0] },
    'D7sus4': { frets: [2, 2, 0, 3], fingers: [1, 2, 0, 3] },
    'E7sus4': { frets: [2, 2, 0, 2], fingers: [1, 2, 0, 3] },
    'G7sus4': { frets: [0, 2, 1, 3], fingers: [0, 2, 1, 3] },

    // Slash chords
    'D/F#':   { frets: [2, 2, 2, 4], fingers: [1, 1, 1, 3], barre: 2 },
    'G/B':    { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
    'G/F#':   { frets: [0, 2, 2, 2], fingers: [0, 1, 2, 3] },
    'C/G':    { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
    'C/E':    { frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
    'Am/G':   { frets: [2, 4, 3, 0], fingers: [1, 4, 3, 0] },
    'Am/E':   { frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] },
  },

  bass: {
    // 4-string bass - root positions (E A D G strings)
    // Format: [frets] with null for muted
    'A':      { frets: [null, 0, null, null], fingers: [0, 0, 0, 0], root: 1 },
    'B':      { frets: [null, 2, null, null], fingers: [0, 2, 0, 0], root: 1 },
    'C':      { frets: [null, 3, null, null], fingers: [0, 3, 0, 0], root: 1 },
    'D':      { frets: [null, null, 0, null], fingers: [0, 0, 0, 0], root: 2 },
    'E':      { frets: [0, null, null, null], fingers: [0, 0, 0, 0], root: 0 },
    'F':      { frets: [1, null, null, null], fingers: [1, 0, 0, 0], root: 0 },
    'G':      { frets: [3, null, null, null], fingers: [3, 0, 0, 0], root: 0 },

    // Power chord shapes (root + fifth)
    'A5':     { frets: [null, 0, 2, null], fingers: [0, 0, 2, 0], root: 1 },
    'B5':     { frets: [null, 2, 4, null], fingers: [0, 1, 3, 0], root: 1 },
    'C5':     { frets: [null, 3, 5, null], fingers: [0, 1, 3, 0], root: 1 },
    'D5':     { frets: [null, null, 0, 2], fingers: [0, 0, 0, 2], root: 2 },
    'E5':     { frets: [0, 2, null, null], fingers: [0, 2, 0, 0], root: 0 },
    'F5':     { frets: [1, 3, null, null], fingers: [1, 3, 0, 0], root: 0 },
    'G5':     { frets: [3, 5, null, null], fingers: [1, 3, 0, 0], root: 0 },

    // Minor (root + flat 3rd)
    'Am':     { frets: [null, 0, 2, 2], fingers: [0, 0, 2, 3], root: 1 },
    'Bm':     { frets: [null, 2, 4, 4], fingers: [0, 1, 3, 4], root: 1 },
    'Cm':     { frets: [null, 3, 5, 5], fingers: [0, 1, 3, 4], root: 1 },
    'Dm':     { frets: [null, null, 0, 1], fingers: [0, 0, 0, 1], root: 2 },
    'Em':     { frets: [0, 2, 2, null], fingers: [0, 2, 3, 0], root: 0 },
    'Fm':     { frets: [1, 3, 3, null], fingers: [1, 3, 4, 0], root: 0 },
    'Gm':     { frets: [3, 5, 5, null], fingers: [1, 3, 4, 0], root: 0 },
  },

  // Piano: intervals from root (semitones)
  piano: {
    // Major triads
    'A':      { intervals: [0, 4, 7], root: 9 },    // A C# E
    'B':      { intervals: [0, 4, 7], root: 11 },   // B D# F#
    'C':      { intervals: [0, 4, 7], root: 0 },    // C E G
    'D':      { intervals: [0, 4, 7], root: 2 },    // D F# A
    'E':      { intervals: [0, 4, 7], root: 4 },    // E G# B
    'F':      { intervals: [0, 4, 7], root: 5 },    // F A C
    'G':      { intervals: [0, 4, 7], root: 7 },    // G B D

    // Minor triads
    'Am':     { intervals: [0, 3, 7], root: 9 },
    'Bm':     { intervals: [0, 3, 7], root: 11 },
    'Cm':     { intervals: [0, 3, 7], root: 0 },
    'Dm':     { intervals: [0, 3, 7], root: 2 },
    'Em':     { intervals: [0, 3, 7], root: 4 },
    'Fm':     { intervals: [0, 3, 7], root: 5 },
    'Gm':     { intervals: [0, 3, 7], root: 7 },

    // Dominant 7th
    'A7':     { intervals: [0, 4, 7, 10], root: 9 },
    'B7':     { intervals: [0, 4, 7, 10], root: 11 },
    'C7':     { intervals: [0, 4, 7, 10], root: 0 },
    'D7':     { intervals: [0, 4, 7, 10], root: 2 },
    'E7':     { intervals: [0, 4, 7, 10], root: 4 },
    'F7':     { intervals: [0, 4, 7, 10], root: 5 },
    'G7':     { intervals: [0, 4, 7, 10], root: 7 },

    // Minor 7th
    'Am7':    { intervals: [0, 3, 7, 10], root: 9 },
    'Bm7':    { intervals: [0, 3, 7, 10], root: 11 },
    'Cm7':    { intervals: [0, 3, 7, 10], root: 0 },
    'Dm7':    { intervals: [0, 3, 7, 10], root: 2 },
    'Em7':    { intervals: [0, 3, 7, 10], root: 4 },
    'Fm7':    { intervals: [0, 3, 7, 10], root: 5 },
    'Gm7':    { intervals: [0, 3, 7, 10], root: 7 },

    // Major 7th
    'Amaj7':  { intervals: [0, 4, 7, 11], root: 9 },
    'Bmaj7':  { intervals: [0, 4, 7, 11], root: 11 },
    'Cmaj7':  { intervals: [0, 4, 7, 11], root: 0 },
    'Dmaj7':  { intervals: [0, 4, 7, 11], root: 2 },
    'Emaj7':  { intervals: [0, 4, 7, 11], root: 4 },
    'Fmaj7':  { intervals: [0, 4, 7, 11], root: 5 },
    'Gmaj7':  { intervals: [0, 4, 7, 11], root: 7 },

    // Sus2
    'Asus2':  { intervals: [0, 2, 7], root: 9 },
    'Dsus2':  { intervals: [0, 2, 7], root: 2 },
    'Esus2':  { intervals: [0, 2, 7], root: 4 },

    // Sus4
    'Asus4':  { intervals: [0, 5, 7], root: 9 },
    'Dsus4':  { intervals: [0, 5, 7], root: 2 },
    'Esus4':  { intervals: [0, 5, 7], root: 4 },
    'Gsus4':  { intervals: [0, 5, 7], root: 7 },

    // Diminished
    'Adim':   { intervals: [0, 3, 6], root: 9 },
    'Bdim':   { intervals: [0, 3, 6], root: 11 },
    'Cdim':   { intervals: [0, 3, 6], root: 0 },
    'Ddim':   { intervals: [0, 3, 6], root: 2 },
    'Edim':   { intervals: [0, 3, 6], root: 4 },

    // Augmented
    'Aaug':   { intervals: [0, 4, 8], root: 9 },
    'Caug':   { intervals: [0, 4, 8], root: 0 },
    'Eaug':   { intervals: [0, 4, 8], root: 4 },
    'Gaug':   { intervals: [0, 4, 8], root: 7 },

    // 7sus4
    'A7sus4': { intervals: [0, 5, 7, 10], root: 9 },
    'B7sus4': { intervals: [0, 5, 7, 10], root: 11 },
    'C7sus4': { intervals: [0, 5, 7, 10], root: 0 },
    'D7sus4': { intervals: [0, 5, 7, 10], root: 2 },
    'E7sus4': { intervals: [0, 5, 7, 10], root: 4 },
    'F7sus4': { intervals: [0, 5, 7, 10], root: 5 },
    'G7sus4': { intervals: [0, 5, 7, 10], root: 7 },

    // Csus2, Csus4
    'Csus2':  { intervals: [0, 2, 7], root: 0 },
    'Csus4':  { intervals: [0, 5, 7], root: 0 },
    'Fsus2':  { intervals: [0, 2, 7], root: 5 },
    'Fsus4':  { intervals: [0, 5, 7], root: 5 },
    'Gsus2':  { intervals: [0, 2, 7], root: 7 },

    // Add9 chords
    'Cadd9':  { intervals: [0, 4, 7, 14], root: 0 },
    'Dadd9':  { intervals: [0, 4, 7, 14], root: 2 },
    'Eadd9':  { intervals: [0, 4, 7, 14], root: 4 },
    'Fadd9':  { intervals: [0, 4, 7, 14], root: 5 },
    'Gadd9':  { intervals: [0, 4, 7, 14], root: 7 },
    'Aadd9':  { intervals: [0, 4, 7, 14], root: 9 },

    // Slash chords (show as root triad)
    'D/F#':   { intervals: [0, 4, 7], root: 2 },
    'D/A':    { intervals: [0, 4, 7], root: 2 },
    'G/B':    { intervals: [0, 4, 7], root: 7 },
    'G/D':    { intervals: [0, 4, 7], root: 7 },
    'G/F#':   { intervals: [0, 4, 7], root: 7 },
    'C/G':    { intervals: [0, 4, 7], root: 0 },
    'C/E':    { intervals: [0, 4, 7], root: 0 },
    'C/B':    { intervals: [0, 4, 7], root: 0 },
    'Am/G':   { intervals: [0, 3, 7], root: 9 },
    'Am/E':   { intervals: [0, 3, 7], root: 9 },
    'Am/C':   { intervals: [0, 3, 7], root: 9 },
    'Em/D':   { intervals: [0, 3, 7], root: 4 },
    'Em/B':   { intervals: [0, 3, 7], root: 4 },
    'Em/G':   { intervals: [0, 3, 7], root: 4 },
    'F/C':    { intervals: [0, 4, 7], root: 5 },
    'F/A':    { intervals: [0, 4, 7], root: 5 },
    'A/C#':   { intervals: [0, 4, 7], root: 9 },
    'A/E':    { intervals: [0, 4, 7], root: 9 },
    'A/G':    { intervals: [0, 4, 7], root: 9 },
    'E/G#':   { intervals: [0, 4, 7], root: 4 },
    'E/B':    { intervals: [0, 4, 7], root: 4 },
    'B/F#':   { intervals: [0, 4, 7], root: 11 },
    'Bm/A':   { intervals: [0, 3, 7], root: 11 },
    'Dm/C':   { intervals: [0, 3, 7], root: 2 },
    'Dm/F':   { intervals: [0, 3, 7], root: 2 },

    // 9th chords
    'A9':     { intervals: [0, 4, 7, 10, 14], root: 9 },
    'C9':     { intervals: [0, 4, 7, 10, 14], root: 0 },
    'D9':     { intervals: [0, 4, 7, 10, 14], root: 2 },
    'E9':     { intervals: [0, 4, 7, 10, 14], root: 4 },
    'G9':     { intervals: [0, 4, 7, 10, 14], root: 7 },
  }
};

// Sharp/flat equivalents for lookup
const ENHARMONIC = {
  'A#': 'Bb', 'Bb': 'A#',
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#'
};

// Get chord data with enharmonic fallback
function getChordData(chord, instrument) {
  const db = CHORD_DB[instrument];
  if (!db) return null;

  // Try direct match
  if (db[chord]) return { ...db[chord], name: chord };

  // Try enharmonic equivalent
  const root = chord.match(/^[A-G][#b]?/)?.[0];
  if (root && ENHARMONIC[root]) {
    const altChord = chord.replace(root, ENHARMONIC[root]);
    if (db[altChord]) return { ...db[altChord], name: chord };
  }

  return null;
}

// Export for use in other modules
window.CHORD_DB = CHORD_DB;
window.getChordData = getChordData;
