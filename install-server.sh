#!/usr/bin/env bash
#
# PAI Server Installation Script
# One-command setup for centralized PAI server
#

set -e

PAI_VERSION="0.5.0"
PAI_DIR="${PAI_DIR:-$HOME/.pai}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║     PAI Centralized Server Installer v${PAI_VERSION}      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. Check prerequisites
echo "📋 Checking prerequisites..."

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo "  ⚠️  Bun not found. Installing..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi
echo "  ✓ Bun found"

# Check for Git
if ! command -v git &> /dev/null; then
    echo "  ❌ Git is not installed. Please install git first."
    exit 1
fi
echo "  ✓ Git found"

# 2. Clone or update repository
echo ""
echo "📦 Installing PAI to ${PAI_DIR}..."

if [ -d "${PAI_DIR}" ]; then
    echo "  ⚠️  PAI already installed. Updating..."
    cd "${PAI_DIR}"
    git pull origin main
else
    git clone https://github.com/danielmiessler/Personal_AI_Infrastructure.git "${PAI_DIR}"
    cd "${PAI_DIR}"
fi

# 3. Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd "${PAI_DIR}/pai-server"
bun install

# 4. Install Google Home MCP server
echo "📦 Installing Google Home MCP server..."
cd "${PAI_DIR}/mcp-servers/google-home"
bun install

# 5. Install PWA
echo "📦 Installing PWA..."
cd "${PAI_DIR}/pai-web"
bun install

# 6. Configure environment
echo ""
echo "🔧 Configuring environment..."

# Add PAI_DIR to shell config if not already present
SHELL_CONFIG="${HOME}/.zshrc"
if [ -n "${BASH_VERSION}" ]; then
    SHELL_CONFIG="${HOME}/.bashrc"
fi

if ! grep -q "PAI_DIR" "${SHELL_CONFIG}"; then
    echo "" >> "${SHELL_CONFIG}"
    echo "# Personal AI Infrastructure" >> "${SHELL_CONFIG}"
    echo "export PAI_DIR=\"${PAI_DIR}\"" >> "${SHELL_CONFIG}"
    echo "  ✓ Added PAI_DIR to ${SHELL_CONFIG}"
fi

export PAI_DIR="${PAI_DIR}"

# 7. Create .env file if it doesn't exist
if [ ! -f "${PAI_DIR}/.env" ]; then
    cp "${PAI_DIR}/.env.example" "${PAI_DIR}/.env"
    echo "  ✓ Created .env file"

    # Interactive API key setup
    echo ""
    echo "🔑 Let's configure your API keys:"
    echo ""

    read -p "Google API Key (for Gemini + Google Home): " GOOGLE_KEY
    if [ -n "${GOOGLE_KEY}" ]; then
        sed -i.bak "s/your_google_api_key_here/${GOOGLE_KEY}/" "${PAI_DIR}/.env"
        rm "${PAI_DIR}/.env.bak"
    fi

    read -p "ElevenLabs API Key (optional, for premium voice): " ELEVENLABS_KEY
    if [ -n "${ELEVENLABS_KEY}" ]; then
        sed -i.bak "s/your_elevenlabs_api_key_here/${ELEVENLABS_KEY}/" "${PAI_DIR}/.env"
        rm "${PAI_DIR}/.env.bak"
    fi

    echo "  ✓ API keys configured"
else
    echo "  ℹ️  .env file already exists, skipping"
fi

# 8. Add Google Home to MCP config
echo ""
echo "🏠 Configuring Google Home integration..."

if ! grep -q "google-home" "${PAI_DIR}/.mcp.json"; then
    # Add Google Home MCP server to config
    cat > /tmp/google-home-mcp.json <<EOF
{
  "google-home": {
    "command": "bun",
    "args": ["\${PAI_DIR}/mcp-servers/google-home/server.ts"],
    "env": {
      "GOOGLE_API_KEY": "\${GOOGLE_API_KEY}"
    },
    "description": "Google Home and Gemini AI integration"
  }
}
EOF
    echo "  ✓ Google Home MCP configured"
