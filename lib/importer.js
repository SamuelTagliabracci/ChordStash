// URL importer for Ultimate Guitar and other tab sites
import { chromium } from 'playwright';

export async function importFromUrl(url) {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname.includes('ultimate-guitar.com')) {
    return importFromUltimateGuitar(url);
  }

  throw new Error('Unsupported site. Currently only Ultimate Guitar is supported.');
}

async function importFromUltimateGuitar(url) {
  // Try fetch first (works when Cloudflare isn't blocking)
  try {
    return await importFromUGViaFetch(url);
  } catch (fetchErr) {
    console.log(`Fetch failed (${fetchErr.message}), trying Playwright fallback...`);
  }

  // Fall back to Playwright (renders the page in a real browser)
  return await importFromUGViaPlaywright(url);
}

async function importFromUGViaFetch(url) {
  const dataContent = await fetchUGData(url);
  const jsonStr = decodeHtmlEntities(dataContent);

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse song data JSON');
  }

  const store = data?.store?.page?.data;
  if (!store) {
    throw new Error('Could not find tab data in page');
  }

  const tab = store.tab;
  const tabView = store.tab_view;

  if (!tab || !tabView) {
    throw new Error('Missing tab information');
  }

  const title = tab.song_name || 'Unknown Title';
  const artist = tab.artist_name || 'Unknown Artist';
  const capo = tabView.meta?.capo;
  const tuning = tabView.meta?.tuning?.name;
  const key = tabView.meta?.tonality;

  let rawContent = tabView.wiki_tab?.content;
  if (!rawContent) {
    throw new Error('No chord content found');
  }

  const content = convertUGToChordPro(rawContent, { title, artist, capo, tuning, key });
  const strummings = tabView.strummings || [];

  return {
    title,
    artist,
    content,
    source_url: url,
    capo,
    tuning,
    key,
    strummings
  };
}

async function importFromUGViaPlaywright(url) {
  const { rawContent, title, artist, capo } = await fetchUGDataWithPlaywright(url);

  // The Playwright path gets chord-over-lyrics text from the rendered <pre> tag,
  // so we convert that format to ChordPro
  const content = convertChordOverLyricsToChordPro(rawContent, { title, artist, capo });

  return {
    title,
    artist,
    content,
    source_url: url,
    capo: capo || undefined,
    tuning: undefined,
    key: undefined,
    strummings: []
  };
}

async function fetchUGData(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await response.text();

  // Detect Cloudflare block: 403 status or challenge markers in HTML
  if (!response.ok || html.includes('challenge-platform') || html.includes('cf_chl_opt')) {
    throw new Error(`Blocked by Cloudflare (status ${response.status})`);
  }

  const storeMatch = html.match(/class="js-store"\s+data-content="([^"]+)"/);
  if (!storeMatch) {
    throw new Error('Could not find song data on page');
  }

  return storeMatch[1];
}

