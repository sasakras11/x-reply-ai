// Utils.js - Utility functions for the Twitter Engagement Bot

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a promise that resolves after the specified time
 * @param {number} ms - Time in milliseconds
 * @returns {Promise<void>} - Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add jitter to a base time value
 * @param {number} baseTime - Base time in milliseconds
 * @param {number} jitterPercent - Percentage of jitter (0-100)
 * @returns {number} - Time with added jitter
 */
function addJitter(baseTime, jitterPercent = 15) {
  const jitterAmount = baseTime * (jitterPercent / 100);
  return baseTime + getRandomInt(-jitterAmount, jitterAmount);
}

/**
 * Generate human-like typing delays for text
 * @param {string} text - Text to generate delays for
 * @returns {Array<number>} - Array of delays in milliseconds
 */
function generateTypingDelays(text) {
  const delays = [];
  
  for (let i = 0; i < text.length; i++) {
    // Base typing speed (40-80ms per character)
    let delay = getRandomInt(40, 80);
    
    // Add pauses at punctuation
    if ('.!?,;:'.includes(text[i])) {
      delay += getRandomInt(200, 400);
    }
    
    // Simulate thinking pauses occasionally
    if (Math.random() < 0.05) {
      delay += getRandomInt(300, 700);
    }
    
    delays.push(delay);
  }
  
  return delays;
}

/**
 * Parse follower count from Twitter format (e.g., "10.5K")
 * @param {string} countText - Follower count as text
 * @returns {number} - Numeric follower count
 */
function parseFollowerCount(countText) {
  if (!countText) return 0;
  
  const text = countText.trim().toUpperCase();
  
  // Handle different suffixes
  if (text.endsWith('K')) {
    return parseFloat(text.replace('K', '')) * 1000;
  } else if (text.endsWith('M')) {
    return parseFloat(text.replace('M', '')) * 1000000;
  } else if (text.endsWith('B')) {
    return parseFloat(text.replace('B', '')) * 1000000000;
  } else {
    return parseInt(text.replace(/,/g, ''), 10) || 0;
  }
}

/**
 * Check if it's a good time to engage (avoid suspicious activity times)
 * @returns {boolean} - Whether it's a good time to engage
 */
function isGoodTimeToEngage() {
  const now = new Date();
  const hour = now.getHours();
  
  // Avoid suspicious times (3-5 AM)
  if (hour >= 3 && hour < 5) {
    return false;
  }
  
  return true;
}

/**
 * Calculate next break period based on natural engagement patterns
 * @param {number} repliesMade - Number of replies already made
 * @returns {number} - Break duration in minutes
 */
function calculateBreakDuration(repliesMade) {
  // Base break duration (20-30 minutes)
  let baseDuration = getRandomInt(20, 30);
  
  // Longer breaks after more activity
  if (repliesMade > 20) {
    baseDuration = getRandomInt(40, 60);
  } else if (repliesMade > 10) {
    baseDuration = getRandomInt(25, 40);
  }
  
  // Add jitter
  return addJitter(baseDuration, 20);
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getRandomInt,
    delay,
    addJitter,
    generateTypingDelays,
    parseFollowerCount,
    isGoodTimeToEngage,
    calculateBreakDuration
  };
} 