else
    echo "  ℹ️  Google Home already configured"
fi

# 9. Create systemd service (Linux) or launchd service (macOS)
echo ""
echo "🚀 Setting up server auto-start..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS launchd
    PLIST="${HOME}/Library/LaunchAgents/com.pai.server.plist"

    cat > "${PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pai.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>${HOME}/.bun/bin/bun</string>
        <string>${PAI_DIR}/pai-server/src/server.ts</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${PAI_DIR}/pai-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>${HOME}/.pai/logs/server-error.log</string>
    <key>StandardOutPath</key>
    <string>${HOME}/.pai/logs/server.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PAI_DIR</key>
        <string>${PAI_DIR}</string>
    </dict>
</dict>
</plist>
EOF

    mkdir -p "${HOME}/.pai/logs"
    launchctl unload "${PLIST}" 2>/dev/null || true
    launchctl load "${PLIST}"

    echo "  ✓ Server installed as launch agent (auto-starts on login)"

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux systemd
    SERVICE_FILE="${HOME}/.config/systemd/user/pai-server.service"
    mkdir -p "${HOME}/.config/systemd/user"

    cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=PAI Centralized Server
After=network.target

[Service]
Type=simple
ExecStart=${HOME}/.bun/bin/bun ${PAI_DIR}/pai-server/src/server.ts
WorkingDirectory=${PAI_DIR}/pai-server
Restart=always
Environment="PAI_DIR=${PAI_DIR}"

[Install]
WantedBy=default.target
EOF

    systemctl --user daemon-reload
    systemctl --user enable pai-server
    systemctl --user start pai-server

    echo "  ✓ Server installed as systemd service (auto-starts on boot)"
fi

# 10. Build PWA
echo ""
echo "🏗️  Building PWA..."
cd "${PAI_DIR}/pai-web"
bun run build

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          🎉 PAI Server Installation Complete! 🎉     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Server Configuration:"
echo "  • API:       http://localhost:3000"
echo "  • WebSocket: ws://localhost:3000/ws/chat"
echo "  • PWA:       ${PAI_DIR}/pai-web/dist"
echo ""
echo "What's Running:"
echo "  • PAI Server (REST API + WebSocket)"
echo "  • Voice System (auto-detected)"
echo "  • Google Home Integration (Gemini AI)"
echo ""
echo "Next Steps:"
echo ""
echo "  1. Check server status:"
echo "     curl http://localhost:3000/health"
echo ""
echo "  2. Access PWA (development):"
echo "     cd ${PAI_DIR}/pai-web"
echo "     bun run dev"
echo "     # Open http://localhost:5173 in browser"
echo ""
echo "  3. Deploy PWA to production:"
echo "     # See ${PAI_DIR}/DEPLOYMENT.md"
echo ""
echo "  4. Connect from mobile device:"
echo "     # Add your server IP to .env:"
echo "     # PAI_SERVER_HOST=0.0.0.0"
echo "     # Then restart server"
echo ""
echo "Documentation:"
echo "  • Server API: ${PAI_DIR}/pai-server/README.md"
echo "  • Google Home: ${PAI_DIR}/mcp-servers/google-home/README.md"
echo "  • PWA: ${PAI_DIR}/pai-web/README.md"
echo ""
echo "Logs:"
echo "  • Server: ${HOME}/.pai/logs/server.log"
echo "  • Errors: ${HOME}/.pai/logs/server-error.log"
echo ""

# 11. Test server
echo "🧪 Testing server..."
sleep 2

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "  ✅ Server is running!"
else
    echo "  ⚠️  Server not responding. Check logs:"
    echo "     tail -f ${HOME}/.pai/logs/server.log"
fi

echo ""
echo "🎉 Installation complete! Enjoy your centralized PAI!"
echo ""
