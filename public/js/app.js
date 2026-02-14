// ChordStash - Main Application

const App = {
  // State
  songs: [],
  currentSong: null,
  currentFilter: 'all',
  transposeAmount: 0,
  parsedContent: null,
  isScrolling: false,
  scrollInterval: null,
  editMode: false,
  editingSongId: null,
  user: null,

  // DOM elements
  els: {},

  // Initialize the app
  async init() {
    // Apply theme early (before login check) based on saved preference
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');

    await this.checkAuth();
  },

  // Check authentication and show login or app
  async checkAuth() {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        this.user = await response.json();
        if (this.user.authenticated) {
          // Check if user is in the allowed users list
          if (this.user.error === 'not_authorized') {
            this.showAccessDenied();
            return;
          }
          // Try to get full Google profile (name, picture)
          await this.fetchGoogleProfile();
          this.showApp();
          return;
        }
      }
    } catch (err) {
      // Not authenticated
    }
    this.showLogin();
  },

  // Fetch full name and avatar from oauth2-proxy userinfo
  async fetchGoogleProfile() {
    try {
      const res = await fetch('/oauth2/userinfo');
      if (res.ok) {
        const profile = await res.json();
        if (profile.name) this.user.name = profile.name;
        if (profile.picture) this.user.picture = profile.picture;
      }
    } catch (err) {
      // Fallback to email-derived name
    }
  },

  showLogin() {
    document.getElementById('login-landing').classList.remove('hidden');
    document.getElementById('access-denied').classList.add('hidden');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('sidebar').classList.add('hidden');
  },

  showAccessDenied() {
    document.getElementById('login-landing').classList.add('hidden');
    document.getElementById('access-denied').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('denied-email').textContent = this.user.email;
  },

  async showApp() {
    document.getElementById('login-landing').classList.add('hidden');
    document.getElementById('access-denied').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');

    this.cacheElements();
    this.bindEvents();
    this.setupUserMenu();
    this.applyRoleUI();
    await this.loadSongs();
  },

  setupUserMenu() {
    if (!this.user || !this.user.email) return;

    const email = this.user.email;
    const displayName = this.user.name || email.split('@')[0];
    const initial = displayName.charAt(0).toUpperCase();

    const avatar = document.getElementById('user-avatar');

    if (this.user.picture) {
      // Use Google profile picture
      avatar.textContent = '';
      avatar.style.backgroundImage = `url(${this.user.picture})`;
    } else {
      // Fallback to letter avatar with colored background
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash) % 360;
      avatar.textContent = initial;
      avatar.style.backgroundColor = `hsl(${hue}, 55%, 50%)`;
    }

    // Set display name and email in dropdown
    document.getElementById('user-name').textContent = displayName;
    document.getElementById('user-email-display').textContent = email;

    // Dropdown toggle
    const btn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });

    // Manage Users (admin only)
    const manageUsersBtn = document.getElementById('manage-users-btn');
    manageUsersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.classList.add('hidden');
      this.showUsersModal();
    });

    // Users modal events
    document.getElementById('close-users-modal').addEventListener('click', () => this.hideUsersModal());
    document.getElementById('add-user-btn').addEventListener('click', () => this.addUser());
    document.getElementById('new-user-email').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addUser();
    });
  },

  // Cache DOM elements
  cacheElements() {
    this.els = {
      // Sidebar
      searchInput: document.getElementById('search-input'),
      songList: document.getElementById('song-list'),
      addSongBtn: document.getElementById('add-song-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      navBtns: document.querySelectorAll('.nav-btn'),

      // Main content
      emptyState: document.getElementById('empty-state'),
      songView: document.getElementById('song-view'),
      songEditor: document.getElementById('song-editor'),

      // Song view
      songTitle: document.getElementById('song-title'),
      songArtist: document.getElementById('song-artist'),
      songSource: document.getElementById('song-source'),
      favoriteBtn: document.getElementById('favorite-btn'),
      editBtn: document.getElementById('edit-btn'),
      deleteBtn: document.getElementById('delete-btn'),
      chordSheet: document.getElementById('chord-sheet'),
      chordDiagrams: document.getElementById('chord-diagrams'),

      // Toolbar
      transposeDown: document.getElementById('transpose-down'),
      transposeUp: document.getElementById('transpose-up'),
      transposeValue: document.getElementById('transpose-value'),
      scrollToggle: document.getElementById('scroll-toggle'),
      scrollSpeed: document.getElementById('scroll-speed'),
      instrumentSelect: document.getElementById('instrument'),

      // Editor
      editorTitle: document.getElementById('editor-title'),
      inputTitle: document.getElementById('input-title'),
      inputArtist: document.getElementById('input-artist'),
      inputSource: document.getElementById('input-source'),
      inputContent: document.getElementById('input-content'),
      saveBtn: document.getElementById('save-btn'),
      cancelEditBtn: document.getElementById('cancel-edit-btn'),
      formatHelp: document.getElementById('format-help'),
      formatModal: document.getElementById('format-modal'),
      closeModal: document.getElementById('close-modal'),

      // Import
      importBtn: document.getElementById('import-btn'),
      importModal: document.getElementById('import-modal'),
      importUrl: document.getElementById('import-url'),
      importError: document.getElementById('import-error'),
      importSuccess: document.getElementById('import-success'),
      importLoading: document.getElementById('import-loading'),
      doImport: document.getElementById('do-import'),
      cancelImport: document.getElementById('cancel-import'),

      // Strumming
      strummingSection: document.getElementById('strumming-section'),
      strummingToggle: document.getElementById('strumming-toggle'),
      strummingContent: document.getElementById('strumming-content'),

      // Media
      mediaSection: document.getElementById('media-section'),
      mediaToggle: document.getElementById('media-toggle'),
      saveYoutube: document.getElementById('save-youtube'),
      saveSpotify: document.getElementById('save-spotify'),
      searchYoutube: document.getElementById('search-youtube'),
      searchSpotify: document.getElementById('search-spotify'),
      youtubeUrlInput: document.getElementById('youtube-url-input'),
      spotifyUrlInput: document.getElementById('spotify-url-input'),
      youtubePlayer: document.getElementById('youtube-player'),

      // Chords panel
      chordsSection: document.getElementById('chords-section'),
      chordsToggle: document.getElementById('chords-toggle'),

      // Mobile
      mobileMenuBtn: document.getElementById('mobile-menu-btn'),
      sidebarOverlay: document.getElementById('sidebar-overlay'),
    };
  },

  // Bind event listeners
  bindEvents() {
    // Search
    this.els.searchInput.addEventListener('input', debounce(() => this.handleSearch(), 300));

    // Navigation
    this.els.navBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleNavClick(btn));
    });

    // Add song
    this.els.addSongBtn.addEventListener('click', () => this.showEditor());

    // Theme toggle
    this.els.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Song actions
    this.els.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
    this.els.editBtn.addEventListener('click', () => this.showEditor(this.currentSong));
    this.els.deleteBtn.addEventListener('click', () => this.deleteSong());

    // Transpose
    this.els.transposeDown.addEventListener('click', () => this.transpose(-1));
    this.els.transposeUp.addEventListener('click', () => this.transpose(1));

    // Auto-scroll
    this.els.scrollToggle.addEventListener('click', () => this.toggleScroll());
    this.els.scrollSpeed.addEventListener('input', () => this.updateScrollSpeed());

    // Instrument select
    this.els.instrumentSelect.addEventListener('change', () => this.renderChordDiagrams());

    // Editor
    this.els.saveBtn.addEventListener('click', () => this.saveSong());
    this.els.cancelEditBtn.addEventListener('click', () => this.hideEditor());
    this.els.formatHelp.addEventListener('click', (e) => {
      e.preventDefault();
      this.els.formatModal.classList.remove('hidden');
    });
    this.els.closeModal.addEventListener('click', () => {
      this.els.formatModal.classList.add('hidden');
    });

    // Chord click (show diagram)
    this.els.chordSheet.addEventListener('click', (e) => {
      if (e.target.classList.contains('chord')) {
        this.highlightChord(e.target.dataset.chord);
      }
    });

    // Import
    this.els.importBtn.addEventListener('click', () => this.showImportModal());
    this.els.cancelImport.addEventListener('click', () => this.hideImportModal());
    this.els.doImport.addEventListener('click', () => this.doImport());
    this.els.importUrl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doImport();
    });

    // Panel toggles
    this.els.strummingToggle.addEventListener('click', () => {
      this.els.strummingSection.classList.toggle('collapsed');
    });

    this.els.mediaToggle.addEventListener('click', () => {
      this.els.mediaSection.classList.toggle('collapsed');
    });

    this.els.chordsToggle.addEventListener('click', () => {
      this.els.chordsSection.classList.toggle('collapsed');
    });

    // Media buttons
    this.els.saveYoutube.addEventListener('click', () => this.saveYoutubeFromInput());
    this.els.saveSpotify.addEventListener('click', () => this.saveSpotifyFromInput());
    this.els.searchYoutube.addEventListener('click', () => this.searchYoutube());
    this.els.searchSpotify.addEventListener('click', () => this.searchSpotify());
    this.els.youtubeUrlInput.addEventListener('paste', () => {
      // Small delay to let paste complete
      setTimeout(() => this.embedYoutube(), 100);
    });
    this.els.youtubeUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.embedYoutube();
    });
    this.els.spotifyUrlInput.addEventListener('paste', () => {
      setTimeout(() => this.saveSpotifyFromInput(), 100);
    });
    this.els.spotifyUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveSpotifyFromInput();
    });

    // Mobile sidebar toggle
    this.els.mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
    this.els.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  },

  // Load songs from API
  async loadSongs() {
    try {
      const response = await fetch('/api/songs');
      this.songs = await response.json();
      this.renderSongList();
    } catch (err) {
      console.error('Failed to load songs:', err);
    }
  },

  // Render song list in sidebar (grouped by artist)
  renderSongList(songs = null) {
    const list = songs || this.songs;
    this.els.songList.innerHTML = '';

    if (list.length === 0) {
      this.els.songList.innerHTML = '<div class="empty-list">No songs found</div>';
      return;
    }

    // Group songs by artist
    const grouped = {};
    for (const song of list) {
      const artist = song.artist || 'Unknown Artist';
      if (!grouped[artist]) {
        grouped[artist] = [];
      }
      grouped[artist].push(song);
    }

    // Sort artists alphabetically
    const sortedArtists = Object.keys(grouped).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Sort songs within each artist
    for (const artist of sortedArtists) {
      grouped[artist].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
    }

    // Render grouped list
    for (const artist of sortedArtists) {
      const artistSongs = grouped[artist];

      const group = document.createElement('div');
      group.className = 'artist-group';

      // Collapse by default, except for artist with active song
      const hasActiveSong = artistSongs.some(s => s.id === this.currentSong?.id);
      if (!hasActiveSong) {
        group.classList.add('collapsed');
      }

      // Artist header
      const header = document.createElement('div');
      header.className = 'artist-header';
      header.innerHTML = `
        <span class="arrow">▼</span>
        <span class="artist-name">${this.escapeHtml(artist)}</span>
        <span class="song-count">${artistSongs.length}</span>
      `;
      header.addEventListener('click', () => {
        group.classList.toggle('collapsed');
      });
      group.appendChild(header);

      // Songs container
      const songsContainer = document.createElement('div');
      songsContainer.className = 'artist-songs';

      for (const song of artistSongs) {
        const item = document.createElement('div');
        item.className = 'song-item';
        if (this.currentSong?.id === song.id) {
          item.classList.add('active');
        }
        item.dataset.id = song.id;

        item.innerHTML = `
          ${song.is_favorite ? '<span class="favorite-star">★</span>' : ''}
          <span class="song-item-title">${this.escapeHtml(song.title)}</span>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectSong(song.id);
          this.closeMobileSidebar();
        });
        songsContainer.appendChild(item);
      }

      group.appendChild(songsContainer);
      this.els.songList.appendChild(group);
    }
  },

  // Select a song
  async selectSong(id) {
    try {
      const response = await fetch(`/api/songs/${id}`);
      this.currentSong = await response.json();
      this.transposeAmount = 0;

      // Parse strummings if stored as JSON string
      if (this.currentSong.strummings && typeof this.currentSong.strummings === 'string') {
        try {
          this.currentSong.strummings = JSON.parse(this.currentSong.strummings);
        } catch (e) {
          this.currentSong.strummings = null;
        }
      }

      // Parse and render
      this.parsedContent = ChordProParser.parse(this.currentSong.content);
      this.renderSongView();
      this.renderStrummingPatterns();
      this.renderMediaPlayer();
      this.showView('song');

      // Update sidebar selection
      document.querySelectorAll('.song-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id == id);
      });

      // Set instrument from song preference
      if (this.currentSong.default_instrument) {
        this.els.instrumentSelect.value = this.currentSong.default_instrument;
      }
      this.renderChordDiagrams();
    } catch (err) {
      console.error('Failed to load song:', err);
    }
  },

  // Render the song view
  renderSongView() {
    if (!this.currentSong || !this.parsedContent) return;

    // Header
    const title = this.parsedContent.metadata.title || this.currentSong.title;
    const artist = this.parsedContent.metadata.artist || this.currentSong.artist;

    this.els.songTitle.textContent = title;
    this.els.songArtist.textContent = artist || '';
    this.els.favoriteBtn.textContent = this.currentSong.is_favorite ? '★' : '☆';
    this.els.favoriteBtn.classList.toggle('is-favorite', this.currentSong.is_favorite);

    // Source link
    if (this.currentSong.source_url) {
      this.els.songSource.href = this.currentSong.source_url;
      this.els.songSource.classList.remove('hidden');
    } else {
      this.els.songSource.classList.add('hidden');
    }

    // Transpose display
    this.els.transposeValue.textContent = this.transposeAmount > 0 ? `+${this.transposeAmount}` : this.transposeAmount;

    // Chord sheet
    this.els.chordSheet.innerHTML = ChordProParser.render(this.parsedContent, this.transposeAmount);
  },

  // Render strumming patterns
  renderStrummingPatterns() {
    const strummings = this.currentSong?.strummings;

    if (strummings && strummings.length > 0) {
      this.els.strummingContent.innerHTML = StrummingRenderer.render(strummings);
      this.els.strummingSection.classList.remove('hidden');
    } else {
      this.els.strummingSection.classList.add('hidden');
    }
  },

  // Render chord diagrams sidebar
  renderChordDiagrams() {
    if (!this.parsedContent) return;

    const instrument = this.els.instrumentSelect.value;
    const chords = ChordProParser.getChords(this.parsedContent, this.transposeAmount);

    this.els.chordDiagrams.innerHTML = '';

    for (const chord of chords) {
      const diagram = DiagramRenderer.createDiagramElement(chord, instrument);
      this.els.chordDiagrams.appendChild(diagram);
    }
  },

  // Highlight a chord in the sidebar
  highlightChord(chordName) {
    document.querySelectorAll('.chord-diagram').forEach(el => {
      el.classList.toggle('highlighted', el.dataset.chord === chordName);
    });

    // Scroll to diagram
    const diagram = document.querySelector(`.chord-diagram[data-chord="${chordName}"]`);
    if (diagram) {
      diagram.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  // Transpose
  transpose(amount) {
    this.transposeAmount += amount;
    // Keep in reasonable range
    if (this.transposeAmount > 11) this.transposeAmount -= 12;
    if (this.transposeAmount < -11) this.transposeAmount += 12;

    this.renderSongView();
    this.renderChordDiagrams();
  },

  // Toggle auto-scroll
  toggleScroll() {
    this.isScrolling = !this.isScrolling;
    this.els.scrollToggle.textContent = this.isScrolling ? '⏸' : '▶';

    if (this.isScrolling) {
      this.startScrolling();
    } else {
      this.stopScrolling();
    }
  },

  startScrolling() {
    const speed = this.els.scrollSpeed.value;
    const pixelsPerTick = 1;
    const interval = 100 - (speed * 8); // Higher speed = lower interval

    this.scrollInterval = setInterval(() => {
      this.els.chordSheet.scrollTop += pixelsPerTick;

      // Stop at bottom
      if (this.els.chordSheet.scrollTop + this.els.chordSheet.clientHeight >= this.els.chordSheet.scrollHeight) {
        this.toggleScroll();
      }
    }, interval);
  },

  stopScrolling() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  },

  updateScrollSpeed() {
    if (this.isScrolling) {
      this.stopScrolling();
      this.startScrolling();
    }
  },

  // Toggle favorite
  async toggleFavorite() {
    if (!this.currentSong) return;

    try {
      const response = await fetch(`/api/songs/${this.currentSong.id}/favorite`, { method: 'PATCH' });
      this.currentSong = await response.json();

      this.els.favoriteBtn.textContent = this.currentSong.is_favorite ? '★' : '☆';
      this.els.favoriteBtn.classList.toggle('is-favorite', this.currentSong.is_favorite);

      // Update in songs list
      const idx = this.songs.findIndex(s => s.id === this.currentSong.id);
      if (idx >= 0) {
        this.songs[idx].is_favorite = this.currentSong.is_favorite;
      }

      this.renderSongList();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  },

  // Delete song
  async deleteSong() {
    if (!this.currentSong) return;
    if (!confirm(`Delete "${this.currentSong.title}"?`)) return;

    try {
      await fetch(`/api/songs/${this.currentSong.id}`, { method: 'DELETE' });

      this.songs = this.songs.filter(s => s.id !== this.currentSong.id);
      this.currentSong = null;
      this.parsedContent = null;

      this.renderSongList();
      this.showView('empty');
    } catch (err) {
      console.error('Failed to delete song:', err);
    }
  },

  // Show editor
  showEditor(song = null) {
    this.editingSongId = song?.id || null;
    this.els.editorTitle.textContent = song ? 'Edit Song' : 'Add New Song';

    this.els.inputTitle.value = song?.title || '';
    this.els.inputArtist.value = song?.artist || '';
    this.els.inputSource.value = song?.source_url || '';
    this.els.inputContent.value = song?.content || '';

    this.showView('editor');
  },

  // Hide editor
  hideEditor() {
    if (this.currentSong) {
      this.showView('song');
    } else {
      this.showView('empty');
    }
  },

  // Save song
  async saveSong() {
    const title = this.els.inputTitle.value.trim();
    const artist = this.els.inputArtist.value.trim();
    const source_url = this.els.inputSource.value.trim();
    const content = this.els.inputContent.value;

    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    try {
      let response;
      if (this.editingSongId) {
        response = await fetch(`/api/songs/${this.editingSongId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist, content, source_url })
        });
      } else {
        response = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, artist, content, source_url })
        });
      }

      const song = await response.json();

      // Update songs list
      if (this.editingSongId) {
        const idx = this.songs.findIndex(s => s.id === this.editingSongId);
        if (idx >= 0) this.songs[idx] = song;
      } else {
        this.songs.unshift(song);
      }

      this.renderSongList();
      this.selectSong(song.id);
    } catch (err) {
      console.error('Failed to save song:', err);
      alert('Failed to save song');
    }
  },

  // Handle search
  async handleSearch() {
    const query = this.els.searchInput.value.trim();

    if (query) {
      const response = await fetch(`/api/songs?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      this.renderSongList(results);
    } else {
      this.renderSongList();
    }
  },

  // Handle nav click
  handleNavClick(btn) {
    this.els.navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.currentFilter = btn.dataset.filter;

    if (this.currentFilter === 'favorites') {
      const favorites = this.songs.filter(s => s.is_favorite);
      this.renderSongList(favorites);
    } else {
      this.renderSongList();
    }
  },

  // Show a view (empty, song, editor)
  showView(view) {
    this.els.emptyState.classList.toggle('hidden', view !== 'empty');
    this.els.songView.classList.toggle('hidden', view !== 'song');
    this.els.songEditor.classList.toggle('hidden', view !== 'editor');

    // Stop scrolling when leaving song view
    if (view !== 'song' && this.isScrolling) {
      this.toggleScroll();
    }
  },

  // Media functions
  searchYoutube() {
    if (!this.currentSong) return;
    const query = encodeURIComponent(`${this.currentSong.artist} ${this.currentSong.title}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  },

  searchSpotify() {
    if (!this.currentSong) return;
    const query = encodeURIComponent(`${this.currentSong.artist} ${this.currentSong.title}`);
    window.open(`https://open.spotify.com/search/${query}`, '_blank');
  },

  saveYoutubeFromInput() {
    const url = this.els.youtubeUrlInput.value.trim();
    if (!url) return;

    const videoId = this.extractYoutubeId(url);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    this.showYoutubePlayer(videoId);
    this.saveYoutubeUrl(url);
  },

  saveSpotifyFromInput() {
    const url = this.els.spotifyUrlInput.value.trim();
    if (!url) return;

    this.saveSpotifyUrl(url);
  },

  openSpotifyLink() {
    const url = this.els.spotifyUrlInput.value.trim();
    if (url) {
      window.open(url, '_blank');
    }
  },

  async saveSpotifyUrl(url) {
    if (!this.currentSong) return;

    try {
      await fetch(`/api/songs/${this.currentSong.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_url: url })
      });
      this.currentSong.spotify_url = url;
    } catch (err) {
      console.error('Failed to save Spotify URL:', err);
    }
  },

  embedYoutube() {
    const url = this.els.youtubeUrlInput.value.trim();
    if (!url) return;

    const videoId = this.extractYoutubeId(url);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    this.showYoutubePlayer(videoId);
    this.saveYoutubeUrl(url);
  },

  extractYoutubeId(url) {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Just the ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  showYoutubePlayer(videoId) {
    this.els.youtubePlayer.innerHTML = `
      <div class="video-controls">
        <button class="video-btn" onclick="window.open('https://youtube.com/watch?v=${videoId}', '_blank')" title="Open in YouTube">↗</button>
        <button class="video-btn" onclick="App.removeYoutubePlayer()" title="Close">✕</button>
      </div>
      <iframe
        src="https://www.youtube.com/embed/${videoId}?rel=0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    `;
    this.els.youtubePlayer.classList.remove('hidden');
  },

  removeYoutubePlayer() {
    this.els.youtubePlayer.innerHTML = '';
    this.els.youtubePlayer.classList.add('hidden');
    this.saveYoutubeUrl(null);
    this.els.youtubeUrlInput.value = '';
  },

  async saveYoutubeUrl(url) {
    if (!this.currentSong) return;

    try {
      await fetch(`/api/songs/${this.currentSong.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url })
      });
      this.currentSong.youtube_url = url;
    } catch (err) {
      console.error('Failed to save YouTube URL:', err);
    }
  },

  renderMediaPlayer() {
    // Populate saved URLs in inputs
    this.els.youtubeUrlInput.value = this.currentSong?.youtube_url || '';
    this.els.spotifyUrlInput.value = this.currentSong?.spotify_url || '';

    // Show saved YouTube video if exists
    if (this.currentSong?.youtube_url) {
      const videoId = this.extractYoutubeId(this.currentSong.youtube_url);
      if (videoId) {
        this.showYoutubePlayer(videoId);
        return;
      }
    }
    // Otherwise hide player
    this.els.youtubePlayer.innerHTML = '';
    this.els.youtubePlayer.classList.add('hidden');
  },

  // Import modal
  showImportModal() {
    this.els.importUrl.value = '';
    this.els.importError.classList.add('hidden');
    this.els.importSuccess.classList.add('hidden');
    this.els.importLoading.classList.add('hidden');
    this.els.importModal.classList.remove('hidden');
    this.els.importUrl.focus();
  },

  hideImportModal() {
    this.els.importModal.classList.add('hidden');
  },

  async doImport() {
    const url = this.els.importUrl.value.trim();
    if (!url) {
      this.els.importError.textContent = 'Please enter a URL';
      this.els.importError.classList.remove('hidden');
      return;
    }

    // Show loading
    this.els.importError.classList.add('hidden');
    this.els.importSuccess.classList.add('hidden');
    this.els.importLoading.classList.remove('hidden');
    this.els.doImport.disabled = true;

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      // Success - save the song
      const saveResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          artist: data.artist,
          content: data.content,
          source_url: data.source_url,
          strummings: data.strummings
        })
      });

      const song = await saveResponse.json();

      // Update UI
      this.songs.unshift(song);
      this.renderSongList();
      this.selectSong(song.id);

      // Show success and keep modal open for next import
      this.els.importSuccess.classList.remove('hidden');
      this.els.importUrl.value = '';
      this.els.importUrl.focus();

    } catch (err) {
      this.els.importError.textContent = err.message;
      this.els.importError.classList.remove('hidden');
    } finally {
      this.els.importLoading.classList.add('hidden');
      this.els.doImport.disabled = false;
    }
  },

  // Theme handling
  loadTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    document.documentElement.dataset.theme = theme;
    this.els.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    this.els.themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  },

  // Keyboard shortcuts
  handleKeyboard(e) {
    // Don't interfere with input fields
    if (e.target.matches('input, textarea')) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (this.currentSong) this.toggleScroll();
        break;
      case 'ArrowUp':
        if (e.shiftKey) {
          e.preventDefault();
          this.transpose(1);
        }
        break;
      case 'ArrowDown':
        if (e.shiftKey) {
          e.preventDefault();
          this.transpose(-1);
        }
        break;
      case 'Escape':
        if (!document.getElementById('users-modal').classList.contains('hidden')) {
          this.hideUsersModal();
        } else if (!this.els.songEditor.classList.contains('hidden')) {
          this.hideEditor();
        }
        break;
    }
  },

  // Mobile sidebar
  toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    this.els.sidebarOverlay.classList.toggle('hidden');
  },

  closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    this.els.sidebarOverlay.classList.add('hidden');
  },

  // Role-based UI
  applyRoleUI() {
    const role = this.user.role;
    const canEdit = (role === 'moderator' || role === 'admin');
    const isAdmin = (role === 'admin');

    // Hide add/import buttons for readonly
    this.els.addSongBtn.classList.toggle('hidden', !canEdit);
    this.els.importBtn.classList.toggle('hidden', !canEdit);

    // Hide song action buttons for readonly
    this.els.favoriteBtn.classList.toggle('hidden', !canEdit);
    this.els.editBtn.classList.toggle('hidden', !canEdit);
    this.els.deleteBtn.classList.toggle('hidden', !canEdit);

    // Show Manage Users for admin
    const manageUsersBtn = document.getElementById('manage-users-btn');
    manageUsersBtn.classList.toggle('hidden', !isAdmin);
  },

  // Admin panel
  showUsersModal() {
    const modal = document.getElementById('users-modal');
    modal.classList.remove('hidden');
    document.getElementById('users-error').classList.add('hidden');
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-role').value = 'readonly';
    this.loadUsers();
  },

  hideUsersModal() {
    document.getElementById('users-modal').classList.add('hidden');
  },

  async loadUsers() {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to load users');
      this.managedUsers = await response.json();
      this.renderUsers();
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  },

  renderUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = '';

    for (const user of this.managedUsers) {
      const isSelf = user.email === this.user.email;
      const row = document.createElement('div');
      row.className = 'user-row';
      row.innerHTML = `
        <div class="user-row-info">
          <div class="user-row-email">${this.escapeHtml(user.email)}${isSelf ? ' <span class="user-row-you">(you)</span>' : ''}</div>
          <div class="user-row-name">${this.escapeHtml(user.name || '')}</div>
        </div>
        <div class="user-row-role">
          <select data-user-id="${user.id}" ${isSelf ? 'disabled' : ''}>
            <option value="readonly" ${user.role === 'readonly' ? 'selected' : ''}>Read Only</option>
            <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        ${!isSelf ? `<button class="user-row-delete" data-user-id="${user.id}" title="Remove user">&times;</button>` : ''}
      `;

      // Bind role change
      const select = row.querySelector('select');
      if (!isSelf) {
        select.addEventListener('change', () => this.updateUserRole(user.id, select.value));
      }

      // Bind delete
      const deleteBtn = row.querySelector('.user-row-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.deleteUserById(user.id, user.email));
      }

      list.appendChild(row);
    }
  },

  async addUser() {
    const email = document.getElementById('new-user-email').value.trim();
    const name = document.getElementById('new-user-name').value.trim();
    const role = document.getElementById('new-user-role').value;
    const errorEl = document.getElementById('users-error');

    if (!email) {
      errorEl.textContent = 'Email is required';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      document.getElementById('new-user-email').value = '';
      document.getElementById('new-user-name').value = '';
      document.getElementById('new-user-role').value = 'readonly';
      this.loadUsers();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  },

  async updateUserRole(userId, newRole) {
    const errorEl = document.getElementById('users-error');
    errorEl.classList.add('hidden');

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      this.loadUsers();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      this.loadUsers();
    }
  },

  async deleteUserById(userId, email) {
    if (!confirm(`Remove ${email} from ChordStash?`)) return;

    const errorEl = document.getElementById('users-error');
    errorEl.classList.add('hidden');

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      this.loadUsers();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    }
  },

  // Utility
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Debounce utility
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());
