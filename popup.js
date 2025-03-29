// Twitter Engagement Bot - Popup Script
// Handles the extension popup UI

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const startButton = document.getElementById('start-bot');
  const stopButton = document.getElementById('stop-bot');
  const botStatus = document.getElementById('bot-status');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const configForm = document.getElementById('config-form');
  const clearLogsButton = document.getElementById('clear-logs');
  
  // Statistics elements
  const repliesToday = document.getElementById('replies-today');
  const totalReplies = document.getElementById('total-replies');
  const searchQueryDisplay = document.getElementById('search-query');
  const followerThresholdDisplay = document.getElementById('follower-threshold');
  
  // Config inputs
  const searchQueryInput = document.getElementById('search-query-input');
  const followerThresholdInput = document.getElementById('follower-threshold-input');
  const checkIntervalMin = document.getElementById('check-interval-min');
  const checkIntervalMax = document.getElementById('check-interval-max');
  const breakDurationMin = document.getElementById('break-duration-min');
  const breakDurationMax = document.getElementById('break-duration-max');
  const geminiApiKey = document.getElementById('gemini-api-key');
  
  // Log elements
  const activityLog = document.getElementById('activity-log');
  const repliesLog = document.getElementById('replies-log');
  
  // Get current state from background script
  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (response && response.botState) {
      updateUI(response.botState);
    }
  });
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding content
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Start bot
  startButton.addEventListener('click', () => {
    // Get current config from form
    const config = {
      searchQuery: searchQueryInput.value.trim(),
      followerThreshold: parseInt(followerThresholdInput.value, 10),
      checkInterval: {
        min: parseInt(checkIntervalMin.value, 10),
        max: parseInt(checkIntervalMax.value, 10)
      },
      breakDuration: {
        min: parseInt(breakDurationMin.value, 10),
        max: parseInt(breakDurationMax.value, 10)
      },
      geminiApiKey: geminiApiKey.value.trim()
    };
    
    // Update UI immediately for responsiveness
    botStatus.textContent = 'Starting...';
    botStatus.classList.remove('status-stopped');
    botStatus.classList.add('status-running');
    startButton.disabled = true;
    stopButton.disabled = false;
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: 'startBot',
      config: config
    });
  });
  
  // Stop bot
  stopButton.addEventListener('click', () => {
    // Update UI immediately for responsiveness
    botStatus.textContent = 'Stopping...';
    botStatus.classList.remove('status-running');
    botStatus.classList.add('status-stopped');
    startButton.disabled = false;
    stopButton.disabled = true;
    
    // Send message to background script
    chrome.runtime.sendMessage({ action: 'stopBot' });
  });
  
  // Save configuration
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get config from form
    const config = {
      searchQuery: searchQueryInput.value.trim(),
      followerThreshold: parseInt(followerThresholdInput.value, 10),
      checkInterval: {
        min: parseInt(checkIntervalMin.value, 10),
        max: parseInt(checkIntervalMax.value, 10)
      },
      breakDuration: {
        min: parseInt(breakDurationMin.value, 10),
        max: parseInt(breakDurationMax.value, 10)
      },
      geminiApiKey: geminiApiKey.value.trim()
    };
    
    // Update displayed values
    searchQueryDisplay.textContent = config.searchQuery;
    followerThresholdDisplay.textContent = `${config.followerThreshold}+`;
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: 'updateConfig',
      config: config
    }, () => {
      // Flash feedback to user that config was saved
      const saveButton = configForm.querySelector('button[type="submit"]');
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        saveButton.textContent = originalText;
      }, 1500);
    });
  });
  
  // Clear logs
  clearLogsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearLogs' }, () => {
      // Clear log UI
      activityLog.innerHTML = '<h3>Activity Log</h3>';
      repliesLog.innerHTML = '<h3>Recent Replies</h3>';
    });
  });
  
  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'stateUpdated' && message.botState) {
      updateUI(message.botState);
    }
  });
  
  // Update UI with current state
  function updateUI(botState) {
    // Update bot status
    if (botState.isRunning) {
      botStatus.textContent = 'Running';
      botStatus.classList.remove('status-stopped');
      botStatus.classList.add('status-running');
      startButton.disabled = true;
      stopButton.disabled = false;
    } else {
      botStatus.textContent = 'Stopped';
      botStatus.classList.remove('status-running');
      botStatus.classList.add('status-stopped');
      startButton.disabled = false;
      stopButton.disabled = true;
    }
    
    // Update statistics
    repliesToday.textContent = botState.stats.repliesToday;
    totalReplies.textContent = botState.stats.repliesTotal;
    searchQueryDisplay.textContent = botState.config.searchQuery;
    followerThresholdDisplay.textContent = `${botState.config.followerThreshold}+`;
    
    // Update config form
    searchQueryInput.value = botState.config.searchQuery;
    followerThresholdInput.value = botState.config.followerThreshold;
    checkIntervalMin.value = botState.config.checkInterval.min;
    checkIntervalMax.value = botState.config.checkInterval.max;
    breakDurationMin.value = botState.config.breakDuration.min;
    breakDurationMax.value = botState.config.breakDuration.max;
    
    // Only set API key if it exists and form field is empty
    if (botState.config.geminiApiKey && !geminiApiKey.value) {
      geminiApiKey.value = botState.config.geminiApiKey;
    }
    
    // Update activity log
    updateActivityLog(botState.activityLog);
    
    // Update replies log
    updateRepliesLog(botState.replyLog);
  }
  
  // Update activity log UI
  function updateActivityLog(logEntries) {
    // Clear existing entries
    activityLog.innerHTML = '<h3>Activity Log</h3>';
    
    // Add entries in reverse chronological order
    logEntries.slice().reverse().forEach(entry => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      
      const time = new Date(entry.timestamp);
      const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-time';
      timeSpan.textContent = timeString;
      
      logEntry.appendChild(timeSpan);
      logEntry.appendChild(document.createTextNode(entry.message));
      
      activityLog.appendChild(logEntry);
    });
    
    // If no entries, show message
    if (logEntries.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'log-entry';
      emptyMessage.textContent = 'No activity yet.';
      activityLog.appendChild(emptyMessage);
    }
  }
  
  // Update replies log UI
  function updateRepliesLog(replyEntries) {
    // Clear existing entries
    repliesLog.innerHTML = '<h3>Recent Replies</h3>';
    
    // Add entries in reverse chronological order
    replyEntries.slice().reverse().forEach(entry => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      
      const time = new Date(entry.timestamp);
      const dateString = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      // Create entry with time, author, and truncated reply
      const content = `${dateString} - To @${entry.author}: "${truncateText(entry.reply, 70)}"`;
      
      logEntry.textContent = content;
      repliesLog.appendChild(logEntry);
    });
    
    // If no entries, show message
    if (replyEntries.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'log-entry';
      emptyMessage.textContent = 'No replies sent yet.';
      repliesLog.appendChild(emptyMessage);
    }
  }
  
  // Helper to truncate text
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}); 