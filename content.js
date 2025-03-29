// Twitter Engagement Bot - Content Script
// Handles interaction with Twitter's DOM

class TwitterBot {
  constructor() {
    this.isRunning = false;
    this.targetSearch = 'startup';
    this.followerThreshold = 1000;
    this.repliesBeforeBreak = this.getRandomInt(8, 10);
    this.repliesMade = 0;
    this.processedTweetIds = new Set();
    
    // Listen for messages from popup and background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'startBot') {
        this.startBot(message.config);
        sendResponse({ status: 'Bot started' });
      } else if (message.action === 'stopBot') {
        this.stopBot();
        sendResponse({ status: 'Bot stopped' });
      } else if (message.action === 'getStatus') {
        sendResponse({ 
          isRunning: this.isRunning,
          repliesMade: this.repliesMade,
          targetSearch: this.targetSearch,
          followerThreshold: this.followerThreshold
        });
      } else if (message.action === 'processNewTweets') {
        this.processTweets();
        sendResponse({ status: 'Processing tweets' });
      }
      return true; // Keeps the message channel open for async responses
    });
  }

  startBot(config) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.targetSearch = config.searchQuery || this.targetSearch;
    this.followerThreshold = config.followerThreshold || this.followerThreshold;
    this.repliesMade = 0;
    this.processedTweetIds.clear();
    
    // Navigate to search page if not already there
    this.navigateToSearchPage();
    
    // Log activity
    this.logActivity('Bot started');
    
    // Notify background to start scheduling
    chrome.runtime.sendMessage({ 
      action: 'botStarted',
      config: {
        searchQuery: this.targetSearch,
        followerThreshold: this.followerThreshold
      }
    });
  }
  
  stopBot() {
    this.isRunning = false;
    this.logActivity('Bot stopped');
    chrome.runtime.sendMessage({ action: 'botStopped' });
  }
  
  navigateToSearchPage() {
    const currentUrl = window.location.href;
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(this.targetSearch)}&src=typed_query&f=live`;
    
    if (!currentUrl.includes('/search?')) {
      window.location.href = searchUrl;
    }
  }
  
  async processTweets() {
    if (!this.isRunning) return;
    
    // Check if we need a break
    if (this.repliesMade >= this.repliesBeforeBreak) {
      this.logActivity('Taking a break after ' + this.repliesMade + ' replies');
      this.repliesMade = 0;
      this.repliesBeforeBreak = this.getRandomInt(8, 10);
      return;
    }
    
    // Get new tweets
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    
    // Process each unprocessed tweet
    for (const tweet of tweets) {
      try {
        // Get tweet ID or other unique identifier
        const tweetId = this.getTweetId(tweet);
        
        if (tweetId && !this.processedTweetIds.has(tweetId)) {
          this.processedTweetIds.add(tweetId);
          
          if (await this.checkFollowerCount(tweet)) {
            const tweetText = this.getTweetText(tweet);
            const authorName = this.getAuthorName(tweet);
            
            if (tweetText && authorName) {
              // Generate and send reply
              this.generateReply(tweet, tweetText, authorName);
              this.repliesMade++;
              
              // Only process one tweet per cycle
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error processing tweet:', error);
      }
    }
  }
  
  getTweetId(tweetElement) {
    // Try to extract a unique identifier from the tweet element
    const linkElement = tweetElement.querySelector('a[href*="/status/"]');
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      const match = href.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }
  
  getTweetText(tweetElement) {
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.textContent.trim() : '';
  }
  
  getAuthorName(tweetElement) {
    const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
    return authorElement ? authorElement.textContent.trim() : '';
  }
  
  async checkFollowerCount(tweetElement) {
    try {
      // Find the author element
      const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
      if (!authorElement) return false;
      
      // Find the profile link
      const profileLink = authorElement.querySelector('a');
      if (!profileLink) return false;
      
      // This is a simplified check - in reality, you'd need to:
      // 1. Hover or click to open profile info
      // 2. Extract follower count from popup/profile
      // 3. Convert text like "10.5K" to number
      
      // Simulate checking follower count - this would need to be implemented
      // based on Twitter's current DOM structure
      const followerCount = await this.simulateGetFollowerCount(profileLink);
      
      return followerCount >= this.followerThreshold;
    } catch (error) {
      console.error('Error checking follower count:', error);
      return false;
    }
  }
  
  // This is a placeholder - actual implementation would need to interact with Twitter's UI
  async simulateGetFollowerCount(profileLink) {
    // In a real implementation, this would:
    // 1. Hover over or click the profile link
    // 2. Wait for popup/profile to appear
    // 3. Extract follower count text
    // 4. Parse the number
    
    // For now, randomly determine if user meets threshold (for testing)
    return Math.random() * 2000;
  }
  
  async generateReply(tweetElement, tweetText, authorName) {
    try {
      // Find reply button and click it
      const replyButton = tweetElement.querySelector('[data-testid="reply"]');
      if (!replyButton) return;
      
      // Log activity
      this.logActivity(`Replying to ${authorName}`);
      
      // Wait for random time to simulate human behavior
      await this.delay(this.getRandomInt(2000, 5000));
      
      // Click reply button
      replyButton.click();
      
      // Wait for reply box to appear
      await this.delay(1000);
      
      // Get AI-generated reply using Grok API
      const reply = await this.getAIReply(tweetText, authorName);
      
      // Find reply input field
      const replyInput = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (!replyInput) {
        console.error('Reply input not found');
        return;
      }
      
      // Type reply with random delays between characters
      await this.typeWithDelay(replyInput, reply);
      
      // Wait before submitting
      await this.delay(this.getRandomInt(1000, 3000));
      
      // Find and click the reply submit button
      const submitButton = document.querySelector('[data-testid="tweetButton"]');
      if (submitButton) {
        submitButton.click();
        
        // Save to activity log
        chrome.runtime.sendMessage({ 
          action: 'logReply', 
          data: {
            author: authorName,
            tweet: tweetText,
            reply: reply,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Wait for UI to reset
      await this.delay(2000);
      
      // Close any open dialogs if needed
      this.closeDialogs();
      
    } catch (error) {
      console.error('Error generating reply:', error);
    }
  }
  
  async getAIReply(tweetText, authorName) {
    // Send message to background script to get AI reply
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { 
          action: 'generateAIReply', 
          data: { tweetText, authorName } 
        },
        (response) => {
          if (response && response.reply) {
            resolve(response.reply);
          } else {
            // Fallback reply if AI fails
            resolve(`Interesting point about ${this.targetSearch}! Would love to hear more.`);
          }
        }
      );
    });
  }
  
  async typeWithDelay(element, text) {
    // Focus on the element
    element.focus();
    
    // Type characters with random delays
    for (const char of text) {
      // Set content - in a real implementation, you would need to trigger proper events
      // This is a simplified version
      element.textContent += char;
      
      // Dispatch input event to make Twitter recognize the input
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Random delay between keystrokes (20-100ms)
      await this.delay(this.getRandomInt(20, 100));
    }
  }
  
  closeDialogs() {
    // Find and click close buttons on any open dialogs
    const closeButtons = document.querySelectorAll('[data-testid="closeButton"]');
    for (const button of closeButtons) {
      button.click();
    }
  }
  
  logActivity(message) {
    console.log(`[TwitterBot] ${message}`);
    chrome.runtime.sendMessage({ 
      action: 'logActivity', 
      data: {
        message,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the bot
const twitterBot = new TwitterBot();

// Check if we're on the correct page
if (window.location.href.includes('twitter.com') || window.location.href.includes('x.com')) {
  // Notify background script that content script is loaded
  chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
} 