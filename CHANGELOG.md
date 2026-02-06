# Changelog

All notable changes to ChordStash will be documented in this file.

## [1.0.0] - 2026-02-06

### Added
- Initial release
- Import songs from Ultimate Guitar URLs
- ChordPro format parsing with chords displayed above lyrics
- Chord diagrams for guitar, ukulele, bass, and piano
- Transpose functionality (+/- semitones)
- Auto-scroll with adjustable speed
- YouTube video embedding in Play Along section
- Spotify search integration
- Strumming pattern display (imported from Ultimate Guitar)
- Dark and light theme support
- Favorites system with star toggle
- Search by song title or artist
- Artist-grouped song list with collapsible sections
- Source URL links to original tabs
- Keyboard shortcuts (Space, Shift+Arrow, Escape)

### UI Layout
- Left sidebar: Song list grouped by artist
- Main area: Chord sheet with lyrics
- Right panel: Collapsible sections for Play Along, Strumming, and Chords

### Technical
- Node.js/Express backend
- SQLite database with better-sqlite3
- Vanilla JavaScript frontend (no frameworks)
- Responsive design
- Systemd service configuration
- Nginx reverse proxy configuration

### Scripts
- `install.sh` - Automated installation
- `start.sh` - Start the application
- `scripts/auto-link.js` - Batch YouTube linking
