// ChordPro parser
// Handles both ChordPro format and Ultimate Guitar style two-line format

const ChordProParser = {
  // Parse ChordPro content into structured data
  parse(content) {
    const lines = content.split('\n');
    const result = {
      metadata: {},
      sections: [],
      chords: new Set()
    };

    let currentSection = { name: null, lines: [] };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines but preserve them in output
      if (!trimmed) {
        currentSection.lines.push({ type: 'empty' });
        continue;
      }

      // Metadata directive: {key: value}
      const metaMatch = trimmed.match(/^\{(\w+):\s*(.+?)\}$/);
      if (metaMatch) {
        const [, key, value] = metaMatch;
        result.metadata[key.toLowerCase()] = value;
        continue;
      }

      // Comment directive: {comment: text} or {c: text}
      const commentMatch = trimmed.match(/^\{(?:comment|c):\s*(.+?)\}$/);
      if (commentMatch) {
        currentSection.lines.push({ type: 'comment', text: commentMatch[1] });
        continue;
      }

      // Section header: [Verse 1], [Chorus], etc.
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch && !this.isChordLine(trimmed)) {
        // Save current section if it has content
        if (currentSection.lines.length > 0 || currentSection.name) {
          result.sections.push(currentSection);
        }
        currentSection = { name: sectionMatch[1], lines: [] };
        continue;
      }

      // Line with chords: [Am]Lyrics [G]here
      if (this.hasChords(trimmed)) {
        const parsed = this.parseChordLine(trimmed);
        parsed.chords.forEach(c => result.chords.add(c));
        currentSection.lines.push({ type: 'chord-line', parts: parsed.parts });
        continue;
      }

      // Plain lyrics line
      currentSection.lines.push({ type: 'lyrics', text: trimmed });
    }

    // Don't forget the last section
    if (currentSection.lines.length > 0 || currentSection.name) {
      result.sections.push(currentSection);
    }

    return result;
  },

  // Check if a line is just a chord marker like [Am]
  isChordLine(line) {
    // If it's a single chord in brackets at the start of a line, it might be a section header
    // Sections are typically words like "Verse", "Chorus", "Bridge"
    const match = line.match(/^\[([^\]]+)\]$/);
    if (!match) return false;

    const content = match[1];
    // If it looks like a chord (starts with A-G), it's a chord
    if (/^[A-G]/.test(content)) return true;
    // Otherwise it's probably a section header
    return false;
  },

  // Check if line contains chords
  hasChords(line) {
    return /\[[A-G][^\]]*\]/.test(line);
  },

  // Parse a line with chords into parts
  parseChordLine(line) {
    const parts = [];
    const chords = [];
    const regex = /\[([^\]]+)\]/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Text before this chord
      if (match.index > lastIndex) {
        const text = line.slice(lastIndex, match.index);
        if (parts.length > 0) {
          // Attach to previous chord
          parts[parts.length - 1].text = text;
        } else {
          parts.push({ chord: null, text });
        }
      }

      const chord = match[1];
      chords.push(chord);
      parts.push({ chord, text: '' });
      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last chord
    if (lastIndex < line.length) {
      const text = line.slice(lastIndex);
      if (parts.length > 0) {
        parts[parts.length - 1].text = text;
      } else {
        parts.push({ chord: null, text });
      }
    }

    return { parts, chords };
  },

  // Render parsed content to HTML
  render(parsed, transposeAmount = 0) {
    let html = '';

    // Metadata
    if (Object.keys(parsed.metadata).length > 0) {
      html += '<div class="metadata">';
      if (parsed.metadata.key) {
        const transposedKey = Transpose.chord(parsed.metadata.key, transposeAmount);
        html += `<div>Key: ${this.escapeHtml(transposedKey)}</div>`;
      }
      if (parsed.metadata.capo) {
        html += `<div>Capo: ${this.escapeHtml(parsed.metadata.capo)}</div>`;
      }
      if (parsed.metadata.tempo) {
        html += `<div>Tempo: ${this.escapeHtml(parsed.metadata.tempo)}</div>`;
      }
      html += '</div>';
    }

    // Sections
    for (const section of parsed.sections) {
      if (section.name) {
        html += `<div class="section-header">[${this.escapeHtml(section.name)}]</div>`;
      }

      for (const line of section.lines) {
        switch (line.type) {
          case 'empty':
            html += '<div class="lyric-block"><div class="lyrics-line">&nbsp;</div></div>';
            break;

          case 'comment':
            html += `<div class="comment">${this.escapeHtml(line.text)}</div>`;
            break;

          case 'lyrics':
            html += `<div class="lyric-block"><div class="lyrics-line">${this.escapeHtml(line.text)}</div></div>`;
            break;

          case 'chord-line':
            html += this.renderTwoLineFormat(line.parts, transposeAmount);
            break;
        }
      }
    }

    return html;
  },

  // Render chords above lyrics in two-line format
  renderTwoLineFormat(parts, transposeAmount) {
    // Build chord line and lyrics line with proper spacing
    let chordSegments = [];
    let lyricSegments = [];

    // Check if this is mostly a chord-only line (for better spacing)
    const hasSubstantialLyrics = parts.some(p => p.text && p.text.trim().length > 2);
    const minChordSpacing = hasSubstantialLyrics ? 1 : 3; // Add spacing between chords

    for (const part of parts) {
      const chord = part.chord ? Transpose.chord(part.chord, transposeAmount) : '';
      const text = part.text || '';

      // Calculate spacing - chord should be at least as wide as the text below it
      const chordLen = chord.length;
      const textLen = text.length;

      // Minimum width ensures chords don't bunch together
      const minWidth = Math.max(chordLen + minChordSpacing, textLen);

      if (chord) {
        const chordPadding = minWidth - chordLen;
        const textPadding = minWidth - textLen;

        chordSegments.push(`<span class="chord" data-chord="${this.escapeHtml(chord)}">${this.escapeHtml(chord)}</span>${'&nbsp;'.repeat(chordPadding)}`);
        lyricSegments.push(this.escapeHtml(text) + '&nbsp;'.repeat(textPadding > 0 ? textPadding : 0));
      } else {
        // No chord, just lyrics
        chordSegments.push('&nbsp;'.repeat(minWidth || 1));
        lyricSegments.push(this.escapeHtml(text) + '&nbsp;'.repeat(minWidth - textLen > 0 ? minWidth - textLen : 0));
      }
    }

    const hasChords = parts.some(p => p.chord);
    const hasLyrics = parts.some(p => p.text && p.text.trim());

    let html = '<div class="lyric-block">';

    if (hasChords) {
      html += `<div class="chord-line">${chordSegments.join('')}</div>`;
    }

    if (hasLyrics) {
      html += `<div class="lyrics-line">${lyricSegments.join('')}</div>`;
    } else if (hasChords) {
      // Chord-only line (like intro/outro)
      html += `<div class="lyrics-line">&nbsp;</div>`;
    }

    html += '</div>';
    return html;
  },

  // Get unique chords from parsed content (with transposition)
  getChords(parsed, transposeAmount = 0) {
    const chords = new Set();
    for (const chord of parsed.chords) {
      // Filter out section headers that got mistakenly captured
      if (this.isValidChord(chord)) {
        chords.add(Transpose.chord(chord, transposeAmount));
      }
    }
    return Array.from(chords);
  },

  // Check if a string is a valid chord (not a section header)
  isValidChord(str) {
    // Section headers and non-chord words to exclude
    const sectionHeaders = [
      'intro', 'verse', 'chorus', 'bridge', 'outro', 'pre-chorus', 'prechorus',
      'interlude', 'solo', 'instrumental', 'hook', 'refrain', 'coda', 'break',
      'tab', 'riff', 'ending', 'repeat', 'fade', 'chords', 'chord', 'capo',
      'tuning', 'note', 'tip', 'strumming', 'pattern', 'rhythm'
    ];

    const lower = str.toLowerCase().replace(/[0-9\s]/g, '');
    if (sectionHeaders.some(h => lower === h || lower.includes(h))) {
      return false;
    }

    // Valid chords start with A-G
    return /^[A-G]/.test(str);
  },

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Convert Ultimate Guitar two-line format to ChordPro
  convertFromUG(content) {
    const lines = content.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];

      // Check if this looks like a chord line (mostly chords and spaces)
      if (this.looksLikeChordLine(line) && nextLine !== undefined) {
        // Merge chord line with next line
        const merged = this.mergeChordAndLyrics(line, nextLine);
        result.push(merged);
        i++; // Skip the next line since we merged it
      } else {
        // Keep as-is or convert section headers
        const sectionMatch = line.match(/^\s*\[([^\]]+)\]\s*$/);
        if (sectionMatch) {
          result.push(`[${sectionMatch[1]}]`);
        } else {
          result.push(line);
        }
      }
    }

    return result.join('\n');
  },

  // Check if a line looks like it's just chords
  looksLikeChordLine(line) {
    if (!line || line.trim() === '') return false;

    // Remove all chord-like patterns and spaces
    const withoutChords = line.replace(/\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]?(?:\/[A-G][#b]?)?\b/g, '');
    const withoutSpaces = withoutChords.replace(/\s/g, '');

    // If there's very little left, it's probably a chord line
    return withoutSpaces.length < line.trim().length * 0.3;
  },

  // Merge a chord line with its lyrics line
  mergeChordAndLyrics(chordLine, lyricsLine) {
    // Find positions of chords in the chord line
    const chordRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]?(?:\/[A-G][#b]?)?)\b/g;
    const chords = [];
    let match;

    while ((match = chordRegex.exec(chordLine)) !== null) {
      chords.push({ chord: match[1], position: match.index });
    }

    if (chords.length === 0) return lyricsLine;

    // Insert chords into lyrics at appropriate positions
    let result = '';
    let lastPos = 0;

    // Sort chords by position (should already be sorted, but be safe)
    chords.sort((a, b) => a.position - b.position);

    for (const { chord, position } of chords) {
      // Add lyrics up to this position
      if (position < lyricsLine.length) {
        result += lyricsLine.slice(lastPos, position);
        lastPos = position;
      } else if (position > result.length) {
        // Chord extends past lyrics, add spacing
        result += lyricsLine.slice(lastPos);
        lastPos = lyricsLine.length;
      }
      result += `[${chord}]`;
    }

    // Add remaining lyrics
    result += lyricsLine.slice(lastPos);

    return result;
  }
};

window.ChordProParser = ChordProParser;
