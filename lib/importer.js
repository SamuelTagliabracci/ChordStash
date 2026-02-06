// URL importer for Ultimate Guitar and other tab sites

export async function importFromUrl(url) {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname.includes('ultimate-guitar.com')) {
    return importFromUltimateGuitar(url);
  }

  throw new Error('Unsupported site. Currently only Ultimate Guitar is supported.');
}

async function importFromUltimateGuitar(url) {
  // Fetch the page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();

  // Ultimate Guitar stores song data in a JSON blob in the page
  // Look for the data-content attribute in the js-store div
  const storeMatch = html.match(/class="js-store"\s+data-content="([^"]+)"/);

  if (!storeMatch) {
    throw new Error('Could not find song data on page. The page format may have changed.');
  }

  // Decode HTML entities and parse JSON
  const jsonStr = decodeHtmlEntities(storeMatch[1]);

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse song data JSON');
  }

  // Navigate to the tab data
  const store = data?.store?.page?.data;
  if (!store) {
    throw new Error('Could not find tab data in page');
  }

  const tab = store.tab;
  const tabView = store.tab_view;

  if (!tab || !tabView) {
    throw new Error('Missing tab information');
  }

  // Extract metadata
  const title = tab.song_name || 'Unknown Title';
  const artist = tab.artist_name || 'Unknown Artist';
  const capo = tabView.meta?.capo;
  const tuning = tabView.meta?.tuning?.name;
  const key = tabView.meta?.tonality;

  // Get the chord/tab content
  let rawContent = tabView.wiki_tab?.content;

  if (!rawContent) {
    throw new Error('No chord content found');
  }

  // Convert UG format to ChordPro
  const content = convertUGToChordPro(rawContent, { title, artist, capo, tuning, key });

  // Extract strumming patterns
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
