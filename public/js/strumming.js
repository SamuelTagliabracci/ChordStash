// Strumming pattern renderer

const StrummingRenderer = {
  // Decode measure values from UG format
  // 1 = down, 2 = up, 101 = accented down, 102 = accented up, 202 = miss/rest
  decodeStrum(value) {
    switch (value) {
      case 1: return { type: 'down', accent: false };
      case 2: return { type: 'up', accent: false };
      case 101: return { type: 'down', accent: true };
      case 102: return { type: 'up', accent: true };
      case 201:
      case 202:
      default: return { type: 'miss', accent: false };
    }
  },

  // Get beat label for position (16th note grid)
  getBeatLabel(index, total) {
    // For 16th notes in 4/4: 1 e & a 2 e & a 3 e & a 4 e & a
    const labels16 = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'];
    // For 8th notes: 1 & 2 & 3 & 4 &
    const labels8 = ['1', '&', '2', '&', '3', '&', '4', '&'];

    if (total === 16) {
      return { label: labels16[index] || '', onBeat: index % 4 === 0 };
    } else if (total === 8) {
      return { label: labels8[index] || '', onBeat: index % 2 === 0 };
    }
    return { label: (index + 1).toString(), onBeat: true };
  },

  // Render a single strumming pattern
  renderPattern(pattern) {
    const { part, bpm, measures, denuminator } = pattern;

    let html = '<div class="strumming-pattern">';

    // Header with name and BPM
    html += '<div class="strumming-header">';
    html += `<span class="strumming-name">${part || 'Pattern'}</span>`;
    if (bpm) {
      html += `<span class="strumming-bpm">${bpm} BPM</span>`;
    }
    html += '</div>';

    // Strumming grid
    html += '<div class="strumming-grid">';

    const total = measures.length;

    measures.forEach((m, i) => {
      const strum = this.decodeStrum(m.measure);
      const beat = this.getBeatLabel(i, total);

      html += '<div class="strum-beat">';

      // Arrow
      let arrowClass = `strum-arrow ${strum.type}`;
      if (strum.accent) arrowClass += ' accent';

      let arrow = '';
      switch (strum.type) {
        case 'down': arrow = '↓'; break;
        case 'up': arrow = '↑'; break;
        case 'miss': arrow = '·'; break;
      }

      html += `<span class="${arrowClass}">${arrow}</span>`;

      // Beat count
      const countClass = beat.onBeat ? 'strum-count on-beat' : 'strum-count';
      html += `<span class="${countClass}">${beat.label}</span>`;

      html += '</div>';
    });

    html += '</div></div>';

    return html;
  },

  // Render all strumming patterns
  render(strummings) {
    if (!strummings || strummings.length === 0) {
      return '';
    }

    let html = '';
    for (const pattern of strummings) {
      html += this.renderPattern(pattern);
    }
    return html;
  }
};

window.StrummingRenderer = StrummingRenderer;
