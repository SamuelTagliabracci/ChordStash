# ChordStash

A self-hosted chord sheet manager for guitar and singing practice. Import songs from Ultimate Guitar, transpose chords, view chord diagrams, and play along with YouTube.

## Features

- **Import from Ultimate Guitar** - Paste a URL to import chord sheets automatically
- **ChordPro Format** - Clean chord-over-lyrics display
- **Transpose** - Shift chords up or down with one click
- **Multi-instrument Diagrams** - Guitar, ukulele, bass, and piano chord diagrams
- **Auto-scroll** - Hands-free scrolling while you play
- **YouTube Integration** - Embed videos to play along
- **Spotify Links** - Quick links to find songs on Spotify
- **Strumming Patterns** - Imported from Ultimate Guitar when available
- **Dark/Light Theme** - Easy on the eyes
- **Favorites** - Star your most-played songs
- **Search** - Find songs by title or artist

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla JavaScript, CSS

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
./start.sh

# Or manually
node server.js
```

Open http://localhost:3000 in your browser.

## Production Deployment

Edit `config.yaml` with your settings:

```yaml
app:
  name: chordstash
  port: 3000

server:
  domain: guitar.yourdomain.com
  user: youruser
  install_path: /path/to/ChordStash
```

Run the installer:

```bash
sudo ./install.sh
sudo systemctl start chordstash
sudo systemctl reload nginx
```

### Manual Setup

1. Copy `deploy/systemd/chordstash.service` to `/etc/systemd/system/`
2. Copy `deploy/nginx/chordstash.conf` to `/etc/nginx/sites-available/`
3. Enable and start the service

## Project Structure

```
ChordStash/
├── server.js           # Express server & API
├── config.yaml         # App configuration
├── start.sh            # Start script
├── install.sh          # Installation script
├── package.json
├── data/
│   └── songs.db        # SQLite database
├── db/
│   └── database.js     # Database module
├── lib/
│   └── importer.js     # Ultimate Guitar importer
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js      # Main application
│       ├── chords.js   # Chord database
│       ├── diagrams.js # Chord diagram renderer
│       ├── parser.js   # ChordPro parser
│       ├── transpose.js
│       └── strumming.js
└── deploy/
    ├── nginx/
    │   └── chordstash.conf
    └── systemd/
        └── chordstash.service
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/songs` | List all songs |
| GET | `/api/songs?q=query` | Search songs |
| GET | `/api/songs?favorites=true` | Get favorites |
| GET | `/api/songs/:id` | Get single song |
| POST | `/api/songs` | Create song |
| PUT | `/api/songs/:id` | Update song |
| PATCH | `/api/songs/:id/favorite` | Toggle favorite |
| DELETE | `/api/songs/:id` | Delete song |
| POST | `/api/import` | Import from URL |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Toggle auto-scroll |
| Shift + Up | Transpose up |
| Shift + Down | Transpose down |
| Escape | Close editor |

## Disclaimer

This software is provided for personal and educational use. When importing content from third-party websites, users are responsible for ensuring compliance with those sites' terms of service. Chord sheets and song content remain the intellectual property of their original creators and rights holders.

This project is not affiliated with, endorsed by, or connected to Ultimate Guitar, YouTube, Spotify, or any other third-party service.

## License

MIT - See [LICENSE](LICENSE) for details.
