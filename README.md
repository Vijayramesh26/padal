# நாதம் (Nadham) - Premium Music Streaming Platform

நாதம் (Nadham) is a premium, glassmorphic music streaming platform designed with a focus on ease of use, visual beauty, and responsiveness. It utilizes public wrapper APIs of JioSaavn to stream high-quality music across multiple languages, with a default focus on Tamil hits.

## Features

- **Trending & Recommended**: Dynamically loaded tracks based on selected languages (Tamil, English, Hindi, Telugu, Malayalam, Punjabi).
- **Search Engine**: Search for songs, albums, and playlists simultaneously.
- **Glassmorphic Obsidian Theme**: Beautiful dark obsidian styling with ambient moving glow spheres.
- **HTML5 Player**: Complete play controls (shuffle, repeat loop modes, skip backward/forward, seek, and real-time buffer progress tracking).
- **Sound Wave Visualizer**: Bouncing visual audio bars synced to the active playing state.
- **Custom Playlists**: Create, manage, and delete custom playlists, saved directly in browser `localStorage`.
- **Favorites Gallery**: Star your favorite tracks for quick access.
- **Lyrics Drawer**: Slide-out panel that pulls real-time song lyrics.
- **Configurable Settings**: Toggle and save custom API endpoints (e.g., fallback domains like `https://saavn.sumit.co`).
- **Mobile Responsive Layout**: Fully optimized stacked layout and collapsing navigation drawer for phone and tablet screens.

## Local Installation

Since Nadham is built on pure HTML5, vanilla CSS, and vanilla ES6 JavaScript, it does not require a complex build process.

1. Clone or copy this repository:
   ```bash
   git clone <repo-url>
   ```
2. Open `index.html` directly in any web browser, or host it locally using a simple HTTP server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

## API Acknowledgement

This project uses the open-source JioSaavn wrapper API hosted at `saavn.sumit.co` / `saavn.dev`. Special thanks to the developers of [jiosaavn-api](https://github.com/sumitkolhe/jiosaavn-api).
