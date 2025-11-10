# PAI - Personal AI Infrastructure

<div align="center">

![PAI Banner](./pai-logo.png)

**Your Personal AI, Everywhere**

[![Version](https://img.shields.io/badge/version-0.5.0-blue)](https://github.com/danielmiessler/Personal_AI_Infrastructure)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](#platform-support)

**Access your AI assistant from any device** • **Cross-platform voice** • **Google Home integration** • **100% private**

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 🎯 What's New in v0.5.0

**Centralized Architecture** - PAI is now a client-server system:

✨ **Access from anywhere** - Phone, tablet, laptop, desktop
🎙️ **Cross-platform voice** - macOS, Windows, Android, ElevenLabs
🏠 **Google Home integration** - Control your smart home + Gemini AI
📱 **Progressive Web App** - Install on any device
🔐 **Trusted devices only** - Your personal AI stays private
⚡ **One-command install** - Up and running in 2 minutes

---

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

```bash
# Clone repository
git clone https://github.com/danielmiessler/Personal_AI_Infrastructure.git ~/.pai
cd ~/.pai

# Run installer
bash install-server.sh

# Follow prompts to configure API keys
```

**That's it!** Server starts automatically and PWA is ready.

### Option 2: Manual Installation

```bash
# 1. Clone repository
git clone https://github.com/danielmiessler/Personal_AI_Infrastructure.git ~/.pai
cd ~/.pai

# 2. Install dependencies
cd pai-server && bun install
cd ../mcp-servers/google-home && bun install
cd ../../pai-web && bun install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start server
cd pai-server
bun src/server.ts
```

### First Time Setup

After installation:

1. **Get API Keys** (all optional):
   ```bash
   # Anthropic Claude (for AI chat)
   https://console.anthropic.com/

   # Google Gemini (for Google Home + research)
   https://aistudio.google.com/app/apikey
   ```

2. **Access PWA**:
   ```bash
   # Development
   cd pai-web
   bun run dev
   # Open http://localhost:5173

   # Or access server directly
   http://localhost:3000
   ```

3. **From mobile device** (same network):
   ```bash
   # Find your server IP
   ifconfig | grep "inet "

   # Access from phone/tablet
   http://YOUR_IP:3000
   ```

---

## ✨ Features

### 🤖 AI Capabilities

- **9 Specialized Skills**: Research, Development, Security, Design, and more
- **8 AI Agents**: Engineer, Researcher, Architect, Designer, Pentester, etc.
- **Multi-Model Support**: Claude, Gemini, Perplexity
- **MCP Integration**: 10+ external services (Stripe, BrightData, Apify, etc.)

### 📱 Platform Support

| Platform | Interface | Voice | Status |
|----------|-----------|-------|--------|
| **iOS** | PWA | Native (via API) | ✅ |
| **Android** | PWA | Termux TTS | ✅ |
| **macOS** | PWA + CLI | Premium Voices | ✅ |
| **Windows** | PWA + CLI | SAPI | ✅ |
| **Linux** | PWA + CLI | espeak/Festival | ✅ |

### 🏠 Smart Home

- **Google Home Control**: TTS announcements to your devices
- **Gemini AI Integration**: Same AI that powers Google Home
- **Vision AI**: Analyze images with Gemini Vision
- **Multi-turn Conversations**: Contextual AI discussions

### 🔐 Security & Privacy

- ✅ **Trusted Devices Only** - Register your devices
- ✅ **Local-First** - Runs on your network
- ✅ **Optional Cloud** - Deploy to VPS if needed
- ✅ **No Tracking** - Your data stays yours
- ✅ **Open Source** - Audit the code

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Your Devices                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  iPhone  │  │  Android │  │  Laptop  │             │
│  │   PWA    │  │   PWA    │  │   PWA    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        │  HTTPS + Token Auth
        │             │             │
┌───────▼─────────────▼─────────────▼───────────────────┐
│              PAI Server (Main Computer)                │
│  ┌──────────────────────────────────────────────┐     │
│  │  REST API (:3000)                            │     │
│  │  - Chat processing                            │     │
│  │  - Voice synthesis                            │     │
│  │  - Device management                          │     │
│  └────────────────┬─────────────────────────────┘     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  Voice Manager (Auto-detect)                 │     │
│  │  macOS | Windows | Android | ElevenLabs      │     │
│  └────────────────┬─────────────────────────────┘     │
│  ┌────────────────▼─────────────────────────────┐     │
│  │  PAI Core                                    │     │
│  │  Skills • Agents • Hooks • MCP Servers       │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────┬───────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │  Integrations       │
          │  - Google Home      │
          │  - Gemini AI        │
          │  - Stripe           │
          │  - BrightData       │
          └─────────────────────┘
```

---

## 📚 Documentation

### Core Guides

- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to home server, VPS, or Tailscale
- **[Server API](pai-server/README.md)** - REST API endpoints and usage
- **[Google Home](mcp-servers/google-home/README.md)** - Smart home integration
- **[Mobile Review](MOBILE_PLATFORM_REVIEW.md)** - Architecture decisions

### Component Documentation

```
.
├── pai-server/          # Central API server
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── auth/        # Device authentication
│   │   ├── core/        # PAI integration
│   │   └── voice/       # Cross-platform TTS
│   └── README.md
│
├── pai-web/             # Progressive Web App
│   ├── src/
│   │   ├── App.vue      # Main chat interface
│   │   └── main.ts      # App entry point
│   └── vite.config.ts
│
├── mcp-servers/         # MCP integrations
│   └── google-home/     # Google Home + Gemini
│       ├── server.ts
│       └── README.md
│
├── skills/              # 9 capability packages
├── agents/              # 8 AI personas
├── commands/            # Workflow automation
└── hooks/               # Event-driven system
```

---

## 🎮 Usage Examples

### Chat from Mobile

```typescript
// PWA automatically registers your device
// Just open http://YOUR_SERVER_IP:3000

// Start chatting
"What's the weather in San Francisco?"
"Research the latest AI news"
"Help me write a Python function"
```

### Google Home Control

```
"Announce 'Dinner is ready' on Google Home"
→ ✓ Announced on Google Home

"Ask Gemini to explain quantum computing"
→ [Gemini explains quantum computing]

"What's in this image?" [upload photo]
→ [Gemini Vision analyzes the image]
```

### Voice Across Platforms

```bash
# macOS - Premium voices (free)
Kai speaks: "Task completed" (Jamie Premium voice)

# Windows - SAPI voices (free)
Kai speaks: "Task completed" (Microsoft David)

# Android - Termux TTS (free)
Kai speaks: "Task completed" (Google TTS)

# Fallback - ElevenLabs (paid, premium)
Kai speaks: "Task completed" (AI voice)
```

### API Usage

```bash
# Register device
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "type": "mobile",
    "platform": "ios"
  }'

# Chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello PAI",
    "voiceEnabled": true
  }'

