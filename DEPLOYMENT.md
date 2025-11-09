# PAI Deployment Guide

Complete guide for deploying your centralized PAI system across devices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Your Home Network                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Main Server (Desktop/Laptop)                   │  │
│  │   - PAI Server (REST API on :3000)               │  │
│  │   - Voice System (auto-detected)                 │  │
│  │   - Google Home Integration                      │  │
│  │   - All PAI Core Logic                           │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                     │
│        ┌──────────┴──────────┐                         │
│        │                     │                          │
│  ┌─────▼─────┐        ┌─────▼─────┐                   │
│  │  Phone    │        │  Tablet   │                    │
│  │  (PWA)    │        │  (PWA)    │                    │
│  └───────────┘        └───────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Quick Install (Recommended)

```bash
# One-command installation
curl -fsSL https://raw.githubusercontent.com/danielmiessler/Personal_AI_Infrastructure/main/install-server.sh | bash
```

### Manual Installation

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

## Configuration

### Environment Variables

Edit `~/.pai/.env`:

```bash
# Required for Google Home integration
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Premium voice (if not using native TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional: Google Home device IP
GOOGLE_HOME_IP=192.168.1.XXX

# Server configuration
PAI_SERVER_PORT=3000
PAI_SERVER_HOST=0.0.0.0  # Allow network access
LOG_LEVEL=info
```

### Google Home Setup

1. **Get Google API Key**:
   - Visit https://aistudio.google.com/app/apikey
   - Create new API key
   - Add to `.env` as `GOOGLE_API_KEY`

2. **Find Google Home IP** (optional, for TTS):
   ```bash
   # Method 1: Check router DHCP clients
   # Method 2: Use nmap
   nmap -sn 192.168.1.0/24 | grep -i "Google"
   ```

3. **Add to `.env`**:
   ```bash
   GOOGLE_HOME_IP=192.168.1.XXX
   ```

## Deployment Options

### Option 1: Home Server (Recommended)

Run PAI server on your main desktop/laptop at home.

**Pros:**
- Free hosting
- Complete control
- Low latency
- No data leaves your network

**Cons:**
- Requires server to be running
- Limited to home network (without VPN/port forwarding)

**Setup:**

1. Install PAI server on your main computer
2. Start server (auto-starts on boot)
3. Connect devices on same network

**Access from mobile:**
```
http://YOUR_SERVER_IP:3000
```

### Option 2: VPS/Cloud Server

Deploy PAI to a cloud server for access from anywhere.

**Recommended Providers:**
- **Railway.app** - $5/month, easy deployment
- **DigitalOcean** - $6/month droplet
- **AWS EC2** - Free tier available
- **Google Cloud** - Free tier available

**Setup (Railway):**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy server
cd ~/.pai/pai-server
railway init
railway up

# 4. Add environment variables
railway variables set PAI_DIR=/app
railway variables set GOOGLE_API_KEY=your_key

# 5. Deploy
railway deploy
```

**Setup (Docker):**

```dockerfile
# Dockerfile
FROM oven/bun:1
WORKDIR /app

# Copy server
COPY pai-server ./pai-server
COPY mcp-servers ./mcp-servers
COPY .env .env
COPY skills ./skills
COPY agents ./agents

# Install dependencies
WORKDIR /app/pai-server
RUN bun install

# Expose port
EXPOSE 3000

# Start server
ENV PAI_DIR=/app
CMD ["bun", "src/server.ts"]
```

```bash
# Build and run
docker build -t pai-server .
docker run -p 3000:3000 --env-file .env pai-server
```

### Option 3: Tailscale (Best of Both Worlds)

Use Tailscale to access your home server from anywhere securely.

**Pros:**
- Home server + remote access
- Zero-config VPN
- Free for personal use
- End-to-end encrypted

**Setup:**

```bash
# 1. Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Install Tailscale on mobile devices
# Download from App Store/Play Store

# 3. Access PAI from anywhere
# Use server's Tailscale IP (e.g., 100.x.x.x:3000)
```

## PWA Deployment

### Development

```bash
cd ~/.pai/pai-web
bun run dev
# Open http://localhost:5173
```

### Production Build

```bash
cd ~/.pai/pai-web
bun run build
# Outputs to dist/
```

### Hosting Options

#### Option 1: Serve from PAI Server

Add static file serving to server:

```typescript
// pai-server/src/server.ts
import fastifyStatic from '@fastify/static'

server.register(fastifyStatic, {
  root: join(PAI_DIR, 'pai-web/dist'),
  prefix: '/',
})
```

Access at: `http://localhost:3000`

#### Option 2: Vercel (Free)

```bash
cd ~/.pai/pai-web
npm install -g vercel
vercel login
vercel deploy --prod
```

Update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://YOUR_SERVER_IP:3000',  // Your PAI server
        changeOrigin: true,
      },
    },
  },
})
```

#### Option 3: Netlify (Free)

```bash
cd ~/.pai/pai-web
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Add `_redirects` file:
```
/api/*  http://YOUR_SERVER_IP:3000/api/:splat  200
```

## Device Registration

### Automatic (PWA)

When you open the PWA for the first time, it automatically registers your device.

### Manual (API)

```bash
curl -X POST http://YOUR_SERVER:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "type": "mobile",
    "platform": "ios"
  }'
```

Save the returned token for API requests.

## Security

### Network Access

