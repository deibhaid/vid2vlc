# VLC Stream Extension

A Chrome extension that allows you to stream videos from any webpage directly to VLC Media Player.

## Features

- **Context Menu Integration**: Right-click on videos to stream them to VLC
- **Batch Streaming**: Add all videos on a page to VLC playlist with one click
- **Cross-Platform Support**: Works on macOS, Windows, and Linux
- **Configurable VLC Path**: Set custom VLC installation path or use defaults
- **Beautiful UI**: Modern, gradient-styled settings popup

## Installation

### 1. Install the Extension

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `vlc-stream-extension` folder
5. The extension icon should now appear in your browser toolbar

### 2. Create Extension Icons

The extension requires icon files. Create simple icons or use the following commands to generate placeholder icons:

```bash
cd /Users/dbryso/ws/misc/vlc-stream-extension
mkdir -p icons
# You'll need to add actual PNG files here (16x16, 48x48, 128x128)
```

### 3. Configure VLC Protocol Handler

For the extension to launch VLC, you need to register the `vlc://` protocol handler:

#### macOS:
VLC on macOS typically registers the protocol automatically. If not, you can use this AppleScript:

```bash
# Create a URL handler app
cat > ~/Library/Application\ Support/vlc-handler.sh << 'EOF'
#!/bin/bash
url="${1#vlc://}"
/Applications/VLC.app/Contents/MacOS/VLC "$url" &
EOF

chmod +x ~/Library/Application\ Support/vlc-handler.sh
```

#### Windows:
Run this in PowerShell as Administrator:

```powershell
$vlcPath = "C:\Program Files\VideoLAN\VLC\vlc.exe"
reg add "HKCR\vlc" /ve /d "URL:VLC Protocol" /f
reg add "HKCR\vlc" /v "URL Protocol" /d "" /f
reg add "HKCR\vlc\shell\open\command" /ve /d "`"$vlcPath`" `"%1`"" /f
```

#### Linux:
Create a desktop file:

```bash
cat > ~/.local/share/applications/vlc-handler.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=VLC Protocol Handler
Exec=/usr/bin/vlc %u
MimeType=x-scheme-handler/vlc
NoDisplay=true
EOF

xdg-mime default vlc-handler.desktop x-scheme-handler/vlc
```

## Usage

### Configure VLC Path

1. Click the extension icon in your browser toolbar
2. Select your operating system (macOS, Windows, or Linux)
3. Either use the default VLC path or enter a custom path
4. Click "Test VLC" to verify it works
5. Click "Save" to save your settings

### Stream Videos

#### Single Video:
1. Right-click on any video element or video link
2. Select "Add Stream to VLC" from the context menu
3. VLC will open and start streaming the video

#### All Videos on Page:
1. Right-click anywhere on a page with videos
2. Select "Add All Videos to VLC Playlist"
3. VLC will open with all detected videos in the playlist

## Supported Video Sources

The extension can detect and stream:
- HTML5 `<video>` and `<audio>` elements
- Direct video file links (.mp4, .webm, .ogg, .avi, .mkv, .mov, .wmv, .flv, etc.)
- HLS streams (.m3u8)
- DASH streams (.mpd)

## Troubleshooting

### VLC Doesn't Open
- Verify the VLC path in extension settings is correct
- Ensure VLC protocol handler is registered (see installation instructions)
- Check that VLC is properly installed on your system

### No Videos Detected
- Some videos are loaded dynamically and may not be detected immediately
- Try refreshing the page and waiting for videos to load
- The extension may not detect DRM-protected videos

### Permission Issues
- Make sure Chrome has necessary permissions to access the page
- Some sites may block context menus

## Development

### File Structure
```
vlc-stream-extension/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── content.js          # Content script for page interaction
├── popup.html          # Settings UI
├── popup.js            # Settings logic
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
- Stores VLC path configuration locally in Chrome sync storage

## License

MIT License - Feel free to modify and distribute

## Credits

Created for streaming web videos to VLC Media Player across all platforms.

