# Vid2VLC

A Chrome extension that streams videos from any webpage directly to VLC Media Player using M3U playlists.

## Features

- **Context Menu Integration**: Right-click on videos to create VLC playlists
- **Batch Streaming**: Add all videos on a page to a single VLC playlist
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **No Configuration**: Zero setup required - just install and use
- **Universal Compatibility**: Creates standard M3U playlist files
- **Beautiful UI**: Modern, gradient-styled interface

## Installation

### 1. Install the Extension

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `vid2vlc` folder
5. The extension icon should now appear in your browser toolbar

### 2. Create Extension Icons

The extension requires icon files. Create simple icons or use the following commands to generate placeholder icons:

```bash
cd vid2vlc
python3 generate_icons.py
```

That's it! No VLC configuration needed.

## Usage

### Quick Start

1. Click the extension icon to see instructions and test the extension
2. Right-click on any video or page with videos
3. Select a Vid2VLC option from the context menu
4. Open the downloaded `.m3u` playlist file with VLC
5. Enjoy streaming!

### Stream Videos

#### Single Video:
1. Right-click on any video element or video link
2. Select "Add Stream to VLC" from the context menu
3. A `.m3u` playlist file will be downloaded
4. Open the file with VLC to start streaming

#### All Videos on Page:
1. Right-click anywhere on a page with videos
2. Select "Add All Videos to VLC Playlist"
3. A `.m3u` playlist file with all videos will be downloaded
4. Open the file with VLC to play all videos

## Supported Video Sources

The extension can detect and stream:
- HTML5 `<video>` and `<audio>` elements
- Direct video file links (.mp4, .webm, .ogg, .avi, .mkv, .mov, .wmv, .flv, etc.)
- HLS streams (.m3u8)
- DASH streams (.mpd)

## Troubleshooting

### Playlist File Won't Open
- Make sure VLC is installed and set as the default application for `.m3u` files
- Alternatively, right-click the `.m3u` file and select "Open with VLC"
- On Linux: `vlc playlist.m3u` from terminal

### No Videos Detected
- Some videos are loaded dynamically and may not be detected immediately
- Try refreshing the page and waiting for videos to load
- The extension may not detect DRM-protected videos

### Downloads Blocked
- Check Chrome's download settings
- Make sure Vid2VLC has download permissions
- Check if your browser or antivirus is blocking downloads

## Development

### File Structure
```
vid2vlc/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── content.js          # Content script for page interaction
├── popup.html          # Info UI
├── popup.js            # Popup logic
├── generate_icons.py   # Icon generator script
├── icons/              # Extension icons
└── README.md           # This file
```

### Testing
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test the changes on a webpage with videos

## Privacy

This extension:
- Does not collect or transmit any user data
- Only accesses pages when activated via context menu
- All playlist files are created locally
- No external servers or analytics

## License

MIT License - Feel free to modify and distribute

## Credits

Created for streaming web videos to VLC Media Player across all platforms.

