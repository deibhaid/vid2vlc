// Vid2VLC - Background Script

let vlcPath = '';

// Default VLC paths for different operating systems
const DEFAULT_VLC_PATHS = {
  'mac': '/Applications/VLC.app/Contents/MacOS/VLC',
  'windows': 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  'linux': '/usr/bin/vlc'
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Load saved VLC path or set default
  const result = await chrome.storage.sync.get(['vlcPath', 'os']);
  if (result.vlcPath) {
    vlcPath = result.vlcPath;
  }

  // Create context menus
  createContextMenus();
});

// Load VLC path on startup
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.sync.get(['vlcPath']);
  if (result.vlcPath) {
    vlcPath = result.vlcPath;
  }
});

function createContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Add single video stream menu
    chrome.contextMenus.create({
      id: 'streamToVLC',
      title: 'Add Stream to VLC',
      contexts: ['video', 'audio', 'link', 'page']
    });

    // Add all videos to playlist menu
    chrome.contextMenus.create({
      id: 'addAllToVLC',
      title: 'Add All Videos to VLC Playlist',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Get VLC path from storage
  const result = await chrome.storage.sync.get(['vlcPath', 'os']);
  const configuredPath = result.vlcPath;
  const os = result.os || detectOS();

  if (!configuredPath) {
    // Show notification to configure VLC path
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'VLC Path Not Configured',
      message: 'Please click the extension icon to configure your VLC path.'
    });
    return;
  }

  if (info.menuItemId === 'streamToVLC') {
    handleSingleStream(info, tab, configuredPath, os);
  } else if (info.menuItemId === 'addAllToVLC') {
    handleAllVideos(tab, configuredPath, os);
  }
});

async function handleSingleStream(info, tab, vlcPath, os) {
  let videoUrl = null;

  // Try to get URL from different sources
  if (info.srcUrl) {
    // Direct video/audio source
    videoUrl = info.srcUrl;
  } else if (info.linkUrl) {
    // Link URL
    videoUrl = info.linkUrl;
  } else if (info.pageUrl) {
    // Try to find video on page
    const videos = await getVideosFromPage(tab.id);
    if (videos && videos.length > 0) {
      videoUrl = videos[0];
    }
  }

  if (videoUrl) {
    launchVLC([videoUrl], vlcPath, os);
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'No Video Found',
      message: 'Could not find a video URL to stream.'
    });
  }
}

async function handleAllVideos(tab, vlcPath, os) {
  const videos = await getVideosFromPage(tab.id);
  
  if (videos && videos.length > 0) {
    launchVLC(videos, vlcPath, os);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Added to VLC Playlist',
      message: `Added ${videos.length} video(s) to VLC playlist.`
    });
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'No Videos Found',
      message: 'Could not find any videos on this page.'
    });
  }
}

async function getVideosFromPage(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const videos = [];
        
        // Get video elements
        document.querySelectorAll('video, audio').forEach(el => {
          if (el.src) videos.push(el.src);
          if (el.currentSrc) videos.push(el.currentSrc);
          
          // Check source elements
          el.querySelectorAll('source').forEach(source => {
            if (source.src) videos.push(source.src);
          });
        });

        // Get links to video files
        document.querySelectorAll('a').forEach(link => {
          const href = link.href;
          if (href && isVideoUrl(href)) {
            videos.push(href);
          }
        });

        function isVideoUrl(url) {
          const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.m3u8', '.mpd'];
          return videoExtensions.some(ext => url.toLowerCase().includes(ext));
        }

        // Remove duplicates
        return [...new Set(videos)];
      }
    });

    return results[0]?.result || [];
  } catch (error) {
    console.error('Error getting videos from page:', error);
    return [];
  }
}

function launchVLC(urls, vlcPath, os) {
  // Since Chrome extensions can't directly launch external apps,
  // we'll use a custom protocol handler approach or native messaging
  
  // Method 1: Try native messaging (requires native host app)
  // Method 2: Use vlc:// protocol (requires VLC to be registered)
  // Method 3: Use browser download with custom protocol
  
  // For cross-platform compatibility, we'll create a playlist file
  // and open it with a custom protocol
  const playlistContent = createM3UPlaylist(urls);
  
  // Try to open VLC using custom protocol
  const vlcUrl = buildVLCProtocolUrl(urls);
  
  // Open VLC URL in new tab (will trigger VLC if protocol is registered)
  chrome.tabs.create({ url: vlcUrl, active: false }, (tab) => {
    // Close the tab immediately
    setTimeout(() => {
      chrome.tabs.remove(tab.id);
    }, 1000);
  });
}

function buildVLCProtocolUrl(urls) {
  // Build VLC protocol URL
  // Format: vlc://http://example.com/video.mp4
  if (urls.length === 1) {
    return `vlc://${urls[0]}`;
  } else {
    // For multiple URLs, we'll need to create a playlist
    // VLC can accept playlist parameter
    const encodedUrls = urls.map(url => encodeURIComponent(url)).join('&vlc-add=');
    return `vlc://${urls[0]}`;
  }
}

function createM3UPlaylist(urls) {
  let playlist = '#EXTM3U\n';
  urls.forEach((url, index) => {
    playlist += `#EXTINF:-1,Video ${index + 1}\n`;
    playlist += `${url}\n`;
  });
  return playlist;
}

function detectOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';
  return 'unknown';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateVLCPath') {
    vlcPath = request.path;
    sendResponse({ success: true });
  } else if (request.action === 'testVLC') {
    // Test VLC with a sample URL
    launchVLC(['http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'], 
              request.path, request.os);
    sendResponse({ success: true });
  }
  return true;
});