**Local Network Only (Default):**
```bash
# .env
PAI_SERVER_HOST=localhost
```

**All Devices on Network:**
```bash
# .env
PAI_SERVER_HOST=0.0.0.0
```

**Internet Access:**
- Use Tailscale (recommended)
- Or configure port forwarding + HTTPS

### HTTPS Setup

For production deployment with HTTPS:

```bash
# Generate certificate (Let's Encrypt)
sudo certbot certonly --standalone -d pai.yourdomain.com

# Update server config
# .env
ENABLE_TLS=true
TLS_CERT=/etc/letsencrypt/live/pai.yourdomain.com/fullchain.pem
TLS_KEY=/etc/letsencrypt/live/pai.yourdomain.com/privkey.pem
```

### Firewall Rules

```bash
# Allow PAI server
sudo ufw allow 3000/tcp

# For HTTPS
sudo ufw allow 443/tcp
```

## Monitoring

### Server Status

```bash
# Health check
curl http://localhost:3000/health

# View logs (macOS)
tail -f ~/.pai/logs/server.log

# View logs (Linux systemd)
journalctl --user -u pai-server -f
```

### Service Management

**macOS:**
```bash
# Start
launchctl load ~/Library/LaunchAgents/com.pai.server.plist

# Stop
launchctl unload ~/Library/LaunchAgents/com.pai.server.plist

# Restart
launchctl unload ~/Library/LaunchAgents/com.pai.server.plist
launchctl load ~/Library/LaunchAgents/com.pai.server.plist
```

**Linux:**
```bash
# Start
systemctl --user start pai-server

# Stop
systemctl --user stop pai-server

# Restart
systemctl --user restart pai-server

# Status
systemctl --user status pai-server
```

## Troubleshooting

### Server Won't Start

1. **Check logs:**
   ```bash
   # macOS
   cat ~/.pai/logs/server-error.log

   # Linux
   journalctl --user -u pai-server
   ```

2. **Verify dependencies:**
   ```bash
   cd ~/.pai/pai-server
   bun install
   ```

3. **Check port availability:**
   ```bash
   lsof -i :3000
   # Kill if needed
   kill -9 <PID>
   ```

### Can't Connect from Mobile

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify server is listening on network:**
   ```bash
   # .env should have:
   PAI_SERVER_HOST=0.0.0.0
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp
   ```

4. **Find server IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   # or
   ip addr show
   ```

### Voice Not Working

1. **Check voice providers:**
   ```bash
   curl http://localhost:3000/api/voice/providers
   ```

2. **Test voice:**
   ```bash
   curl -X POST http://localhost:3000/api/voice/test \
     -H "Content-Type: application/json" \
     -d '{"text":"Testing voice"}'
   ```

3. **Platform-specific:**
   - **macOS:** Ensure `say` command works
   - **Windows:** Check PowerShell permissions
   - **Android:** Install termux-api package
   - **Fallback:** Add ELEVENLABS_API_KEY to .env

### Google Home Integration Issues

1. **Check API key:**
   ```bash
   # Verify in .env
   cat ~/.pai/.env | grep GOOGLE_API_KEY
   ```

2. **Test Gemini:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Ask Gemini what is 2+2"}'
   ```

3. **Check Google Home IP:**
   ```bash
   # Ping your Google Home
   ping 192.168.1.XXX
   ```

## Updating

```bash
cd ~/.pai
git pull origin main

# Update server
cd pai-server
bun install

# Update Google Home MCP
cd ../mcp-servers/google-home
bun install

# Update PWA
cd ../../pai-web
bun install
bun run build

# Restart server
# macOS
launchctl unload ~/Library/LaunchAgents/com.pai.server.plist
launchctl load ~/Library/LaunchAgents/com.pai.server.plist

# Linux
systemctl --user restart pai-server
```

## Performance Tuning

### Server Resources

```bash
# .env
LOG_LEVEL=warn  # Reduce logging overhead
```

### PWA Caching

PWA automatically caches for offline use. To clear cache:

1. Open DevTools (F12)
2. Application → Clear Storage
3. Clear all

### Voice Latency

For lowest latency:
- Use native voice providers (macOS, Windows, Android)
- ElevenLabs adds ~500ms network latency

## Backup & Restore

### Backup Configuration

```bash
# Backup entire PAI directory
tar -czf pai-backup-$(date +%Y%m%d).tar.gz ~/.pai

# Backup just config
cp ~/.pai/.env ~/pai-env-backup
cp ~/.pai/.mcp.json ~/pai-mcp-backup
```

### Restore

```bash
# Restore from backup
tar -xzf pai-backup-YYYYMMDD.tar.gz -C ~/

# Restart server
systemctl --user restart pai-server  # Linux
# or
launchctl load ~/Library/LaunchAgents/com.pai.server.plist  # macOS
```

## Support

- **Documentation:** https://github.com/danielmiessler/Personal_AI_Infrastructure
- **Issues:** https://github.com/danielmiessler/Personal_AI_Infrastructure/issues
- **Discord:** (Coming soon)

---

**Deployment Checklist:**

- [ ] Server installed and running
- [ ] Environment variables configured
- [ ] Google Home integration tested
- [ ] Voice system working
- [ ] PWA built and deployed
- [ ] Mobile devices can connect
- [ ] Backups configured
- [ ] Auto-start configured
- [ ] Firewall rules set
- [ ] HTTPS configured (if public)
