// Vid2VLC - Background Script

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  // Create context menus
  createContextMenus();
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
  if (info.menuItemId === 'streamToVLC') {
    handleSingleStream(info, tab);
  } else if (info.menuItemId === 'addAllToVLC') {
    handleAllVideos(tab);
  }
});

async function handleSingleStream(info, tab) {
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
    launchVLC([videoUrl], videoUrl);  // Use video URL for filename
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Playlist Downloaded',
      message: 'Open the .m3u file with VLC to start streaming.'
    });
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'No Video Found',
      message: 'Could not find a video URL to stream.'
    });
  }
}

async function handleAllVideos(tab) {
  const videos = await getVideosFromPage(tab.id);
  
  if (videos && videos.length > 0) {
    launchVLC(videos, tab.url);  // Use page URL for filename
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Playlist Downloaded',
      message: `Created playlist with ${videos.length} video(s). Open the .m3u file with VLC.`
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

    // Check if results exist and have data
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return [];
  } catch (error) {
    console.error('Error getting videos from page:', error);
    // Show user-friendly error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Script Injection Failed',
      message: 'Cannot access this page. Try refreshing or check if the site allows extensions.'
    });
    return [];
  }
}

function launchVLC(urls, baseUrl) {
  // Always use M3U playlist download for reliability across all OSes
  downloadM3UPlaylist(urls, baseUrl);
}

function downloadM3UPlaylist(urls, baseUrl) {
  // Create M3U playlist content
  const playlistContent = createM3UPlaylist(urls);
  
  // Generate filename based on baseUrl (page URL for "all videos", video URL for single)
  const filename = generatePlaylistFilename(baseUrl);
  
  console.log('Downloading playlist with filename:', filename);
  console.log('Base URL:', baseUrl);
  
  // Inject script into page to handle download with proper blob URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (content, fname) => {
          const blob = new Blob([content], { type: 'audio/x-mpegurl' });
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fname;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        },
        args: [playlistContent, filename]
      });
    }
  });
}

function generatePlaylistFilename(url) {
  try {
    const urlObj = new URL(url);
    
    // Get hostname (without port)
    let hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Get the pathname from the URL and decode it
    let path = decodeURIComponent(urlObj.pathname);
    // Remove leading and trailing slashes
    path = path.replace(/^\/|\/$/g, '');
    
    if (path) {
      // Replace slashes with underscores
      let pathPart = path.replace(/\//g, '_');
      // Remove the file extension from the last segment if it exists
      pathPart = pathPart.replace(/\.[^._]+$/, '');
      // Replace any remaining special characters with underscores
      pathPart = pathPart.replace(/[^a-zA-Z0-9_.-]/g, '_');
      // Clean up any double underscores
      pathPart = pathPart.replace(/__+/g, '_');
      
      // Combine hostname and path, limit total length
      const filename = (hostname + '_' + pathPart).substring(0, 100);
      return filename + '.m3u';
    } else {
      // Just use hostname if no path
      return hostname + '.m3u';
    }
  } catch (error) {
    console.error('Invalid URL:', error);
    return 'vlc_playlist.m3u'; // Fallback filename
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'testVLC') {
    // Test VLC with a sample URL
    launchVLC(['http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Test Playlist Downloaded',
      message: 'Open the .m3u file with VLC to test the connection.'
    });
    sendResponse({ success: true });
  }
  return true;
});

