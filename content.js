// VLC Stream Extension - Content Script

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideos') {
    const videos = findAllVideos();
    sendResponse({ videos: videos });
  }
  return true;
});

function findAllVideos() {
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

  // Remove duplicates
  return [...new Set(videos)];
}

function isVideoUrl(url) {
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mkv', '.mov', '.wmv', '.flv',
    '.m3u8', '.mpd', '.m4v', '.3gp', '.ts', '.m2ts'
  ];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

