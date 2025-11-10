#!/usr/bin/env bash
#
# PAI Quick Start Script
# Simplified setup for first-time users
#

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║            PAI Quick Start Setup                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Determine PAI directory
PAI_DIR="${PAI_DIR:-$HOME/.pai}"

if [ ! -d "$PAI_DIR" ]; then
    echo "❌ PAI not found at $PAI_DIR"
    echo ""
    echo "Run the full installer first:"
    echo "  bash install-server.sh"
    exit 1
fi

cd "$PAI_DIR"

echo "🎯 PAI Quick Start Menu"
echo ""
echo "What would you like to do?"
echo ""
echo "  1) Start PAI Server"
echo "  2) Stop PAI Server"
echo "  3) Restart PAI Server"
echo "  4) View Server Logs"
echo "  5) Check Server Status"
echo "  6) Start PWA (Development)"
echo "  7) Configure API Keys"
echo "  8) Test Voice System"
echo "  9) View Network IP (for mobile access)"
echo "  0) Exit"
echo ""

read -p "Enter choice [0-9]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting PAI Server..."
        cd "$PAI_DIR/pai-server"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            launchctl load ~/Library/LaunchAgents/com.pai.server.plist 2>/dev/null || true
            echo "✓ Server started (macOS launchd)"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            systemctl --user start pai-server
            echo "✓ Server started (systemd)"
        else
            echo "Starting server manually..."
            bun src/server.ts &
            echo "✓ Server started (PID: $!)"
        fi

        echo ""
        echo "Access at: http://localhost:3000"
        ;;

    2)
        echo ""
        echo "🛑 Stopping PAI Server..."

        if [[ "$OSTYPE" == "darwin"* ]]; then
            launchctl unload ~/Library/LaunchAgents/com.pai.server.plist 2>/dev/null || true
            echo "✓ Server stopped"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            systemctl --user stop pai-server
            echo "✓ Server stopped"
        else
            pkill -f "bun.*server.ts" || echo "No server process found"
        fi
        ;;

    3)
        echo ""
        echo "🔄 Restarting PAI Server..."

        if [[ "$OSTYPE" == "darwin"* ]]; then
            launchctl unload ~/Library/LaunchAgents/com.pai.server.plist 2>/dev/null || true
            sleep 1
            launchctl load ~/Library/LaunchAgents/com.pai.server.plist
            echo "✓ Server restarted"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            systemctl --user restart pai-server
            echo "✓ Server restarted"
        else
            pkill -f "bun.*server.ts" || true
            sleep 1
            cd "$PAI_DIR/pai-server"
            bun src/server.ts &
            echo "✓ Server restarted (PID: $!)"
        fi
        ;;

    4)
        echo ""
        echo "📋 Server Logs (Ctrl+C to exit):"
        echo ""

        if [[ "$OSTYPE" == "darwin"* ]]; then
            tail -f ~/.pai/logs/server.log 2>/dev/null || echo "No logs found"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            journalctl --user -u pai-server -f
        else
            echo "Manual logs not available. Check terminal output."
        fi
        ;;

    5)
        echo ""
        echo "🏥 Checking Server Status..."
        echo ""

        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo "✅ Server is running"
            echo ""
            curl -s http://localhost:3000/health | bun -e "console.log(JSON.stringify(JSON.parse(await Bun.stdin.text()), null, 2))"
        else
            echo "❌ Server is not responding"
            echo ""
            echo "Try:"
            echo "  ./quickstart.sh → Option 1 (Start Server)"
        fi
        ;;

    6)
        echo ""
        echo "🌐 Starting PWA (Development Mode)..."
        cd "$PAI_DIR/pai-web"

        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            bun install
        fi

        echo ""
        echo "Starting dev server on http://localhost:5173"
        echo "Press Ctrl+C to stop"
        echo ""
        bun run dev
        ;;

    7)
        echo ""
        echo "🔑 Configure API Keys"
        echo ""

        if [ ! -f "$PAI_DIR/.env" ]; then
            cp "$PAI_DIR/.env.example" "$PAI_DIR/.env"
            echo "Created .env file from template"
        fi

        echo "Opening .env file in editor..."
        echo ""
        echo "Add your API keys:"
        echo "  ANTHROPIC_API_KEY    - Claude AI (https://console.anthropic.com/)"
        echo "  GOOGLE_API_KEY       - Gemini + Google Home (https://aistudio.google.com/app/apikey)"
        echo "  ELEVENLABS_API_KEY   - Premium voice (optional)"
        echo ""

        ${EDITOR:-nano} "$PAI_DIR/.env"

        echo ""
        echo "✓ Configuration saved"
        echo "  Restart server to apply changes: ./quickstart.sh → Option 3"
        ;;

    8)
        echo ""
        echo "🎙️ Testing Voice System..."
        echo ""

        # Check available providers
        echo "Available voice providers:"
        curl -s http://localhost:3000/api/voice/providers | bun -e "console.log(JSON.stringify(JSON.parse(await Bun.stdin.text()), null, 2))"

        echo ""
        read -p "Test voice now? (y/n): " test_voice

        if [[ "$test_voice" == "y" ]]; then
            echo ""
            echo "Speaking: 'PAI voice system test successful'"
            curl -s -X POST http://localhost:3000/api/voice/test \
                -H "Content-Type: application/json" \
                -d '{"text":"PAI voice system test successful"}' | bun -e "console.log(JSON.stringify(JSON.parse(await Bun.stdin.text()), null, 2))"
        fi
        ;;

    9)
        echo ""
        echo "📱 Network Information (for mobile access)"
        echo ""

        if [[ "$OSTYPE" == "darwin"* ]]; then
            IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
        else
            IP=$(hostname -I | awk '{print $1}')
        fi

        echo "Your server IP: $IP"
        echo ""
        echo "Access from mobile device:"
        echo "  http://$IP:3000"
        echo ""
        echo "QR Code (scan with phone):"
        echo ""

        # Try to generate QR code if qrencode is available
        if command -v qrencode &> /dev/null; then
            qrencode -t ansiutf8 "http://$IP:3000"
        else
            echo "Install qrencode for QR code:"
            echo "  macOS:  brew install qrencode"
            echo "  Linux:  sudo apt install qrencode"
        fi
        ;;

    0)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;

    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
