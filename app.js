/* ==========================================================================
   NADHAM - APPLICATION CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize State
  const state = {
    apiBaseUrl: localStorage.getItem('padal_api_url') || 'https://saavn.sumit.co',
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    shuffle: false,
    loop: 'none', // 'none' | 'one' | 'all'
    favorites: JSON.parse(localStorage.getItem('padal_favorites')) || [],
    playlists: JSON.parse(localStorage.getItem('padal_playlists')) || {},
    selectedLanguage: localStorage.getItem('padal_language') || 'tamil',
    streamingQuality: localStorage.getItem('padal_quality') || '320kbps',
    currentView: 'home',
    activeAlbumId: null,
    activePlaylistId: null,
    songToAddToPlaylist: null
  };

  // Migrate older config if present
  if (state.apiBaseUrl.includes('saavn.dev')) {
    state.apiBaseUrl = 'https://saavn.sumit.co';
    localStorage.setItem('padal_api_url', state.apiBaseUrl);
  }

  // Audio Object
  const audio = document.getElementById('main-audio-element');

  // DOM Elements
  const DOM = {
    // Nav & Sidebar
    navItems: document.querySelectorAll('.nav-item'),
    sidebarPlaylists: document.getElementById('sidebar-playlist-list'),
    btnCreatePlaylistShortcut: document.getElementById('btn-create-playlist-shortcut'),
    btnSettingsToggle: document.getElementById('btn-settings-toggle'),

    // Views
    viewHome: document.getElementById('view-home'),
    viewSearch: document.getElementById('view-search-view'),
    viewFavorites: document.getElementById('view-favorites'),
    viewPlaylists: document.getElementById('view-playlists'),
    viewPlaylistDetail: document.getElementById('view-playlist-detail'),
    viewAlbumDetail: document.getElementById('view-album-detail'),

    // Header Controls
    globalSearch: document.getElementById('global-search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    langChips: document.querySelectorAll('.lang-chip'),

    // Home View Components
    trendingTamilGrid: document.getElementById('trending-tamil-songs'),
    recommendedGrid: document.getElementById('recommended-songs'),
    btnHeroPlay: document.getElementById('btn-hero-play'),
    btnHeroExplore: document.getElementById('btn-hero-explore'),
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),

    // Search Results Panels
    songsSearchResults: document.getElementById('songs-search-results'),
    albumsSearchResults: document.getElementById('albums-search-results'),
    playlistsSearchResults: document.getElementById('playlists-search-results'),
    searchQueryTitle: document.getElementById('search-query-title'),
    searchFilterTabs: document.querySelectorAll('.filter-tab'),
    searchWelcomeState: document.getElementById('search-welcome-state'),
    searchResultsWrapper: document.getElementById('search-results-wrapper'),

    // Favorites View Components
    favoritesSongsList: document.getElementById('favorites-songs-list'),
    favoritesEmptyState: document.getElementById('favorites-empty-state'),
    favCountText: document.getElementById('fav-count-text'),

    // Playlists View Components
    playlistsContainer: document.getElementById('playlists-container'),
    playlistsEmptyState: document.getElementById('playlists-empty-state'),
    btnCreatePlaylist: document.getElementById('btn-create-playlist'),

    // Playlist Details View Components
    playlistDetailTitle: document.getElementById('playlist-detail-title'),
    playlistDetailCount: document.getElementById('playlist-detail-count'),
    playlistSongsList: document.getElementById('playlist-songs-list'),
    playlistEmptyState: document.getElementById('playlist-detail-empty-state'),
    btnDeletePlaylist: document.getElementById('btn-delete-playlist'),
    btnPlaylistPlayAll: document.getElementById('btn-playlist-play-all'),

    // Album Details View Components
    albumDetailTitle: document.getElementById('album-detail-title'),
    albumDetailArtists: document.getElementById('album-detail-artists'),
    albumDetailYear: document.getElementById('album-detail-year'),
    albumDetailCount: document.getElementById('album-detail-count'),
    albumDetailImage: document.getElementById('album-detail-image'),
    albumSongsList: document.getElementById('album-songs-list'),
    btnAlbumPlayAll: document.getElementById('btn-album-play-all'),

    // Right Drawer Panels
    rightPanelDrawer: document.getElementById('right-panel-drawer'),
    rightPanelTitle: document.getElementById('right-panel-title'),
    btnCloseRightPanel: document.getElementById('btn-close-right-panel'),
    rightQueuePane: document.getElementById('right-panel-queue'),
    rightLyricsPane: document.getElementById('right-panel-lyrics'),
    queueItemsList: document.getElementById('queue-items-list'),
    queueSongsCount: document.getElementById('queue-songs-count'),
    btnClearQueue: document.getElementById('btn-clear-queue'),
    lyricsTextContainer: document.getElementById('lyrics-text-container'),
    lyricsCopyright: document.getElementById('lyrics-copyright'),

    // Bottom Player Bar
    playerTrackImg: document.getElementById('player-track-img'),
    playerTrackTitle: document.getElementById('player-track-title'),
    playerTrackArtist: document.getElementById('player-track-artist'),
    playerBtnFav: document.getElementById('player-btn-fav'),
    playerBtnShuffle: document.getElementById('player-btn-shuffle'),
    playerBtnPrev: document.getElementById('player-btn-prev'),
    playerBtnPlayPause: document.getElementById('player-btn-play-pause'),
    playerBtnNext: document.getElementById('player-btn-next'),
    playerBtnLoop: document.getElementById('player-btn-loop'),
    playerBtnLyrics: document.getElementById('player-btn-lyrics'),
    playerBtnQueue: document.getElementById('player-btn-queue'),
    playerBtnQuality: document.getElementById('player-btn-quality'),
    qualityDropdownMenu: document.getElementById('quality-dropdown-menu'),
    playerBtnMute: document.getElementById('player-btn-mute'),
    volumeIcon: document.getElementById('volume-icon'),
    volumeSlider: document.getElementById('volume-slider'),
    playerTimeCurrent: document.getElementById('player-time-current'),
    playerTimeTotal: document.getElementById('player-time-total'),
    playerProgressContainer: document.getElementById('player-progress-container'),
    playerProgressFill: document.getElementById('player-progress-fill'),
    playerProgressHandle: document.getElementById('player-progress-handle'),
    trackInfoWrapper: document.querySelector('.player-track-info'),

    // Modals & Popups
    playlistPickerModal: document.getElementById('playlist-picker-modal'),
    playlistPickerList: document.getElementById('playlist-picker-list'),
    newPlaylistModalName: document.getElementById('new-playlist-modal-name'),
    btnCreatePlaylistModal: document.getElementById('btn-create-playlist-modal'),
    settingsModal: document.getElementById('settings-modal'),
    settingsApiUrl: document.getElementById('settings-api-url'),
    btnSettingsSave: document.getElementById('btn-settings-save'),
    btnSettingsReset: document.getElementById('btn-settings-reset'),
    toastContainer: document.getElementById('toast-container')
  };

  // Safe Property Fetchers
  function getSongTitle(song) {
    if (!song) return 'No Song Playing';
    return song.name || song.title || 'Untitled Song';
  }

  function getSongArtist(song) {
    if (!song) return 'Unknown Artist';
    if (song.primaryArtists) return song.primaryArtists;
    if (song.artists) {
      if (Array.isArray(song.artists.primary)) return song.artists.primary.map(a => a.name).join(', ');
      if (Array.isArray(song.artists.all)) return song.artists.all.map(a => a.name).join(', ');
      if (typeof song.artists === 'string') return song.artists;
    }
    return song.artist || song.subtitle || 'Unknown Artist';
  }

  function getSongImage(song) {
    if (!song) return 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80';
    if (Array.isArray(song.image)) {
      return song.image[song.image.length - 1]?.url || song.image[song.image.length - 1]?.link || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80';
    }
    if (typeof song.image === 'string') return song.image;
    return 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80';
  }

  function getSongUrl(song, preferredQuality = '320kbps') {
    if (!song) return '';
    if (Array.isArray(song.downloadUrl)) {
      const found = song.downloadUrl.find(d => d.quality === preferredQuality);
      if (found) return found.url || found.link;
      return song.downloadUrl[song.downloadUrl.length - 1]?.url || song.downloadUrl[song.downloadUrl.length - 1]?.link || '';
    }
    return song.downloadUrl || song.mediaUrl || '';
  }

  function getAlbumTitle(song) {
    if (!song) return '';
    if (song.album) {
      if (typeof song.album === 'object') return song.album.name || 'Single';
      return song.album;
    }
    return song.albumName || 'Single';
  }

  // Toast System
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  // API Methods
  async function apiFetch(endpoint) {
    const cleanBase = state.apiBaseUrl.replace(/\/+$/, '');
    const finalUrl = `${cleanBase}${endpoint}`;
    try {
      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(`API Failure (${finalUrl}):`, error);
      // Automatically attempt fallback if using saavn.dev
      if (state.apiBaseUrl.includes('saavn.dev')) {
        console.warn('Switching to fallback api server: saavn.sumit.co');
        state.apiBaseUrl = 'https://saavn.sumit.co';
        localStorage.setItem('padal_api_url', state.apiBaseUrl);
        return apiFetch(endpoint);
      }
      showToast(`Connection failed. Please check Settings.`);
      throw error;
    }
  }

  // View Navigation
  function switchView(viewName) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    DOM.navItems.forEach(item => item.classList.remove('active'));
    
    state.currentView = viewName;
    
    // Set active link in sidebar
    const activeLink = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Show View
    if (viewName === 'home') {
      DOM.viewHome.classList.add('active');
    } else if (viewName === 'search-view') {
      DOM.viewSearch.classList.add('active');
      DOM.globalSearch.focus();
      const q = DOM.globalSearch.value.trim();
      if (q.length === 0) {
        DOM.searchWelcomeState.style.display = 'flex';
        DOM.searchResultsWrapper.style.display = 'none';
      } else {
        DOM.searchWelcomeState.style.display = 'none';
        DOM.searchResultsWrapper.style.display = 'block';
      }
    } else if (viewName === 'favorites') {
      renderFavoritesView();
      DOM.viewFavorites.classList.add('active');
    } else if (viewName === 'playlists') {
      renderPlaylistsView();
      DOM.viewPlaylists.classList.add('active');
    } else if (viewName === 'playlist-detail') {
      renderPlaylistDetailView(state.activePlaylistId);
      DOM.viewPlaylistDetail.classList.add('active');
    } else if (viewName === 'album-detail') {
      renderAlbumDetailView(state.activeAlbumId);
      DOM.viewAlbumDetail.classList.add('active');
    }
  }

  // ==========================================================================
  // VIEW RENDERERS
  // ==========================================================================

  // Populate Home View
  async function loadHomeContent() {
    DOM.trendingTamilGrid.innerHTML = '<div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div>';
    DOM.recommendedGrid.innerHTML = '<div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div><div class="card-skeleton"></div>';

    try {
      // Dynamic queries based on chosen language
      const langQuery = state.selectedLanguage;
      DOM.heroTitle.textContent = `Discover the Best ${langQuery.charAt(0).toUpperCase() + langQuery.slice(1)} Hits`;
      
      const trendingSongs = await apiFetch(`/api/search/songs?query=${encodeURIComponent(langQuery + ' trending')}&limit=10`);
      const recommendedSongs = await apiFetch(`/api/search/songs?query=${encodeURIComponent(langQuery + ' melody')}&limit=10`);
      
      renderSongGrid(DOM.trendingTamilGrid, trendingSongs.results || trendingSongs);
      renderSongGrid(DOM.recommendedGrid, recommendedSongs.results || recommendedSongs);
      
      // Hook Play Mix button
      DOM.btnHeroPlay.onclick = () => {
        const mix = trendingSongs.results || trendingSongs;
        if (mix && mix.length > 0) {
          playSongsImmediate(mix);
          showToast(`Playing ${state.selectedLanguage} trending mix!`);
        }
      };
    } catch (e) {
      DOM.trendingTamilGrid.innerHTML = '<p class="error-text">Failed to load trending content</p>';
      DOM.recommendedGrid.innerHTML = '<p class="error-text">Failed to load recommendations</p>';
    }
  }

  function renderSongGrid(container, songs) {
    container.innerHTML = '';
    if (!songs || songs.length === 0) {
      container.innerHTML = '<p class="empty-text">No songs found</p>';
      return;
    }
    songs.slice(0, 8).forEach(song => {
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <div class="card-img-wrapper">
          <img src="${getSongImage(song)}" alt="${getSongTitle(song)}" class="card-img">
          <button class="card-play-btn">
            <i data-lucide="play"></i>
          </button>
        </div>
        <div class="card-info">
          <h4>${getSongTitle(song)}</h4>
          <p>${getSongArtist(song)}</p>
        </div>
      `;
      card.querySelector('.card-play-btn').onclick = (e) => {
        e.stopPropagation();
        playSongNow(song);
      };
      card.onclick = () => {
        if (song.album && song.album.id) {
          state.activeAlbumId = song.album.id;
          switchView('album-detail');
        } else {
          playSongNow(song);
        }
      };
      container.appendChild(card);
    });
    lucide.createIcons();
  }

  // Render Album Detail
  async function renderAlbumDetailView(albumId) {
    DOM.albumSongsList.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading album tracks...</td></tr>';
    try {
      const album = await apiFetch(`/api/albums?id=${albumId}`);
      DOM.albumDetailTitle.textContent = album.name || album.title;
      DOM.albumDetailArtists.textContent = album.primaryArtists || album.artist || 'Various Artists';
      DOM.albumDetailYear.textContent = album.year || '2026';
      DOM.albumDetailCount.textContent = `${album.songs?.length || 0} Songs`;
      DOM.albumDetailImage.src = getSongImage(album);

      DOM.albumSongsList.innerHTML = '';
      const tracks = album.songs || [];
      tracks.forEach((track, idx) => {
        const row = document.createElement('tr');
        row.className = 'song-row';
        if (state.currentSong && state.currentSong.id === track.id) {
          row.classList.add('active');
        }
        row.innerHTML = `
          <td class="col-index">${idx + 1}</td>
          <td class="col-title">
            <div class="table-song-details">
              <h4>${getSongTitle(track)}</h4>
              <p>${getSongArtist(track)}</p>
            </div>
          </td>
          <td class="col-actions">
            <button class="row-action-btn fav-btn" title="Add to Favorites">
              <i data-lucide="heart"></i>
            </button>
            <button class="row-action-btn add-btn" title="Add to Playlist">
              <i data-lucide="plus"></i>
            </button>
            <button class="row-action-btn queue-btn" title="Add to Queue">
              <i data-lucide="list-plus"></i>
            </button>
          </td>
        `;
        // Events
        row.querySelector('.fav-btn').onclick = (e) => {
          e.stopPropagation();
          toggleFavorite(track, e.currentTarget);
        };
        row.querySelector('.add-btn').onclick = (e) => {
          e.stopPropagation();
          openPlaylistPicker(track);
        };
        row.querySelector('.queue-btn').onclick = (e) => {
          e.stopPropagation();
          addToQueue(track);
        };
        row.onclick = () => playSongNow(track);
        DOM.albumSongsList.appendChild(row);
      });

      DOM.btnAlbumPlayAll.onclick = () => {
        if (tracks.length > 0) playSongsImmediate(tracks);
      };

      lucide.createIcons();
      updateFavIconsInTable(DOM.albumSongsList);
    } catch (e) {
      DOM.albumSongsList.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Failed to load album tracks.</td></tr>';
    }
  }

  // Render Favorites View
  function renderFavoritesView() {
    DOM.favoritesSongsList.innerHTML = '';
    if (state.favorites.length === 0) {
      DOM.favoritesEmptyState.classList.add('active');
      DOM.favCountText.textContent = '0 songs';
      return;
    }
    DOM.favoritesEmptyState.classList.remove('active');
    DOM.favCountText.textContent = `${state.favorites.length} song${state.favorites.length > 1 ? 's' : ''}`;

    state.favorites.forEach((song, idx) => {
      const row = document.createElement('tr');
      row.className = 'song-row';
      row.innerHTML = `
        <td class="col-index">${idx + 1}</td>
        <td class="col-title">
          <img src="${getSongImage(song)}" alt="" class="table-song-art">
          <div class="table-song-details">
            <h4>${getSongTitle(song)}</h4>
            <p>${getSongArtist(song)}</p>
          </div>
        </td>
        <td class="col-album">${getAlbumTitle(song)}</td>
        <td class="col-actions">
          <button class="row-action-btn active fav-btn" title="Remove Favorite">
            <i data-lucide="heart"></i>
          </button>
          <button class="row-action-btn add-btn" title="Add to Playlist">
            <i data-lucide="plus"></i>
          </button>
          <button class="row-action-btn queue-btn" title="Add to Queue">
            <i data-lucide="list-plus"></i>
          </button>
        </td>
      `;
      row.querySelector('.fav-btn').onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(song);
        renderFavoritesView();
      };
      row.querySelector('.add-btn').onclick = (e) => {
        e.stopPropagation();
        openPlaylistPicker(song);
      };
      row.querySelector('.queue-btn').onclick = (e) => {
        e.stopPropagation();
        addToQueue(song);
      };
      row.onclick = () => playSongNow(song);
      DOM.favoritesSongsList.appendChild(row);
    });
    lucide.createIcons();
  }

  // Render Playlists View
  function renderPlaylistsView() {
    DOM.playlistsContainer.innerHTML = '';
    const keys = Object.keys(state.playlists);
    if (keys.length === 0) {
      DOM.playlistsEmptyState.classList.add('active');
      return;
    }
    DOM.playlistsEmptyState.classList.remove('active');

    keys.forEach(key => {
      const playlist = state.playlists[key];
      const card = document.createElement('div');
      card.className = 'music-card';
      card.innerHTML = `
        <div class="card-img-wrapper playlist-icon-bg" style="display:flex; align-items:center; justify-content:center;">
          <i data-lucide="music-2" style="width:50px; height:50px; color:white;"></i>
        </div>
        <div class="card-info">
          <h4>${key}</h4>
          <p>${playlist.length} song${playlist.length > 1 ? 's' : ''}</p>
        </div>
      `;
      card.onclick = () => {
        state.activePlaylistId = key;
        switchView('playlist-detail');
      };
      DOM.playlistsContainer.appendChild(card);
    });
    lucide.createIcons();
  }

  // Render Playlist Detail View
  function renderPlaylistDetailView(playlistName) {
    DOM.playlistDetailTitle.textContent = playlistName;
    DOM.playlistSongsList.innerHTML = '';
    const list = state.playlists[playlistName] || [];
    DOM.playlistDetailCount.textContent = `${list.length} song${list.length !== 1 ? 's' : ''}`;

    if (list.length === 0) {
      DOM.playlistEmptyState.classList.add('active');
      return;
    }
    DOM.playlistEmptyState.classList.remove('active');

    list.forEach((song, idx) => {
      const row = document.createElement('tr');
      row.className = 'song-row';
      row.innerHTML = `
        <td class="col-index">${idx + 1}</td>
        <td class="col-title">
          <img src="${getSongImage(song)}" alt="" class="table-song-art">
          <div class="table-song-details">
            <h4>${getSongTitle(song)}</h4>
            <p>${getSongArtist(song)}</p>
          </div>
        </td>
        <td class="col-album">${getAlbumTitle(song)}</td>
        <td class="col-actions">
          <button class="row-action-btn fav-btn" title="Add to Favorites">
            <i data-lucide="heart"></i>
          </button>
          <button class="row-action-btn remove-btn" title="Remove from Playlist">
            <i data-lucide="trash-2"></i>
          </button>
          <button class="row-action-btn queue-btn" title="Add to Queue">
            <i data-lucide="list-plus"></i>
          </button>
        </td>
      `;
      row.querySelector('.fav-btn').onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(song, e.currentTarget);
      };
      row.querySelector('.remove-btn').onclick = (e) => {
        e.stopPropagation();
        removeSongFromPlaylist(playlistName, idx);
      };
      row.querySelector('.queue-btn').onclick = (e) => {
        e.stopPropagation();
        addToQueue(song);
      };
      row.onclick = () => playSongNow(song);
      DOM.playlistSongsList.appendChild(row);
    });

    DOM.btnDeletePlaylist.style.display = 'flex';
    DOM.btnPlaylistPlayAll.style.display = 'flex';
    DOM.btnPlaylistPlayAll.onclick = () => {
      if (list.length > 0) {
        playSongsImmediate(list);
        showToast(`Playing playlist "${playlistName}"!`);
      } else {
        showToast('Playlist is empty.');
      }
    };

    DOM.btnDeletePlaylist.onclick = () => {
      if (confirm(`Are you sure you want to delete "${playlistName}"?`)) {
        delete state.playlists[playlistName];
        localStorage.setItem('padal_playlists', JSON.stringify(state.playlists));
        showToast(`Playlist "${playlistName}" deleted.`);
        renderSidebarPlaylists();
        switchView('playlists');
      }
    };

    lucide.createIcons();
    updateFavIconsInTable(DOM.playlistSongsList);
  }

  // ==========================================================================
  // PLAYBACK SYSTEM
  // ==========================================================================

  function playSongNow(song) {
    // Add to queue if not present, and play
    const qIdx = state.queue.findIndex(item => item.id === song.id);
    if (qIdx !== -1) {
      state.currentIndex = qIdx;
    } else {
      state.queue.splice(state.currentIndex + 1, 0, song);
      state.currentIndex += 1;
    }
    loadAudio(song);
    renderQueueList();
  }

  function playSongsImmediate(songsList) {
    state.queue = [...songsList];
    state.currentIndex = 0;
    loadAudio(state.queue[0]);
    renderQueueList();
  }

  function loadAudio(song) {
    if (!song) return;
    state.currentSong = song;
    
    // Set Audio source URL
    const url = getSongUrl(song, state.streamingQuality);
    if (!url) {
      showToast('Audio URL not available.');
      return;
    }
    audio.src = url;
    
    // Update player UI metadata
    DOM.playerTrackImg.src = getSongImage(song);
    DOM.playerTrackTitle.textContent = getSongTitle(song);
    DOM.playerTrackArtist.textContent = getSongArtist(song);
    
    // Set active playing state class for vinyl rotation
    DOM.trackInfoWrapper.classList.add('playing');
    
    audio.play()
      .then(() => {
        state.isPlaying = true;
        updatePlayerControlsUI();
      })
      .catch(err => {
        console.error('Audio play failed:', err);
        showToast('Playback failed. Trying medium quality...');
        // Retry with a lower quality fallback
        const fallbackUrl = getSongUrl(song, '96kbps');
        if (fallbackUrl && fallbackUrl !== url) {
          audio.src = fallbackUrl;
          audio.play().then(() => {
            state.isPlaying = true;
            updatePlayerControlsUI();
          });
        }
      });

    // Check favorites heart icon
    const isFav = state.favorites.some(f => f.id === song.id);
    DOM.playerBtnFav.classList.toggle('active', isFav);
    DOM.playerBtnFav.querySelector('i').setAttribute('data-lucide', isFav ? 'heart-handshake' : 'heart');
    
    // Highlights playing row in lists
    document.querySelectorAll('.song-row').forEach(row => row.classList.remove('active'));

    // Automatically load lyrics in background or if panel is active
    if (DOM.rightPanelDrawer.classList.contains('active') && DOM.rightLyricsPane.classList.contains('active')) {
      fetchAndRenderLyrics(song.id);
    }
    lucide.createIcons();
  }

  function updatePlayerControlsUI() {
    if (state.isPlaying) {
      DOM.playerBtnPlayPause.querySelector('.play-icon').style.display = 'none';
      DOM.playerBtnPlayPause.querySelector('.pause-icon').style.display = 'block';
      DOM.trackInfoWrapper.classList.add('playing');
    } else {
      DOM.playerBtnPlayPause.querySelector('.play-icon').style.display = 'block';
      DOM.playerBtnPlayPause.querySelector('.pause-icon').style.display = 'none';
      DOM.trackInfoWrapper.classList.remove('playing');
    }
  }

  function togglePlayPause() {
    if (!state.currentSong) return;
    if (state.isPlaying) {
      audio.pause();
      state.isPlaying = false;
    } else {
      audio.play();
      state.isPlaying = true;
    }
    updatePlayerControlsUI();
  }

  function playNext() {
    if (state.queue.length === 0) return;
    if (state.loop === 'one') {
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (state.shuffle) {
      state.currentIndex = Math.floor(Math.random() * state.queue.length);
    } else {
      state.currentIndex++;
      if (state.currentIndex >= state.queue.length) {
        if (state.loop === 'all') {
          state.currentIndex = 0;
        } else {
          state.currentIndex = state.queue.length - 1;
          state.isPlaying = false;
          updatePlayerControlsUI();
          return;
        }
      }
    }
    loadAudio(state.queue[state.currentIndex]);
    renderQueueList();
  }

  function playPrev() {
    if (state.queue.length === 0) return;
    state.currentIndex--;
    if (state.currentIndex < 0) {
      if (state.loop === 'all') {
        state.currentIndex = state.queue.length - 1;
      } else {
        state.currentIndex = 0;
      }
    }
    loadAudio(state.queue[state.currentIndex]);
    renderQueueList();
  }

  // Audio Event Listeners
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      DOM.playerProgressFill.style.width = `${pct}%`;
      DOM.playerProgressHandle.style.left = `${pct}%`;
      DOM.playerTimeCurrent.textContent = formatTime(audio.currentTime);
      DOM.playerTimeTotal.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('ended', () => {
    playNext();
  });

  DOM.playerProgressContainer.onclick = (e) => {
    if (audio.duration) {
      const rect = DOM.playerProgressContainer.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    }
  };

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Volume
  DOM.volumeSlider.oninput = (e) => {
    const vol = e.target.value;
    audio.volume = vol / 100;
    updateVolumeIcon(vol);
  };

  DOM.playerBtnMute.onclick = () => {
    if (audio.muted) {
      audio.muted = false;
      updateVolumeIcon(DOM.volumeSlider.value);
    } else {
      audio.muted = true;
      DOM.volumeIcon.setAttribute('data-lucide', 'volume-x');
      lucide.createIcons();
    }
  };

  function updateVolumeIcon(vol) {
    audio.muted = false;
    let iconName = 'volume-2';
    if (vol == 0) iconName = 'volume-x';
    else if (vol < 40) iconName = 'volume';
    else if (vol < 70) iconName = 'volume-1';
    DOM.volumeIcon.setAttribute('data-lucide', iconName);
    lucide.createIcons();
  }

  // Playback modifiers
  DOM.playerBtnShuffle.onclick = () => {
    state.shuffle = !state.shuffle;
    DOM.playerBtnShuffle.classList.toggle('active', state.shuffle);
    showToast(state.shuffle ? 'Shuffle Mode On' : 'Shuffle Mode Off');
  };

  DOM.playerBtnLoop.onclick = () => {
    if (state.loop === 'none') {
      state.loop = 'all';
      DOM.playerBtnLoop.classList.add('active');
      DOM.playerBtnLoop.title = 'Loop All';
      showToast('Loop Playlist Enabled');
    } else if (state.loop === 'all') {
      state.loop = 'one';
      DOM.playerBtnLoop.classList.add('active');
      DOM.playerBtnLoop.querySelector('i').setAttribute('data-lucide', 'repeat-1');
      DOM.playerBtnLoop.title = 'Loop One';
      showToast('Loop Song Enabled');
    } else {
      state.loop = 'none';
      DOM.playerBtnLoop.classList.remove('active');
      DOM.playerBtnLoop.querySelector('i').setAttribute('data-lucide', 'repeat');
      DOM.playerBtnLoop.title = 'Loop Off';
      showToast('Loop Mode Disabled');
    }
    lucide.createIcons();
  };

  // ==========================================================================
  // SEARCH LOGIC
  // ==========================================================================
  let searchTimeout = null;
  DOM.globalSearch.oninput = (e) => {
    const q = e.target.value.trim();
    if (q.length > 0) {
      DOM.btnClearSearch.style.display = 'flex';
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => runSearch(q), 500);
    } else {
      DOM.btnClearSearch.style.display = 'none';
      switchView('home');
    }
  };

  DOM.btnClearSearch.onclick = () => {
    DOM.globalSearch.value = '';
    DOM.btnClearSearch.style.display = 'none';
    switchView('home');
  };

  async function runSearch(query) {
    switchView('search-view');
    DOM.searchWelcomeState.style.display = 'none';
    DOM.searchResultsWrapper.style.display = 'block';
    DOM.searchQueryTitle.textContent = `Search results for "${query}"`;
    
    // Render loading rows
    DOM.songsSearchResults.innerHTML = '<tr><td colspan="4" style="text-align:center;">Searching songs...</td></tr>';
    DOM.albumsSearchResults.innerHTML = '<div class="card-skeleton"></div><div class="card-skeleton"></div>';
    DOM.playlistsSearchResults.innerHTML = '<div class="card-skeleton"></div><div class="card-skeleton"></div>';

    try {
      const data = await apiFetch(`/api/search/songs?query=${encodeURIComponent(query)}`);
      const results = data.results || data;
      
      DOM.songsSearchResults.innerHTML = '';
      if (!results || results.length === 0) {
        DOM.songsSearchResults.innerHTML = '<tr><td colspan="4" style="text-align:center;">No songs found.</td></tr>';
      } else {
        results.forEach((song, idx) => {
          const row = document.createElement('tr');
          row.className = 'song-row';
          row.innerHTML = `
            <td class="col-index">${idx + 1}</td>
            <td class="col-title">
              <img src="${getSongImage(song)}" alt="" class="table-song-art">
              <div class="table-song-details">
                <h4>${getSongTitle(song)}</h4>
                <p>${getSongArtist(song)}</p>
              </div>
            </td>
            <td class="col-album">${getAlbumTitle(song)}</td>
            <td class="col-actions">
              <button class="row-action-btn fav-btn" title="Add to Favorites">
                <i data-lucide="heart"></i>
              </button>
              <button class="row-action-btn add-btn" title="Add to Playlist">
                <i data-lucide="plus"></i>
              </button>
              <button class="row-action-btn queue-btn" title="Add to Queue">
                <i data-lucide="list-plus"></i>
              </button>
            </td>
          `;
          row.querySelector('.fav-btn').onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(song, e.currentTarget);
          };
          row.querySelector('.add-btn').onclick = (e) => {
            e.stopPropagation();
            openPlaylistPicker(song);
          };
          row.querySelector('.queue-btn').onclick = (e) => {
            e.stopPropagation();
            addToQueue(song);
          };
          row.onclick = () => playSongNow(song);
          DOM.songsSearchResults.appendChild(row);
        });
      }

      // Albums search
      const albumData = await apiFetch(`/api/search/albums?query=${encodeURIComponent(query)}`);
      const albumResults = albumData.results || albumData;
      DOM.albumsSearchResults.innerHTML = '';
      if (!albumResults || albumResults.length === 0) {
        DOM.albumsSearchResults.innerHTML = '<p class="empty-text">No albums found</p>';
      } else {
        albumResults.slice(0, 4).forEach(album => {
          const card = document.createElement('div');
          card.className = 'music-card';
          card.innerHTML = `
            <div class="card-img-wrapper">
              <img src="${getSongImage(album)}" alt="${album.name}" class="card-img">
            </div>
            <div class="card-info">
              <h4>${album.name || album.title}</h4>
              <p>${album.artist || album.primaryArtists || 'Various'}</p>
            </div>
          `;
          card.onclick = () => {
            state.activeAlbumId = album.id;
            switchView('album-detail');
          };
          DOM.albumsSearchResults.appendChild(card);
        });
      }

      // Playlists search
      const playlistData = await apiFetch(`/api/search/playlists?query=${encodeURIComponent(query)}`);
      const playlistResults = playlistData.results || playlistData;
      DOM.playlistsSearchResults.innerHTML = '';
      if (!playlistResults || playlistResults.length === 0) {
        DOM.playlistsSearchResults.innerHTML = '<p class="empty-text">No playlists found</p>';
      } else {
        playlistResults.slice(0, 4).forEach(pl => {
          const card = document.createElement('div');
          card.className = 'music-card';
          card.innerHTML = `
            <div class="card-img-wrapper">
              <img src="${getSongImage(pl)}" alt="${pl.name}" class="card-img">
            </div>
            <div class="card-info">
              <h4>${pl.name || pl.title}</h4>
              <p>Curated Playlist</p>
            </div>
          `;
          card.onclick = () => {
            state.activePlaylistId = pl.name || pl.title;
            // Fetch playlist detail and show
            renderCustomOrRemotePlaylist(pl);
          };
          DOM.playlistsSearchResults.appendChild(card);
        });
      }

      lucide.createIcons();
      updateFavIconsInTable(DOM.songsSearchResults);
    } catch (e) {
      console.error(e);
    }
  }

  // Load Remote playlists from JioSaavn Search
  async function renderCustomOrRemotePlaylist(plObj) {
    switchView('playlist-detail');
    DOM.playlistDetailTitle.textContent = plObj.name || plObj.title;
    DOM.playlistSongsList.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading playlist tracks...</td></tr>';
    DOM.playlistDetailCount.textContent = 'Curated';
    DOM.btnDeletePlaylist.style.display = 'none';

    try {
      // Fetch details of playlist by ID
      const playlistDetails = await apiFetch(`/api/playlists?id=${plObj.id}`);
      const songs = playlistDetails.songs || [];
      DOM.playlistDetailCount.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;
      
      DOM.playlistSongsList.innerHTML = '';
      if (songs.length === 0) {
        DOM.playlistEmptyState.classList.add('active');
        return;
      }
      DOM.playlistEmptyState.classList.remove('active');

      DOM.btnPlaylistPlayAll.style.display = 'flex';
      DOM.btnPlaylistPlayAll.onclick = () => {
        if (songs.length > 0) {
          playSongsImmediate(songs);
          showToast(`Playing playlist "${plObj.name || plObj.title}"!`);
        } else {
          showToast('Playlist is empty.');
        }
      };

      songs.forEach((song, idx) => {
        const row = document.createElement('tr');
        row.className = 'song-row';
        row.innerHTML = `
          <td class="col-index">${idx + 1}</td>
          <td class="col-title">
            <img src="${getSongImage(song)}" alt="" class="table-song-art">
            <div class="table-song-details">
              <h4>${getSongTitle(song)}</h4>
              <p>${getSongArtist(song)}</p>
            </div>
          </td>
          <td class="col-album">${getAlbumTitle(song)}</td>
          <td class="col-actions">
            <button class="row-action-btn fav-btn" title="Add to Favorites">
              <i data-lucide="heart"></i>
            </button>
            <button class="row-action-btn add-btn" title="Add to Playlist">
              <i data-lucide="plus"></i>
            </button>
            <button class="row-action-btn queue-btn" title="Add to Queue">
              <i data-lucide="list-plus"></i>
            </button>
          </td>
        `;
        row.querySelector('.fav-btn').onclick = (e) => {
          e.stopPropagation();
          toggleFavorite(song, e.currentTarget);
        };
        row.querySelector('.add-btn').onclick = (e) => {
          e.stopPropagation();
          openPlaylistPicker(song);
        };
        row.querySelector('.queue-btn').onclick = (e) => {
          e.stopPropagation();
          addToQueue(song);
        };
        row.onclick = () => playSongNow(song);
        DOM.playlistSongsList.appendChild(row);
      });
      lucide.createIcons();
      updateFavIconsInTable(DOM.playlistSongsList);
    } catch (e) {
      DOM.playlistSongsList.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ef4444;">Failed to load playlist songs.</td></tr>';
    }
  }

  // ==========================================================================
  // PLAYLISTS MANAGEMENT (LOCALSTORAGE)
  // ==========================================================================
  function createPlaylist(name) {
    if (!name || name.trim() === '') return;
    const cleanName = name.trim();
    if (state.playlists[cleanName]) {
      showToast('Playlist already exists!');
      return;
    }
    state.playlists[cleanName] = [];
    localStorage.setItem('padal_playlists', JSON.stringify(state.playlists));
    showToast(`Playlist "${cleanName}" created.`);
    renderSidebarPlaylists();
    if (state.currentView === 'playlists') renderPlaylistsView();
  }

  function renderSidebarPlaylists() {
    DOM.sidebarPlaylists.innerHTML = '';
    Object.keys(state.playlists).forEach(name => {
      const li = document.createElement('li');
      li.className = 'playlist-sidebar-item';
      li.textContent = name;
      li.onclick = () => {
        state.activePlaylistId = name;
        switchView('playlist-detail');
        // Unhide delete button since it is custom playlist
        DOM.btnDeletePlaylist.style.display = 'flex';
      };
      DOM.sidebarPlaylists.appendChild(li);
    });
  }

  function openPlaylistPicker(song) {
    state.songToAddToPlaylist = song;
    DOM.playlistPickerList.innerHTML = '';
    const keys = Object.keys(state.playlists);
    
    if (keys.length === 0) {
      DOM.playlistPickerList.innerHTML = '<p class="empty-text" style="color:var(--text-secondary); text-align:center; padding:10px 0;">No playlists created yet.</p>';
    } else {
      keys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'picker-item';
        item.textContent = key;
        item.onclick = () => {
          addSongToPlaylist(key, song);
          DOM.playlistPickerModal.classList.remove('active');
        };
        DOM.playlistPickerList.appendChild(item);
      });
    }
    DOM.playlistPickerModal.classList.add('active');
  }

  function addSongToPlaylist(playlistName, song) {
    const list = state.playlists[playlistName];
    if (list.some(s => s.id === song.id)) {
      showToast('Song is already in this playlist!');
      return;
    }
    list.push(song);
    localStorage.setItem('padal_playlists', JSON.stringify(state.playlists));
    showToast(`Added to "${playlistName}".`);
    if (state.currentView === 'playlist-detail' && state.activePlaylistId === playlistName) {
      renderPlaylistDetailView(playlistName);
    }
  }

  function removeSongFromPlaylist(playlistName, idx) {
    state.playlists[playlistName].splice(idx, 1);
    localStorage.setItem('padal_playlists', JSON.stringify(state.playlists));
    showToast('Song removed.');
    renderPlaylistDetailView(playlistName);
  }

  // Create Playlist Button Events
  DOM.btnCreatePlaylist.onclick = () => {
    const name = prompt('Enter playlist name:');
    createPlaylist(name);
  };
  DOM.btnCreatePlaylistShortcut.onclick = () => {
    const name = prompt('Enter playlist name:');
    createPlaylist(name);
  };
  DOM.btnCreatePlaylistModal.onclick = () => {
    const name = DOM.newPlaylistModalName.value;
    if (name && name.trim() !== '') {
      createPlaylist(name);
      if (state.songToAddToPlaylist) {
        addSongToPlaylist(name, state.songToAddToPlaylist);
      }
      DOM.newPlaylistModalName.value = '';
      DOM.playlistPickerModal.classList.remove('active');
    }
  };

  // ==========================================================================
  // FAVORITES (LOCALSTORAGE)
  // ==========================================================================
  function toggleFavorite(song, buttonEl = null) {
    const index = state.favorites.findIndex(f => f.id === song.id);
    let isFav = false;
    
    if (index === -1) {
      state.favorites.push(song);
      isFav = true;
      showToast('Added to Favorites');
    } else {
      state.favorites.splice(index, 1);
      isFav = false;
      showToast('Removed from Favorites');
    }
    localStorage.setItem('padal_favorites', JSON.stringify(state.favorites));
    
    // Update active player heart icon if matches
    if (state.currentSong && state.currentSong.id === song.id) {
      DOM.playerBtnFav.classList.toggle('active', isFav);
      DOM.playerBtnFav.querySelector('i').setAttribute('data-lucide', isFav ? 'heart-handshake' : 'heart');
      lucide.createIcons();
    }
    
    // Update trigger button visually if passed
    if (buttonEl) {
      buttonEl.classList.toggle('active', isFav);
    }
    
    // Update lists
    updateFavIconsInTable(document.body);
  }

  function updateFavIconsInTable(container) {
    container.querySelectorAll('.song-row').forEach(row => {
      // Find row action fav button
      const favBtn = row.querySelector('.fav-btn');
      if (favBtn) {
        // We match song detail row name/id
        const titleEl = row.querySelector('.table-song-details h4');
        if (titleEl) {
          const titleText = titleEl.textContent;
          const isFav = state.favorites.some(f => getSongTitle(f) === titleText);
          favBtn.classList.toggle('active', isFav);
        }
      }
    });
  }

  DOM.playerBtnFav.onclick = () => {
    if (state.currentSong) {
      toggleFavorite(state.currentSong, DOM.playerBtnFav);
    }
  };

  // ==========================================================================
  // QUEUE MANAGEMENT
  // ==========================================================================
  function addToQueue(song) {
    if (state.queue.some(s => s.id === song.id)) {
      showToast('Song is already in the queue');
      return;
    }
    state.queue.push(song);
    showToast('Added to queue');
    renderQueueList();
  }

  function renderQueueList() {
    DOM.queueItemsList.innerHTML = '';
    DOM.queueSongsCount.textContent = `${state.queue.length} Song${state.queue.length !== 1 ? 's' : ''} in Queue`;
    
    state.queue.forEach((song, idx) => {
      const li = document.createElement('li');
      li.className = 'queue-item';
      if (idx === state.currentIndex) li.classList.add('active');
      
      li.innerHTML = `
        <div class="queue-item-info">
          <img src="${getSongImage(song)}" alt="" class="queue-song-art">
          <div class="queue-song-meta">
            <div class="queue-song-title">${getSongTitle(song)}</div>
            <div class="queue-song-artist">${getSongArtist(song)}</div>
          </div>
        </div>
        <div class="queue-item-actions">
          <button class="row-action-btn remove-queue-btn" title="Remove">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      li.onclick = () => {
        state.currentIndex = idx;
        loadAudio(song);
        renderQueueList();
      };
      li.querySelector('.remove-queue-btn').onclick = (e) => {
        e.stopPropagation();
        state.queue.splice(idx, 1);
        if (state.currentIndex === idx) {
          state.currentIndex = Math.min(idx, state.queue.length - 1);
          if (state.queue.length > 0) loadAudio(state.queue[state.currentIndex]);
          else {
            audio.pause();
            state.isPlaying = false;
            state.currentSong = null;
            updatePlayerControlsUI();
          }
        } else if (state.currentIndex > idx) {
          state.currentIndex--;
        }
        renderQueueList();
      };
      DOM.queueItemsList.appendChild(li);
    });
    lucide.createIcons();
  }

  DOM.btnClearQueue.onclick = () => {
    state.queue = [];
    state.currentIndex = -1;
    audio.pause();
    state.isPlaying = false;
    state.currentSong = null;
    updatePlayerControlsUI();
    renderQueueList();
    showToast('Queue cleared');
  };

  // ==========================================================================
  // LYRICS DRAWER & RIGHT PANEL TOGGLE
  // ==========================================================================
  DOM.playerBtnQueue.onclick = () => {
    toggleRightPanel('queue');
  };

  DOM.playerBtnLyrics.onclick = () => {
    toggleRightPanel('lyrics');
  };

  DOM.btnCloseRightPanel.onclick = () => {
    DOM.rightPanelDrawer.classList.remove('active');
  };

  function toggleRightPanel(paneName) {
    const isCurrentlyActive = DOM.rightPanelDrawer.classList.contains('active');
    const isTargetActive = paneName === 'queue' ? DOM.rightQueuePane.classList.contains('active') : DOM.rightLyricsPane.classList.contains('active');
    
    if (isCurrentlyActive && isTargetActive) {
      DOM.rightPanelDrawer.classList.remove('active');
      return;
    }

    DOM.rightPanelDrawer.classList.add('active');
    
    if (paneName === 'queue') {
      DOM.rightPanelTitle.textContent = 'Play Queue';
      DOM.rightQueuePane.classList.add('active');
      DOM.rightLyricsPane.classList.remove('active');
      renderQueueList();
    } else {
      DOM.rightPanelTitle.textContent = 'Lyrics';
      DOM.rightQueuePane.classList.remove('active');
      DOM.rightLyricsPane.classList.add('active');
      if (state.currentSong) {
        fetchAndRenderLyrics(state.currentSong.id);
      } else {
        DOM.lyricsTextContainer.innerHTML = 'Select a song and play to see lyrics.';
        DOM.lyricsCopyright.textContent = '';
      }
    }
  }

  async function fetchAndRenderLyrics(songId) {
    DOM.lyricsTextContainer.innerHTML = 'Loading lyrics...';
    DOM.lyricsCopyright.textContent = '';
    try {
      const data = await apiFetch(`/api/songs/${songId}/lyrics`);
      if (data && data.lyrics) {
        DOM.lyricsTextContainer.innerHTML = data.lyrics;
        DOM.lyricsCopyright.textContent = data.copyright || '';
      } else {
        DOM.lyricsTextContainer.innerHTML = 'Lyrics are not available for this song.';
      }
    } catch (e) {
      DOM.lyricsTextContainer.innerHTML = 'Lyrics not available.';
    }
  }

  // ==========================================================================
  // SETTINGS & AUDIO QUALITY
  // ==========================================================================
  DOM.playerBtnQuality.onclick = (e) => {
    e.stopPropagation();
    DOM.qualityDropdownMenu.classList.toggle('active');
  };

  document.querySelectorAll('.quality-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.quality-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      
      const q = opt.getAttribute('data-quality');
      state.streamingQuality = q;
      localStorage.setItem('padal_quality', q);
      DOM.playerBtnQuality.textContent = q === '320kbps' ? '320k' : q === '160kbps' ? '160k' : '96k';
      DOM.qualityDropdownMenu.classList.remove('active');
      showToast(`Quality set to ${q}. Reloading current song.`);
      
      // Reload current song with new quality if playing
      if (state.currentSong) {
        const time = audio.currentTime;
        loadAudio(state.currentSong);
        audio.currentTime = time;
      }
    };
  });

  // Settings Modal Events
  DOM.btnSettingsToggle.onclick = () => {
    DOM.settingsApiUrl.value = state.apiBaseUrl;
    DOM.settingsModal.classList.add('active');
  };

  DOM.btnSettingsSave.onclick = () => {
    const url = DOM.settingsApiUrl.value.trim();
    if (url) {
      state.apiBaseUrl = url;
      localStorage.setItem('padal_api_url', url);
      showToast('API Settings Saved');
      DOM.settingsModal.classList.remove('active');
      loadHomeContent();
    }
  };

  DOM.btnSettingsReset.onclick = () => {
    state.apiBaseUrl = 'https://saavn.sumit.co';
    localStorage.setItem('padal_api_url', state.apiBaseUrl);
    DOM.settingsApiUrl.value = state.apiBaseUrl;
    showToast('API Reset to Default');
    DOM.settingsModal.classList.remove('active');
    loadHomeContent();
  };

  // Language selectors
  DOM.langChips.forEach(chip => {
    chip.onclick = () => {
      DOM.langChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const lang = chip.getAttribute('data-lang');
      state.selectedLanguage = lang;
      localStorage.setItem('padal_language', lang);
      showToast(`Language switched to ${lang}`);
      loadHomeContent();
    };
  });

  // Window close click outside dropdown
  window.onclick = (e) => {
    if (!e.target.matches('#player-btn-quality')) {
      DOM.qualityDropdownMenu.classList.remove('active');
    }
  };

  // Global Navigation Clicks
  DOM.navItems.forEach(item => {
    item.onclick = () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    };
  });

  // Player center control hooks
  DOM.playerBtnPlayPause.onclick = togglePlayPause;
  DOM.playerBtnNext.onclick = playNext;
  DOM.playerBtnPrev.onclick = playPrev;
  // Sidebar Toggle for Mobile
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (btnSidebarToggle && sidebar) {
    btnSidebarToggle.onclick = (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    };
    // Close sidebar when clicking close button
    const btnSidebarClose = document.getElementById('btn-sidebar-close');
    if (btnSidebarClose) {
      btnSidebarClose.onclick = () => {
        sidebar.classList.remove('active');
      };
    }
    // Close sidebar when clicking any navigation link
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        sidebar.classList.remove('active');
      });
    });
    // Close sidebar when clicking on the main content
    document.querySelector('.main-content').onclick = () => {
      sidebar.classList.remove('active');
    };
  }

  // Fullscreen support
  const btnFullscreen = document.getElementById('btn-fullscreen-toggle');
  if (btnFullscreen) {
    btnFullscreen.onclick = () => {
      toggleFullscreen();
    };
  }

  // Auto-request fullscreen on first click
  document.body.addEventListener('click', function autoFS() {
    if (!document.fullscreenElement) {
      toggleFullscreen();
    }
    document.body.removeEventListener('click', autoFS);
  }, { once: true });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          if (btnFullscreen) {
            btnFullscreen.querySelector('i').setAttribute('data-lucide', 'minimize');
            btnFullscreen.querySelector('span').textContent = 'Exit Fullscreen';
            lucide.createIcons();
          }
        })
        .catch(err => console.log('Fullscreen failed:', err));
    } else {
      document.exitFullscreen()
        .then(() => {
          if (btnFullscreen) {
            btnFullscreen.querySelector('i').setAttribute('data-lucide', 'maximize');
            btnFullscreen.querySelector('span').textContent = 'Fullscreen';
            lucide.createIcons();
          }
        });
    }
  }

  // Initialize
  renderSidebarPlaylists();
  switchView('home');
  loadHomeContent();

  // Highlight initial language chip
  DOM.langChips.forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-lang') === state.selectedLanguage);
  });
});
