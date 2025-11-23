// Vid2VLC - Popup Script

const DEFAULT_PATHS = {
  'mac': '/Applications/VLC.app/Contents/MacOS/VLC',
  'windows': 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  'linux': '/usr/bin/vlc'
};

let currentOS = 'mac';

// DOM elements
const osButtons = document.querySelectorAll('.os-btn');
const vlcPathInput = document.getElementById('vlcPath');
const defaultPathText = document.getElementById('defaultPathText');
const useDefaultBtn = document.getElementById('useDefaultBtn');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const result = await chrome.storage.sync.get(['vlcPath', 'os']);
  
  if (result.os) {
    currentOS = result.os;
  } else {
    currentOS = detectOS();
  }
  
  updateOSSelection(currentOS);
  
  if (result.vlcPath) {
    vlcPathInput.value = result.vlcPath;
  } else {
    vlcPathInput.value = DEFAULT_PATHS[currentOS];
  }
  
  updateDefaultPath();
});

// OS selection
osButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const os = btn.dataset.os;
    currentOS = os;
    updateOSSelection(os);
    
    // Update path to default for selected OS if field is empty or has default value
    if (!vlcPathInput.value || Object.values(DEFAULT_PATHS).includes(vlcPathInput.value)) {
      vlcPathInput.value = DEFAULT_PATHS[os];
    }
    
    updateDefaultPath();
  });
});

function updateOSSelection(os) {
  osButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.os === os) {
      btn.classList.add('active');
    }
  });
}

function updateDefaultPath() {
  defaultPathText.textContent = DEFAULT_PATHS[currentOS];
}

// Use default button
useDefaultBtn.addEventListener('click', () => {
  vlcPathInput.value = DEFAULT_PATHS[currentOS];
  showStatus('Default path loaded', 'info');
});

// Test button
testBtn.addEventListener('click', async () => {
  const path = vlcPathInput.value.trim();
  
  if (!path) {
    showStatus('Please enter a VLC path first', 'error');
    return;
  }
  
  showStatus('Attempting to launch VLC with test video...', 'info');
  
  try {
    // Try to open VLC with test video
    const testUrl = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    // Use vlc:// protocol
    const vlcProtocolUrl = `vlc://${testUrl}`;
    
    chrome.tabs.create({ url: vlcProtocolUrl, active: false }, (tab) => {
      setTimeout(() => {
        chrome.tabs.remove(tab.id, () => {
          showStatus('Test launched! Check if VLC opened. If not, verify your VLC path or ensure VLC protocol handler is registered.', 'info');
        });
      }, 1000);
    });
  } catch (error) {
    showStatus('Error testing VLC: ' + error.message, 'error');
  }
});

// Save button
saveBtn.addEventListener('click', async () => {
  const path = vlcPathInput.value.trim();
  
  if (!path) {
    showStatus('Please enter a VLC path', 'error');
    return;
  }
  
  try {
    // Save to storage
    await chrome.storage.sync.set({
      vlcPath: path,
      os: currentOS
    });
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'updateVLCPath',
      path: path
    });
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 4000);
  }
}

function detectOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('linux')) return 'linux';
  return 'mac';
}

