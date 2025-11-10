# Mobile Access Guide

Complete guide for accessing PAI from mobile devices.

## Quick Setup

### Same Network Access

1. **Find your server IP**:
   ```bash
   # macOS/Linux
   ./quickstart.sh → Option 9

   # Or manually
   ifconfig | grep "inet "    # macOS/Linux
   ipconfig                   # Windows
   ```

2. **Access from mobile**:
   - Open browser on phone/tablet
   - Go to: `http://YOUR_SERVER_IP:3000`
   - Bookmark for easy access

3. **Install as app** (PWA):
   - iOS: Tap Share → Add to Home Screen
   - Android: Tap menu → Install app

## iOS Setup

### Via Safari

1. Open Safari
2. Navigate to `http://YOUR_SERVER_IP:3000`
3. Tap **Share button** (square with arrow)
4. Scroll and tap **Add to Home Screen**
5. Name it "PAI" and tap **Add**

Now you have a full-screen app!

### Features on iOS

- ✅ Full-screen app experience
- ✅ Offline support (cached)
- ✅ Voice output via server
- ✅ Camera access (for image analysis)
- ✅ Notifications (when enabled)

## Android Setup

### Via Chrome

1. Open Chrome
2. Navigate to `http://YOUR_SERVER_IP:3000`
3. Tap **menu** (three dots)
4. Tap **Install app** or **Add to Home screen**
5. Tap **Install**

### Features on Android

- ✅ Native app experience
- ✅ Offline support
- ✅ Voice output (Termux TTS if configured)
- ✅ Camera access
- ✅ Background sync

## Remote Access (Outside Home)

### Option 1: Tailscale (Recommended)

**Setup on server:**
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

**Setup on mobile:**
1. Install Tailscale app (iOS/Android)
2. Sign in with same account
3. Access PAI via Tailscale IP: `http://100.x.x.x:3000`

**Benefits:**
- ✅ Secure VPN tunnel
- ✅ Works anywhere
- ✅ Free for personal use
- ✅ Zero configuration

### Option 2: Port Forwarding

**Router setup:**
1. Open router admin (usually 192.168.1.1)
2. Find Port Forwarding settings
3. Forward external port 3000 → your server IP:3000
4. Access via: `http://YOUR_PUBLIC_IP:3000`

**Security considerations:**
- ⚠️ Exposes server to internet
- ⚠️ Recommend HTTPS + strong auth
- ⚠️ Use firewall rules
- ✅ Better: Use Tailscale instead

### Option 3: Cloudflare Tunnel

**Setup:**
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
sudo mv cloudflared /usr/local/bin
sudo chmod +x /usr/local/bin/cloudflared

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create pai
cloudflared tunnel route dns pai pai.yourdomain.com

# Run tunnel
cloudflared tunnel run pai
```

Access at: `https://pai.yourdomain.com`

**Benefits:**
- ✅ Free
- ✅ Automatic HTTPS
- ✅ No port forwarding
- ✅ DDoS protection

## Troubleshooting

### Can't Connect from Mobile

**Check 1: Server is running**
```bash
curl http://localhost:3000/health
```

**Check 2: Server listening on network**
```bash
# In .env file:
PAI_SERVER_HOST=0.0.0.0  # Not localhost!
```

**Check 3: Firewall**
```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add bun

# Linux
sudo ufw allow 3000/tcp

# Windows
netsh advfirewall firewall add rule name="PAI" dir=in action=allow protocol=TCP localport=3000
```

**Check 4: Same network**
- Ensure phone and server on same WiFi
- Check router settings
- Disable VPN on phone

### Slow Performance

**Optimize network:**
- Use 5GHz WiFi (faster than 2.4GHz)
- Place router closer to server
- Reduce network congestion

**Optimize server:**
```bash
# In .env
LOG_LEVEL=error  # Reduce logging
```

### Voice Not Working on Mobile

**Option 1: Server-side voice**
```typescript
// PWA sends message with voiceEnabled: true
// Server speaks on server machine
// (You hear it on server, not phone)
```

**Option 2: Client-side voice** (future enhancement)
```typescript
// Add to PWA:
const utterance = new SpeechSynthesisUtterance(text)
speechSynthesis.speak(utterance)
```

**Option 3: Send to Google Home**
```
"Announce [message] on Google Home"
```

## Advanced: Custom Domain

### Using ngrok (Development)

```bash
# Install ngrok
brew install ngrok  # macOS

# Start tunnel
ngrok http 3000

# Access via:
https://random-name.ngrok.io
```

### Using Custom Domain (Production)

**Requirements:**
- Domain name (e.g., pai.yourdomain.com)
- SSL certificate
- Reverse proxy (Caddy/nginx)

**Setup with Caddy:**
```bash
# Install Caddy
curl -fsSL https://getcaddy.com | bash

# Caddyfile
pai.yourdomain.com {
    reverse_proxy localhost:3000
}

# Start Caddy (auto HTTPS!)
caddy run
```

## Tips & Tricks

### Bookmark URLs

Create bookmarks for common tasks:
- `http://YOUR_IP:3000` - Main chat
- `http://YOUR_IP:3000/health` - Server status

### Siri Shortcuts (iOS)

1. Open Shortcuts app
2. Create new shortcut
3. Add "Open URL" action
4. URL: `http://YOUR_IP:3000`
5. Add to Home Screen

Now: "Hey Siri, open PAI"

### Android Quick Tile

1. Install app as PWA
2. Long-press home screen
3. Add widget → Chrome → PAI shortcut

### Offline Mode

PWA caches for offline use:
- Recent conversations
- Skills list
- Agents list
- UI assets

Works offline, syncs when reconnected!

## Security Best Practices

### For Home Network Access

- ✅ Use trusted devices only
- ✅ Regular software updates
- ✅ Strong WiFi password
- ✅ Disable router UPnP

### For Remote Access

- ✅ Use Tailscale (best option)
- ✅ Or use Cloudflare Tunnel
- ✅ Enable HTTPS
- ✅ Use strong authentication
- ✅ Monitor access logs

### API Key Security

- ❌ Never commit `.env` to git
- ❌ Don't share device tokens
- ✅ Rotate keys regularly
- ✅ Use environment variables
- ✅ Limit API key permissions

## Example Configurations

### Home Network Only

```bash
# .env
PAI_SERVER_HOST=0.0.0.0
PAI_SERVER_PORT=3000
```

Access: `http://192.168.1.X:3000`

### Tailscale Access

```bash
# .env
PAI_SERVER_HOST=100.x.x.x  # Tailscale IP
PAI_SERVER_PORT=3000
```

Access: `http://100.x.x.x:3000`

### Public Access (HTTPS)

```bash
# .env
PAI_SERVER_HOST=0.0.0.0
PAI_SERVER_PORT=3000
ENABLE_TLS=true
TLS_CERT=/etc/letsencrypt/live/pai.yourdomain.com/fullchain.pem
TLS_KEY=/etc/letsencrypt/live/pai.yourdomain.com/privkey.pem
```

Access: `https://pai.yourdomain.com`

## Support

Issues with mobile access?

1. Run diagnostics: `bash test-system.sh`
2. Check logs: `./quickstart.sh → Option 4`
3. Report issue: [GitHub Issues](https://github.com/danielmiessler/Personal_AI_Infrastructure/issues)