# List skills
curl http://localhost:3000/api/skills

# Test voice
curl -X POST http://localhost:3000/api/voice/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing voice"}'
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required for full AI capabilities
ANTHROPIC_API_KEY=sk-ant-...        # Claude AI
GOOGLE_API_KEY=AIza...              # Gemini + Google Home

# Optional services
PERPLEXITY_API_KEY=...              # Research agent
ELEVENLABS_API_KEY=...              # Premium voice
GOOGLE_HOME_IP=192.168.1.100        # Google Home device

# Server configuration
PAI_SERVER_PORT=3000                # API port
PAI_SERVER_HOST=0.0.0.0             # Network access
LOG_LEVEL=info                      # Logging verbosity
```

### Skills & Agents

**Available Skills:**
- `research` - Multi-source research (Perplexity, Claude, Gemini)
- `fabric` - 242+ AI patterns (summarization, analysis, extraction)
- `development` - Full-stack development with TDD
- `ffuf` - Web fuzzing and pentesting
- `web-scraping` - Data extraction (BrightData, Apify)
- `prompting` - Prompt engineering best practices
- `create-skill` - Create new skills
- `alex-hormozi-pitch` - $100M Offers framework
- `chrome-devtools` - Browser automation

**Available Agents:**
- `kai` - Your default personal assistant
- `engineer` - Software development expert
- `researcher` - Information gathering specialist
- `architect` - System design and architecture
- `designer` - UX/UI and visual design
- `pentester` - Security and penetration testing
- `perplexity-researcher` - Perplexity API specialist
- `claude-researcher` - Claude WebSearch specialist
- `gemini-researcher` - Gemini multi-perspective analyst

---

## 🚢 Deployment Options

### 1. Home Server (Recommended)

Run PAI on your main desktop/laptop:

```bash
# Install and start
bash install-server.sh

