// Auto-link songs to YouTube (and Spotify if possible)
import Database from 'better-sqlite3';
import ytsr from 'ytsr';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'songs.db');
const db = new Database(dbPath);

// Get all songs
const songs = db.prepare('SELECT id, title, artist, youtube_url, spotify_url FROM songs').all();

console.log(`Found ${songs.length} songs to process...\n`);

const updateYoutube = db.prepare('UPDATE songs SET youtube_url = ? WHERE id = ?');
const updateSpotify = db.prepare('UPDATE songs SET spotify_url = ? WHERE id = ?');

async function searchYoutube(artist, title) {
  try {
    const query = `${artist} ${title} official`;
    const results = await ytsr(query, { limit: 1 });

    if (results.items.length > 0) {
      const video = results.items.find(item => item.type === 'video');
      if (video) {
        return video.url;
      }
    }
  } catch (err) {
    console.error(`  YouTube search failed: ${err.message}`);
  }
  return null;
}

async function searchSpotify(artist, title) {
  // Spotify requires OAuth for search API
  // Return a search URL that can be opened manually
  const query = encodeURIComponent(`${artist} ${title}`);
  return `https://open.spotify.com/search/${query}`;
}

async function processAll() {
  let youtubeLinked = 0;
  let spotifyLinked = 0;
  let skipped = 0;

  for (const song of songs) {
    const { id, title, artist, youtube_url, spotify_url } = song;
    console.log(`Processing: ${artist} - ${title}`);

    // YouTube
    if (!youtube_url) {
      const ytUrl = await searchYoutube(artist || '', title);
      if (ytUrl) {
        updateYoutube.run(ytUrl, id);
        console.log(`  YouTube: ${ytUrl}`);
        youtubeLinked++;
      } else {
        console.log(`  YouTube: Not found`);
      }
    } else {
      console.log(`  YouTube: Already linked`);
      skipped++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n========== Summary ==========`);
  console.log(`YouTube linked: ${youtubeLinked}`);
  console.log(`Already had links: ${skipped}`);
  console.log(`Total songs: ${songs.length}`);
}

processAll().then(() => {
  console.log('\nDone!');
  db.close();
}).catch(err => {
  console.error('Error:', err);
  db.close();
});
