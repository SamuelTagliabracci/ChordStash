// Chord diagram renderer for guitar, ukulele, bass, and piano

const DiagramRenderer = {
  // SVG dimensions (for side panel)
  config: {
    guitar: { strings: 6, frets: 5, width: 70, height: 85 },
    ukulele: { strings: 4, frets: 4, width: 55, height: 70 },
    bass: { strings: 4, frets: 5, width: 55, height: 85 },
    piano: { keys: 14, width: 110, height: 55 }
  },

  // Render appropriate diagram based on instrument
  render(chord, instrument) {
    const data = getChordData(chord, instrument);
    if (!data) {
      return this.renderUnknown(chord);
    }

    if (instrument === 'piano') {
      return this.renderPiano(data);
    } else {
      return this.renderFretboard(data, instrument);
    }
  },

  // Render fretboard diagram (guitar, ukulele, bass)
  renderFretboard(data, instrument) {
    const cfg = this.config[instrument];
    const { frets, fingers, barre, name } = data;

    const padding = 10;
    const topPadding = 15;
    const stringSpacing = (cfg.width - padding * 2) / (cfg.strings - 1);
    const fretSpacing = (cfg.height - topPadding - padding) / cfg.frets;

    // Calculate starting fret
    const numericFrets = frets.filter(f => typeof f === 'number' && f > 0);
    const minFret = Math.min(...numericFrets) || 1;
    const maxFret = Math.max(...numericFrets) || 1;
    const startFret = maxFret > cfg.frets ? minFret : 1;
    const showNut = startFret === 1;

    let svg = `<svg width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">`;

    // Background
    svg += `<rect width="100%" height="100%" fill="var(--bg-secondary)"/>`;

    // Nut or fret number
    if (showNut) {
      svg += `<rect x="${padding - 2}" y="${topPadding - 3}" width="${cfg.width - padding * 2 + 4}" height="4" fill="var(--text-primary)"/>`;
    } else {
      svg += `<text x="5" y="${topPadding + fretSpacing / 2 + 3}" font-size="8" fill="var(--text-secondary)">${startFret}</text>`;
    }

    // Fret lines
    for (let i = 0; i <= cfg.frets; i++) {
      const y = topPadding + i * fretSpacing;
      svg += `<line x1="${padding}" y1="${y}" x2="${cfg.width - padding}" y2="${y}" stroke="var(--text-muted)" stroke-width="1"/>`;
    }

    // String lines
    for (let i = 0; i < cfg.strings; i++) {
      const x = padding + i * stringSpacing;
      svg += `<line x1="${x}" y1="${topPadding}" x2="${x}" y2="${cfg.height - padding}" stroke="var(--text-secondary)" stroke-width="${i < 2 ? 1.5 : 1}"/>`;
    }

    // Barre if present
    if (barre) {
      const barreY = topPadding + (barre - startFret + 0.5) * fretSpacing;
      const firstString = frets.findIndex(f => f === barre);
      const lastString = frets.lastIndexOf(barre);
      if (firstString >= 0 && lastString >= 0) {
        svg += `<rect x="${padding + firstString * stringSpacing - 4}" y="${barreY - 4}"
                      width="${(lastString - firstString) * stringSpacing + 8}" height="8"
                      rx="4" fill="var(--text-primary)"/>`;
      }
    }

    // Finger positions and muted/open markers
    for (let i = 0; i < cfg.strings; i++) {
      const x = padding + i * stringSpacing;
      const fret = frets[i];

      if (fret === 'x' || fret === null) {
        // Muted string
        svg += `<text x="${x}" y="${topPadding - 5}" font-size="10" text-anchor="middle" fill="var(--text-secondary)">×</text>`;
      } else if (fret === 0) {
        // Open string
        svg += `<circle cx="${x}" cy="${topPadding - 6}" r="3" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"/>`;
      } else {
        // Fretted note
        const adjustedFret = fret - startFret + 1;
        const y = topPadding + (adjustedFret - 0.5) * fretSpacing;

        // Skip if this is part of barre (except endpoints)
        if (!barre || fret !== barre) {
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="var(--text-primary)"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  },

  // Render piano diagram
  renderPiano(data) {
    const { intervals, root, name } = data;
    const cfg = this.config.piano;

    // Calculate which keys to highlight
    const activeKeys = intervals.map(i => (root + i) % 12);

    // Key layout: C C# D D# E F F# G G# A A# B (0-11)
    const keyWidth = 15;
    const blackKeyWidth = 10;
    const whiteKeyHeight = 50;
    const blackKeyHeight = 32;

    // We'll show one octave plus a bit
    const whiteKeys = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
    const blackKeys = [1, 3, 6, 8, 10]; // C# D# F# G# A#

    let svg = `<svg width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}">`;
    svg += `<rect width="100%" height="100%" fill="var(--bg-secondary)"/>`;

    const startX = 7;

    // Draw white keys first
    whiteKeys.forEach((note, i) => {
      const x = startX + i * keyWidth;
      const isActive = activeKeys.includes(note);
      svg += `<rect x="${x}" y="5" width="${keyWidth - 1}" height="${whiteKeyHeight}"
                    fill="${isActive ? 'var(--chord-color)' : '#fff'}"
                    stroke="#333" stroke-width="1" rx="1"/>`;
    });

    // Draw black keys on top
    const blackKeyPositions = [0, 1, 3, 4, 5]; // After C, D, F, G, A
    blackKeyPositions.forEach((pos, i) => {
      const note = blackKeys[i];
      const x = startX + (pos + 1) * keyWidth - blackKeyWidth / 2;
      const isActive = activeKeys.includes(note);
      svg += `<rect x="${x}" y="5" width="${blackKeyWidth}" height="${blackKeyHeight}"
                    fill="${isActive ? 'var(--chord-color)' : '#333'}"
                    stroke="#000" stroke-width="1" rx="1"/>`;
    });

    svg += '</svg>';
    return svg;
  },

  // Render unknown chord placeholder
  renderUnknown(chord) {
    return `<div class="chord-unknown">
      <span>?</span>
      <small>No diagram for ${chord}</small>
    </div>`;
  },

  // Create full chord diagram element
  createDiagramElement(chord, instrument) {
    const container = document.createElement('div');
    container.className = 'chord-diagram';
    container.dataset.chord = chord;

    const nameEl = document.createElement('div');
    nameEl.className = 'chord-diagram-name';
    nameEl.textContent = chord;

    const diagramEl = document.createElement('div');
    diagramEl.className = 'chord-diagram-svg';
    diagramEl.innerHTML = this.render(chord, instrument);

    container.appendChild(nameEl);
    container.appendChild(diagramEl);

    return container;
  }
};

window.DiagramRenderer = DiagramRenderer;
