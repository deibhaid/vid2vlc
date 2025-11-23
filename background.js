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
    launchVLC([videoUrl]);
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
    launchVLC(videos);
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

    return results[0]?.result || [];
  } catch (error) {
    console.error('Error getting videos from page:', error);
    return [];
  }
}

function launchVLC(urls) {
  // Always use M3U playlist download for reliability across all OSes
  downloadM3UPlaylist(urls);
}

function downloadM3UPlaylist(urls) {
  // Create M3U playlist content
  const playlistContent = createM3UPlaylist(urls);
  
  // Create blob and download
  const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().getTime();
  
  chrome.downloads.download({
    url: url,
    filename: `vid2vlc_playlist_${timestamp}.m3u`,
    saveAs: false
  }, (downloadId) => {
    // Revoke object URL after download starts
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });
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

