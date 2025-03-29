// Twitter Engagement Bot - Background Script
// Manages scheduling, API calls, and persistent state

// Import AIService
import AIService from './AIService.js';

// Default configuration
const DEFAULT_CONFIG = {
  searchQuery: 'startup',
  followerThreshold: 1000,
  checkInterval: { min: 100, max: 180 }, // seconds
  replyDelay: { min: 120, max: 180 }, // seconds
  breakDuration: { min: 20, max: 30 }, // minutes
  geminiApiKey: 'AIzaSyANdRVvaj_oH4BaykI8RsgtPaadQlc5jms' // Default Gemini API key
};

// Create AI service instance
const aiService = new AIService(DEFAULT_CONFIG.geminiApiKey);

// State management
let botState = {
  isRunning: false,
  config: { ...DEFAULT_CONFIG },
  stats: {
    repliesTotal: 0,
    repliesToday: 0,
    lastReplyDate: null
  },
  activityLog: [],
  replyLog: []
};

// Initialize or load state from storage
chrome.storage.local.get(['botState'], (result) => {
  if (result.botState) {
    botState = { ...result.botState };
    
    // Reset daily stats if needed
    const today = new Date().toDateString();
    const lastReplyDate = botState.stats.lastReplyDate 
      ? new Date(botState.stats.lastReplyDate).toDateString() 
      : null;
      
    if (lastReplyDate !== today) {
      botState.stats.repliesToday = 0;
    }
  }
  
  // Update AIService with the API key
  if (botState.config.geminiApiKey) {
    aiService.setApiKey(botState.config.geminiApiKey);
  }
  
  // Save initialized state
  saveState();
});

// Save state to storage
function saveState() {
  chrome.storage.local.set({ botState });
}

// Get random number in range
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Schedule next check
function scheduleNextCheck(isBreak = false) {
  if (!botState.isRunning) return;
  
  let delaySeconds;
  
  if (isBreak) {
    // Taking a longer break
    delaySeconds = getRandomInt(
      botState.config.breakDuration.min * 60,
      botState.config.breakDuration.max * 60
    );
  } else {
    // Normal check interval
    delaySeconds = getRandomInt(
      botState.config.checkInterval.min,
      botState.config.checkInterval.max
    );
  }
  
  // Clear any existing alarms
  chrome.alarms.clear('checkTweets');
  
  // Create new alarm
  chrome.alarms.create('checkTweets', {
    delayInMinutes: delaySeconds / 60
  });
  
  console.log(`[Background] Next check scheduled in ${delaySeconds} seconds`);
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTweets' && botState.isRunning) {
    // Find active Twitter tab and send message to process tweets
    sendMessageToTwitterTab({
      action: 'processNewTweets'
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'contentScriptLoaded':
      // Content script has loaded, check if bot should be running
      if (botState.isRunning) {
        // Send config to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'startBot',
          config: botState.config
        });
      }
      break;
      
    case 'botStarted':
      // Content script reports bot has started
      botState.isRunning = true;
      botState.config = { ...botState.config, ...message.config };
      
      // Update AIService with the current API key
      if (botState.config.geminiApiKey) {
        aiService.setApiKey(botState.config.geminiApiKey);
      }
      
      saveState();
      
      // Schedule first check
      scheduleNextCheck();
      break;
      
    case 'botStopped':
      // Content script reports bot has stopped
      botState.isRunning = false;
      saveState();
      
      // Clear scheduled checks
      chrome.alarms.clear('checkTweets');
      break;
      
    case 'startBot':
      // Popup requesting to start the bot
      botState.config = { ...botState.config, ...message.config };
      botState.isRunning = true;
      
      // Update AIService with the current API key
      if (botState.config.geminiApiKey) {
        aiService.setApiKey(botState.config.geminiApiKey);
      }
      
      saveState();
      
      // Send message to active Twitter tab
      sendMessageToTwitterTab({
        action: 'startBot',
        config: botState.config
      });
      
      sendResponse({ status: 'Starting bot' });
      break;
      
    case 'stopBot':
      // Popup requesting to stop the bot
      botState.isRunning = false;
      saveState();
      
      // Clear scheduled checks
      chrome.alarms.clear('checkTweets');
      
      // Send message to active Twitter tab
      sendMessageToTwitterTab({
        action: 'stopBot'
      });
      
      sendResponse({ status: 'Stopping bot' });
      break;
      
    case 'getState':
      // Popup requesting current state
      sendResponse({ botState });
      break;
      
    case 'updateConfig':
      // Popup updating configuration
      botState.config = { ...botState.config, ...message.config };
      
      // Update AIService with the new API key
      if (botState.config.geminiApiKey) {
        aiService.setApiKey(botState.config.geminiApiKey);
      }
      
      saveState();
      
      // If running, update content script with new config
      if (botState.isRunning) {
        sendMessageToTwitterTab({
          action: 'updateConfig',
          config: botState.config
        });
      }
      
      sendResponse({ status: 'Configuration updated' });
      break;
      
    case 'generateAIReply':
      // Content script requesting AI-generated reply
      generateReply(message.data.tweetText, message.data.authorName)
        .then(reply => {
          sendResponse({ reply });
        })
        .catch(error => {
          console.error('Error generating reply:', error);
          sendResponse({ 
            reply: `Interesting thoughts about ${botState.config.searchQuery}! Would love to hear more.` 
          });
        });
        
      // Return true to indicate async response
      return true;
      
    case 'logActivity':
      // Content script logging activity
      botState.activityLog.push(message.data);
      
      // Keep log size manageable (last 100 events)
      if (botState.activityLog.length > 100) {
        botState.activityLog = botState.activityLog.slice(-100);
      }
      
      saveState();
      break;
      
    case 'logReply':
      // Content script logging a successful reply
      botState.replyLog.push(message.data);
      
      // Keep log size manageable (last 50 replies)
      if (botState.replyLog.length > 50) {
        botState.replyLog = botState.replyLog.slice(-50);
      }
      
      // Update stats
      botState.stats.repliesTotal++;
      botState.stats.repliesToday++;
      botState.stats.lastReplyDate = new Date().toISOString();
      
      saveState();
      break;
      
    case 'clearLogs':
      // Popup requesting to clear logs
      botState.activityLog = [];
      botState.replyLog = [];
      saveState();
      
      sendResponse({ status: 'Logs cleared' });
      break;
  }
});

