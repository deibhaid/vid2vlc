// Vid2VLC - Popup Script

// DOM elements
const testBtn = document.getElementById('testBtn');
const statusDiv = document.getElementById('status');

// Test button
testBtn.addEventListener('click', async () => {
  showStatus('Downloading test playlist...', 'info');
  
  try {
    chrome.runtime.sendMessage({
      action: 'testVLC'
    }, (response) => {
      if (response && response.success) {
        showStatus('Test playlist downloaded! Open the .m3u file with VLC to test.', 'success');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'info');
  }
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}