async function fetchUGDataWithPlaywright(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the chord content to render in a <pre> tag
    await page.waitForSelector('pre', { timeout: 30000 });

    // Extract chord content from the rendered <pre> tag
    const rawContent = await page.$eval('pre', el => el.textContent);
    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error('No chord content found in rendered page');
    }

    // Extract metadata from JSON-LD structured data
    let title = 'Unknown Title';
    let artist = 'Unknown Artist';
    try {
      const ldJson = await page.$eval('script[type="application/ld+json"]', el => JSON.parse(el.textContent));
      if (ldJson.name) title = ldJson.name;
      if (ldJson.byArtist?.name) artist = ldJson.byArtist.name;
    } catch (e) {
      // Fall back to page title parsing: "SONG - TITLE CHORDS by Artist @ Ultimate-Guitar.Com"
      const pageTitle = await page.title();
      const titleMatch = pageTitle.match(/^(.+?)\s+(?:CHORDS|TAB)\s+.*?by\s+(.+?)\s*[@/]/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
        artist = titleMatch[2].trim();
      }
    }

    // Extract capo from page content
    const html = await page.content();
    const capoMatch = html.match(/[Cc]apo[:\s]*(\d+)/);
    const capo = capoMatch ? parseInt(capoMatch[1]) : null;

    return { rawContent, title, artist, capo };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function convertChordOverLyricsToChordPro(text, metadata) {
  let lines = [];

  // Add metadata header
  lines.push(`{title: ${metadata.title}}`);
  lines.push(`{artist: ${metadata.artist}}`);
  if (metadata.capo) {
    lines.push(`{capo: ${metadata.capo}}`);
  }
  lines.push('');

  const contentLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Detect if a line is a chord-only line (contains chord names and spaces, no lyrics)
  function isChordLine(line) {
    if (line.trim().length === 0) return false;
    // Section headers like [Verse 1] are not chord lines
    if (/^\s*\[/.test(line)) return false;
    // A chord line consists only of chord names and whitespace
    // Chords: A-G optionally followed by #/b and modifiers
    const withoutChords = line.replace(/\b[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\/[A-G][#b]?|[0-9]+)*\b/g, '');
    // After removing chords, only whitespace and | should remain
    return /^\s*[|\s]*\s*$/.test(withoutChords);
  }

  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i];
    const trimmed = line.trim();

    // Section headers like [Verse 1], [Chorus]
    if (/^\[([A-Za-z][^\]]*)\]$/.test(trimmed)) {
      lines.push('');
      lines.push(trimmed);
      continue;
    }

    // If this is a chord line followed by a lyrics line, merge them into ChordPro format
    if (isChordLine(line) && i + 1 < contentLines.length) {
      const nextLine = contentLines[i + 1];
      const nextTrimmed = nextLine.trim();
      // Don't merge if next line is also a chord line, a section header, or empty
      if (!isChordLine(nextLine) && nextTrimmed.length > 0 && !/^\[/.test(nextTrimmed)) {
        lines.push(mergeChordAndLyricLines(line, nextLine));
        i++; // Skip the lyrics line since we merged it
        continue;
      }
    }

    // Chord-only line (no lyrics below) — wrap each chord in brackets
    if (isChordLine(line)) {
      const chordLine = line.replace(/\b([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\/[A-G][#b]?|[0-9]+)*)\b/g, '[$1]');
      lines.push(chordLine.trim());
      continue;
    }

    lines.push(line);
  }

  let result = lines.join('\n');
  result = result.replace(/\n{4,}/g, '\n\n\n');
  return result;
}

function mergeChordAndLyricLines(chordLine, lyricLine) {
  // Find chord positions in the chord line
  const chords = [];
  const chordRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|add\d+|\/[A-G][#b]?|[0-9]+)*)\b/g;
  let match;
  while ((match = chordRegex.exec(chordLine)) !== null) {
    chords.push({ chord: match[1], position: match.index });
  }

  if (chords.length === 0) return lyricLine;

  // Build the merged line by inserting chords at their positions in the lyrics
  // Process from right to left so insertions don't shift positions
  let result = lyricLine;
  // Pad lyrics to be at least as long as chord line
  while (result.length < chordLine.length) {
    result += ' ';
  }

  for (let j = chords.length - 1; j >= 0; j--) {
    const { chord, position } = chords[j];
    const insertion = `[${chord}]`;
    if (position >= result.length) {
      result = result + insertion;
    } else {
      result = result.substring(0, position) + insertion + result.substring(position);
    }
  }

  return result.trimEnd();
}

function convertUGToChordPro(ugContent, metadata) {
  let lines = [];

  // Add metadata header
  lines.push(`{title: ${metadata.title}}`);
  lines.push(`{artist: ${metadata.artist}}`);
  if (metadata.capo) {
    lines.push(`{capo: ${metadata.capo}}`);
  }
  if (metadata.key) {
    lines.push(`{key: ${metadata.key}}`);
  }
  if (metadata.tuning && metadata.tuning !== 'E A D G B E' && metadata.tuning !== 'Standard') {
    lines.push(`{tuning: ${metadata.tuning}}`);
  }
  lines.push('');

  // UG uses [tab] and [/tab] for tab sections, [ch]Chord[/ch] for chords
  // Clean up the content
  let content = ugContent
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Decode HTML entities in content
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Remove [tab] tags
    .replace(/\[tab\]/g, '')
    .replace(/\[\/tab\]/g, '')
    // Convert [ch]Chord[/ch] to [Chord] and ensure spacing between consecutive chords
    .replace(/\[ch\]([^\[]+)\[\/ch\]/g, '[$1]')
    // Add space between consecutive chords (][) that don't have space
    .replace(/\](\[)/g, '] $1');

  // Split into lines and process
  const contentLines = content.split('\n');

  for (const line of contentLines) {
    // Check if this is a section header like [Verse 1] or [Chorus]
    const sectionMatch = line.trim().match(/^\[([A-Za-z][^\]]*)\]$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1];
      // Only treat as section if it's not a chord (doesn't start with A-G followed by modifier)
      if (!/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\/|7|9|11|13)?/.test(sectionName)) {
        lines.push('');
        lines.push(`[${sectionName}]`);
        continue;
      }
    }

    lines.push(line);
  }

  // Clean up excessive blank lines
  let result = lines.join('\n');
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}

export default { importFromUrl };
