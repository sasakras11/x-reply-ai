# Twitter Engagement Bot

AI-powered Chrome extension that generates personalized replies to tweets based on your search criteria. The bot works within your existing Twitter/X browser session to maintain account safety and avoid detection.

## Features

- 🔍 Target tweets based on search queries and follower counts
- 🤖 AI-generated personalized replies using Google's Gemini Flash
- 🧠 Natural engagement patterns to avoid detection
- 📊 Dashboard for monitoring activity and stats
- ⚙️ Configurable settings for safe engagement

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right corner)
4. Click "Load unpacked" and select the directory containing this extension
5. The Twitter Engagement Bot extension should now appear in your browser

## Setup

1. Click the extension icon to open the popup interface
2. Go to the Configuration tab
3. Enter your Gemini API key (a default key is provided but you can use your own)
4. Configure your search query, follower threshold, and timing settings
5. Click "Save Configuration"

## Usage

1. Make sure you are logged into Twitter/X in your browser
2. Click the extension icon to open the popup interface
3. Click the "Start" button to activate the bot
4. The bot will automatically:
   - Navigate to your search query page
   - Find tweets from users with your specified minimum follower count
   - Generate personalized replies using AI
   - Maintain natural engagement patterns with breaks

5. Monitor the Statistics and Activity Log tabs to track performance
6. Click "Stop" when you want to pause the bot

## Safety Features

- Natural engagement patterns (8-10 replies followed by 20-30 minute breaks)
- Randomized timing between checks and replies
- Random variation in response generation
- Respects Twitter's rate limits
- Works within your existing browser session (no Twitter API tokens needed)

## Configuration Options

- **Search Query**: The search term to find relevant tweets (e.g., "startup")
- **Minimum Follower Count**: Only engage with users having at least this many followers
- **Check Interval**: How often to check for new tweets (in seconds)
- **Break Duration**: How long to pause after a set of replies (in minutes)
- **Gemini API Key**: Your API key for Google's Gemini Flash AI model (default provided)

## Best Practices

- Start with less frequent engagement to establish a baseline
- Use search terms relevant to your account theme
- Don't run the bot 24/7; use it during your normal active hours
- Periodically review the generated replies for quality
- Combine bot engagement with natural manual engagement

## Development

This extension is built with vanilla JavaScript and Chrome extension APIs. The code is organized as follows:

- `manifest.json`: Extension configuration
- `background.js`: Background worker for scheduling and state management
- `content.js`: Content script for Twitter DOM interaction
- `popup.html` & `popup.js`: User interface
- `AIService.js`: Gemini Flash API integration
- `utils.js`: Helper utilities for timing and randomization

## Disclaimer

This tool is for educational purposes only. Use responsibly and in accordance with Twitter's terms of service. The developers are not responsible for any account restrictions that may result from improper use. 