# Google Home MCP Server

Integrates Google Home devices and Google Gemini AI with PAI.

## Features

- **Gemini AI Integration**: Query Gemini for information, analysis, code generation
- **Google Home Control**: Make Google Home devices speak text aloud
- **Conversational AI**: Multi-turn conversations with Gemini
- **Vision AI**: Analyze images using Gemini Vision

## Setup

1. **Get Google API Key**:
   ```bash
   # Visit https://aistudio.google.com/app/apikey
   # Create a new API key
   ```

2. **Find Google Home IP** (optional, for TTS):
   ```bash
   # On your network, find your Google Home's IP address
   # Check your router's DHCP client list
   # Or use: nmap -sn 192.168.1.0/24 | grep -i "Google"
   ```

3. **Configure Environment**:
   Add to your `.env`:
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   GOOGLE_HOME_IP=192.168.1.XXX  # Optional
   ```

4. **Add to `.mcp.json`**:
   ```json
   {
     "mcpServers": {
       "google-home": {
         "command": "bun",
         "args": ["${PAI_DIR}/mcp-servers/google-home/server.ts"],
         "env": {
           "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
           "GOOGLE_HOME_IP": "${GOOGLE_HOME_IP}"
         },
         "description": "Google Home and Gemini AI integration"
       }
     }
   }
   ```

## Tools

### query_gemini
Query Gemini AI for information or analysis.

**Example**:
```
User: What's the weather like in San Francisco?
PAI: [Uses google-home.query_gemini]
     According to current data, San Francisco is 65°F...
```

### speak_to_google_home
Make a Google Home device announce text.

**Example**:
```
User: Announce dinner is ready on the Google Home
PAI: [Uses google-home.speak_to_google_home]
     ✓ Announced on Google Home
```

### gemini_chat
Multi-turn conversation with Gemini.

**Example**:
```
User: Ask Gemini to help me plan a trip to Japan
PAI: [Uses google-home.gemini_chat]
     I'd be happy to help! When are you planning to visit?
```

### gemini_vision
Analyze images using Gemini Vision.

**Example**:
```
User: What's in this image? [image.jpg]
PAI: [Uses google-home.gemini_vision]
     The image shows a sunset over the ocean...
```

## Usage

Once configured, PAI will automatically use the Google Home MCP server when relevant:

```
User: Ask Gemini what's 2+2
PAI: ✓ Gemini says: 2+2 equals 4

User: Announce "Coffee is ready" on the Google Home
PAI: ✓ Announced on Google Home

User: Have Gemini write a poem about AI
PAI: [Gemini generates poem]
```

## Troubleshooting

**"GOOGLE_API_KEY not set"**:
- Add your API key to `.env`
- Get a key from https://aistudio.google.com/app/apikey

**"Google Home IP address not configured"**:
- Find your Google Home's IP address
- Add `GOOGLE_HOME_IP=x.x.x.x` to `.env`
- Or pass `deviceIp` parameter to `speak_to_google_home`

**"Failed to send notification"**:
- Ensure Google Home is on the same network
- Check firewall settings
- Verify IP address is correct

## Notes

- Gemini API has free tier with generous limits
- Google Home TTS requires devices on same network
- Vision API requires Gemini Pro Vision model
- Chat maintains context within a session
