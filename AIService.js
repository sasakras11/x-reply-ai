// AIService.js - Handles interaction with Gemini Flash API

class AIService {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }
  
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  
  /**
   * Generate a personalized reply for a tweet
   * @param {string} tweetText - The text content of the tweet
   * @param {string} authorName - The author's username
   * @param {string} searchTerm - The search term used to find the tweet
   * @returns {Promise<string>} - The generated reply
   */
  async generateReply(tweetText, authorName, searchTerm) {
    try {
      if (!this.apiKey) {
        return this.getFallbackReply(searchTerm);
      }
      
      // Create prompt for Gemini API with more casual, direct style
      const prompt = `Write a quick, casual reply to this tweet about ${searchTerm}: "${tweetText}" from user ${authorName}.

Make it sound like a real person (me) who:
- Speaks directly and casually
- Sometimes shares personal experiences or projects
- Asks questions
- Uses simple language, not overly professional
- Occasionally uses incomplete sentences
- Might mention tech or coding projects they're building
- Doesn't use hashtags or emojis excessively

Keep it under 200 characters and make it feel like a genuine interaction, not an AI response.`;
      
      // Call Gemini API
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 150
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        return this.getFallbackReply(searchTerm);
      }
      
      const data = await response.json();
      
      // Extract reply from response
      const reply = data.candidates[0].content.parts[0].text;
      
      // Ensure reply is under 280 characters (Twitter limit)
      return this.formatReply(reply);
      
    } catch (error) {
      console.error('Error in AIService.generateReply:', error);
      return this.getFallbackReply(searchTerm);
    }
  }
  
  /**
   * Format the reply to meet Twitter requirements
   * @param {string} reply - The raw reply from AI
   * @returns {string} - Formatted reply
   */
  formatReply(reply) {
    // Trim and ensure under 280 characters
    let formatted = reply.trim();
    
    if (formatted.length > 280) {
      formatted = formatted.substring(0, 277) + '...';
    }
    
    // Remove quotes if the AI included them
    if (formatted.startsWith('"') && formatted.endsWith('"')) {
      formatted = formatted.substring(1, formatted.length - 1);
    }
    
    return formatted;
  }
  
  /**
   * Get a fallback reply when AI generation fails
   * @param {string} searchTerm - The search term used
   * @returns {string} - A fallback reply
   */
  getFallbackReply(searchTerm) {
    const fallbacks = [
      `Been looking into ${searchTerm} myself recently. Curious what tools you're using?`,
      `Just spent a few hours vibe-coding something similar for ${searchTerm}. Wanna chat about it?`,
      `This is super relevant to a ${searchTerm} project I'm hacking on right now. Learned anything surprising?`,
      `Had a similar issue with ${searchTerm} last week. Ended up building a quick solution. Did it work out for you?`,
      `Been deep in ${searchTerm} research lately. Think there's more potential there than people realize.`
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  
  /**
   * Simulate AI replies for testing without API key
   * @param {string} tweetText - The text content of the tweet
   * @param {string} searchTerm - The search term used to find the tweet
   * @returns {string} - A simulated reply
   */
  simulateReply(tweetText, searchTerm) {
    const replies = [
      `Been building something for ${searchTerm} too. Took me like 3-4 hours of vibe-coding. Have you tried using any open source tools?`,
      `Just had a chat with someone working on ${searchTerm}. Mind sharing what approach you're taking? Might save us both some time.`,
      `Spent way too much money learning about ${searchTerm} the hard way. Your approach looks solid though.`,
      `Working on a similar ${searchTerm} project. Probably 60% there. Curious if you've run into the same roadblocks I have.`,
      `Had a fascinating chat about ${searchTerm} yesterday. Your perspective is way more practical. How long have you been working on this?`
    ];
    
    // Add some randomization with more casual starters
    const randomStarters = ['Yo,', 'Hmm,', 'Interesting,', 'Nice,', 'So,', 'Man,', 'Damn,'];
    const randomIndex = Math.floor(Math.random() * replies.length);
    const starterIndex = Math.floor(Math.random() * randomStarters.length);
    
    // Extract a keyword from the tweet if possible
    const words = tweetText.split(' ');
    let keyword = '';
    
    if (words.length > 3) {
      // Pick a random "meaningful" word
      const meaningfulWords = words.filter(word => 
        word.length > 4 && 
        !['about', 'these', 'those', 'their', 'there', 'would'].includes(word.toLowerCase())
      );
      
      if (meaningfulWords.length > 0) {
        keyword = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
      }
    }
    
    // Add reference to the keyword if found, with a more casual style
    let reply = replies[randomIndex];
    if (keyword && Math.random() > 0.5) {
      reply = `That ${keyword} part caught my eye. ${reply}`;
    } else if (Math.random() > 0.7) {
      reply = `${randomStarters[starterIndex]} ${reply}`;
    }
    
    return reply;
  }
}

// Export as ES module
export default AIService; 