# Access from any device on network
http://192.168.1.X:3000
```

**Pros:** Free, private, low latency
**Cons:** Limited to home network (unless using Tailscale)

### 2. Cloud VPS

Deploy to Railway, DigitalOcean, AWS, etc:

```bash
# Example: Railway
railway init
railway up

# Your PAI at: https://your-app.railway.app
```

**Pros:** Access from anywhere
**Cons:** ~$5-10/month, data leaves your network

### 3. Tailscale VPN (Best of Both)

Home server + remote access:

```bash
# Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Access from anywhere via Tailscale IP
http://100.x.x.x:3000
```

**Pros:** Free, secure, private, remote access
**Cons:** Requires Tailscale on all devices

---

## 🧪 Testing

```bash
# Test server health
curl http://localhost:3000/health

# Test voice providers
curl http://localhost:3000/api/voice/providers

# Test chat (without API key)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# View logs
tail -f ~/.pai/logs/server.log
```

---

## 🆘 Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :3000

# Check logs
tail -f ~/.pai/logs/server-error.log

# Restart server (macOS)
launchctl unload ~/Library/LaunchAgents/com.pai.server.plist
launchctl load ~/Library/LaunchAgents/com.pai.server.plist

# Restart server (Linux)
systemctl --user restart pai-server
```

### Can't Connect from Mobile

```bash
# Ensure server listens on network
# In .env:
PAI_SERVER_HOST=0.0.0.0

# Check firewall
sudo ufw allow 3000/tcp

# Find server IP
ifconfig | grep "inet "
```

### Voice Not Working

```bash
# Check available providers
curl http://localhost:3000/api/voice/providers

# macOS: Ensure 'say' works
say "test"

# Windows: Check PowerShell
powershell -Command "Add-Type -AssemblyName System.Speech"

# Android: Install termux-api
pkg install termux-api

# Fallback: Use ElevenLabs
# Add ELEVENLABS_API_KEY to .env
```

### Google Home Issues

```bash
# Test Gemini API
curl -X POST http://localhost:3000/api/chat \
  -d '{"message":"Ask Gemini what is 2+2"}'

# Find Google Home IP
nmap -sn 192.168.1.0/24 | grep -i "Google"

# Verify in .env
GOOGLE_HOME_IP=192.168.1.XXX
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas we need help:**
- Native mobile apps (iOS/Android)
- Additional MCP servers
- More voice providers
- Documentation improvements
- Testing and bug reports

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) - Claude AI
- [Google](https://ai.google.dev/) - Gemini AI
- [Daniel Miessler](https://danielmiessler.com) - Original PAI creator
- [Fabric](https://github.com/danielmiessler/fabric) - AI pattern framework

---

## 🔗 Links

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/danielmiessler/Personal_AI_Infrastructure/issues)
- **Discussions**: [GitHub Discussions](https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions)

---

<div align="center">

**Made with ❤️ for everyone who wants their own personal AI**

[Get Started](#-quick-start) • [Documentation](#-documentation) • [Community](#-contributing)

</div>
