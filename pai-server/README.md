# PAI Centralized Server

REST API server that wraps PAI core functionality for cross-platform access.

## Features

- ✅ **REST API** - HTTP endpoints for all PAI functionality
- ✅ **WebSocket** - Real-time chat with streaming responses
- ✅ **Cross-Platform Voice** - Auto-detects macOS, Windows, Android, or ElevenLabs
- ✅ **Device Authentication** - Trusted device management
- ✅ **Skills & Agents** - Full access to PAI capabilities
- ✅ **Google Home Integration** - Gemini AI + TTS to Google Home devices

## Quick Start

```bash
# Install dependencies
cd pai-server
bun install

# Configure environment
cp ../.env.example ../.env
# Edit .env with your API keys

# Start server
bun src/server.ts
```

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T...",
  "voice": {
    "available": true,
    "provider": "macOS"
  },
  "pai": {
    "skills": 9,
    "agents": 8
  }
}
```

### Register Device
```http
POST /api/devices/register
Content-Type: application/json

{
  "name": "iPhone 15",
  "type": "mobile",
  "platform": "ios"
}
```

**Response:**
```json
{
  "device": {
    "id": "dev_abc123",
    "name": "iPhone 15",
    "fingerprint": "sha256:...",
    "trusted": true
  },
  "token": "device_token_here"
}
```

### Chat
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What's the weather?",
  "sessionId": "optional_session_id",
  "agentType": "kai",
  "voiceEnabled": true
}
```

**Response:**
```json
{
  "sessionId": "sess_1234567890",
  "message": "The weather is...",
  "agentUsed": "kai",
  "skillsActivated": ["research"],
  "timestamp": "2025-01-09T..."
}
```

### List Skills
```http
GET /api/skills
```

**Response:**
```json
{
  "skills": [
    {
      "name": "research",
      "description": "Multi-source research",
      "triggers": ["research", "look up", "find out"],
      "mcpServers": ["perplexity", "gemini"],
      "active": true
    }
  ]
}
```

### List Agents
```http
GET /api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "name": "kai",
      "description": "Your personal AI assistant",
      "model": "sonnet",
      "permissions": ["*"]
    }
  ]
}
```

### List Voices
```http
GET /api/voices
```

**Response:**
```json
{
  "provider": "macOS",
  "voices": [
    {
      "id": "Jamie",
      "name": "Jamie (Premium)",
      "language": "en-GB",
      "gender": "male",
      "quality": "premium"
    }
  ]
}
```

### Test Voice
```http
POST /api/voice/test
Content-Type: application/json

{
  "text": "Testing voice output",
  "voice": "Jamie (Premium)"
}
```

### WebSocket Chat

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat')

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: 'Hello PAI',
    voiceEnabled: true
  }))
}

ws.onmessage = (event) => {
  const response = JSON.parse(event.data)
  console.log(response.message)
}
```

## Voice System

The voice system auto-detects available providers on startup:

| Platform | Provider | Quality | Cost |
|----------|----------|---------|------|
| macOS | Native (`say`) | Premium/Enhanced | Free |
| Windows | SAPI (PowerShell) | Standard | Free |
| Android | Termux TTS | Standard | Free |
| Any | ElevenLabs API | Premium | Paid |

**Priority:** Native providers are preferred over cloud (ElevenLabs).

**Switching Providers:**

```http
POST /api/voice/provider
Content-Type: application/json

{
  "provider": "ElevenLabs"
}
```

## Configuration

### Environment Variables

```bash
# Server
PAI_SERVER_PORT=3000
PAI_SERVER_HOST=0.0.0.0  # Allow network access
LOG_LEVEL=info

# Voice (optional)
ELEVENLABS_API_KEY=your_key

# Google Home (optional)
GOOGLE_API_KEY=your_google_key
GOOGLE_HOME_IP=192.168.1.XXX
```

### Auto-Start

**macOS (launchd):**

Service file created by `install-server.sh` at:
`~/Library/LaunchAgents/com.pai.server.plist`

```bash
# Start
launchctl load ~/Library/LaunchAgents/com.pai.server.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.pai.server.plist
```

**Linux (systemd):**

Service file created by `install-server.sh` at:
`~/.config/systemd/user/pai-server.service`

```bash
# Start
systemctl --user start pai-server

# Status
systemctl --user status pai-server

# Logs
journalctl --user -u pai-server -f
```

## Development

```bash
# Hot reload
bun --hot src/server.ts

# Type check
bun run tsc --noEmit

# Build
bun build src/server.ts --outdir dist --target node
```

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Register device
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Device","type":"desktop","platform":"macos"}'

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello PAI"}'

# Test voice
curl -X POST http://localhost:3000/api/voice/test \
  -H "Content-Type: application/json" \
  -d '{"text":"Testing voice"}'
```

## Architecture

```
pai-server/
├── src/
│   ├── api/
│   │   └── routes.ts           # API route handlers
│   ├── auth/
│   │   └── device-auth.ts      # Device authentication
│   ├── core/
│   │   └── pai-core.ts         # PAI integration layer
│   ├── voice/
│   │   ├── manager.ts          # Voice provider manager
│   │   └── providers/
│   │       ├── base.ts         # Base provider interface
│   │       ├── macos.ts        # macOS native voices
│   │       ├── windows.ts      # Windows SAPI
│   │       ├── android.ts      # Termux TTS
│   │       └── elevenlabs.ts   # ElevenLabs API
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   └── server.ts               # Main server entry
├── package.json
└── README.md
```

## Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PAI_SERVER_PORT=3001 bun src/server.ts
```

### Voice Not Working

1. Check available providers:
   ```bash
   curl http://localhost:3000/api/voice/providers
   ```

2. Test voice:
   ```bash
   curl -X POST http://localhost:3000/api/voice/test \
     -d '{"text":"test"}'
   ```

3. Check logs for errors

### Can't Connect from Other Devices

1. Verify server is listening on network:
   ```bash
   # .env should have:
   PAI_SERVER_HOST=0.0.0.0
   ```

2. Check firewall:
   ```bash
   # macOS
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add bun

   # Linux
   sudo ufw allow 3000/tcp
   ```

3. Find server IP:
   ```bash
   ifconfig | grep "inet "
   ```

## Performance

- **Response Time:** < 100ms for API calls (excluding AI processing)
- **WebSocket:** Real-time streaming
- **Voice Latency:**
  - Native: < 100ms
  - ElevenLabs: ~500ms (network)
- **Concurrent Connections:** Unlimited (Fastify handles high throughput)

## Security

- Device fingerprinting for trusted devices
- Token-based authentication
- Rate limiting (coming soon)
- CORS protection
- Input sanitization
- HTTPS support (configure with TLS_CERT and TLS_KEY)

## License

MIT - See repository root for details