// Find and send message to active Twitter tab
async function sendMessageToTwitterTab(message) {
  try {
    // Find all Twitter tabs
    const tabs = await chrome.tabs.query({
      url: ['*://twitter.com/*', '*://x.com/*']
    });
    
    if (tabs.length > 0) {
      // Prefer active tabs
      const activeTab = tabs.find(tab => tab.active) || tabs[0];
      
      // Send message to the tab
      chrome.tabs.sendMessage(activeTab.id, message);
    } else if (botState.isRunning) {
      // No Twitter tabs found, but bot should be running
      // Open a new Twitter tab with the search query
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(botState.config.searchQuery)}&src=typed_query&f=live`;
      
      chrome.tabs.create({ url: searchUrl }, (tab) => {
        // Wait for content script to load before sending message
        // This is handled by the contentScriptLoaded message
      });
    }
  } catch (error) {
    console.error('Error sending message to Twitter tab:', error);
  }
}

// Generate AI reply using Gemini Flash API
async function generateReply(tweetText, authorName) {
  try {
    const searchTerm = botState.config.searchQuery;
    
    // Use AIService to generate the reply
    const reply = await aiService.generateReply(tweetText, authorName, searchTerm);
    return reply;
    
  } catch (error) {
    console.error('Error in generateReply:', error);
    return fallbackReply(tweetText);
  }
}

// Fallback reply if AI generation fails
function fallbackReply(tweetText) {
  const searchTerm = botState.config.searchQuery;
  const fallbacks = [
    `Interesting thoughts on ${searchTerm}! Would love to hear more.`,
    `Great point about ${searchTerm}. What's your take on recent developments?`,
    `Thanks for sharing your perspective on ${searchTerm}!`,
    `This is such an interesting angle on ${searchTerm}. Let's connect!`,
    `Really appreciate your insights on ${searchTerm}.`
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
} 