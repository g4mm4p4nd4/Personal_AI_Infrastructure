#!/usr/bin/env bash
#
# PAI Test Suite
# Validates entire system installation
#

set -e

PAI_DIR="${PAI_DIR:-$HOME/.pai}"
FAILURES=0

echo "╔══════════════════════════════════════════════════════╗"
echo "║            PAI System Test Suite                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

function test_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILURES=$((FAILURES + 1))
}

function test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "🧪 Running system tests..."
echo ""

# Test 1: PAI Directory
echo "1. Checking PAI directory..."
if [ -d "$PAI_DIR" ]; then
    test_pass "PAI directory exists: $PAI_DIR"
else
    test_fail "PAI directory not found: $PAI_DIR"
fi

# Test 2: Required files
echo ""
echo "2. Checking required files..."
REQUIRED_FILES=(
    "pai-server/package.json"
    "pai-server/src/server.ts"
    "pai-web/package.json"
    "mcp-servers/google-home/package.json"
    ".env.example"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$PAI_DIR/$file" ]; then
        test_pass "$file"
    else
        test_fail "$file missing"
    fi
done

# Test 3: Dependencies installed
echo ""
echo "3. Checking dependencies..."

if [ -d "$PAI_DIR/pai-server/node_modules" ]; then
    test_pass "Server dependencies installed"
else
    test_warn "Server dependencies not installed (run: bun install)"
fi

if [ -d "$PAI_DIR/mcp-servers/google-home/node_modules" ]; then
    test_pass "Google Home dependencies installed"
else
    test_warn "Google Home dependencies not installed"
fi

# Test 4: Bun runtime
echo ""
echo "4. Checking Bun runtime..."
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    test_pass "Bun installed (v$BUN_VERSION)"
else
    test_fail "Bun not found (install from https://bun.sh)"
fi

# Test 5: Environment configuration
echo ""
echo "5. Checking environment configuration..."
if [ -f "$PAI_DIR/.env" ]; then
    test_pass ".env file exists"

    # Check for API keys
    if grep -q "ANTHROPIC_API_KEY=sk-" "$PAI_DIR/.env" 2>/dev/null; then
        test_pass "Anthropic API key configured"
    else
        test_warn "Anthropic API key not configured (optional)"
    fi

    if grep -q "GOOGLE_API_KEY=AIza" "$PAI_DIR/.env" 2>/dev/null; then
        test_pass "Google API key configured"
    else
        test_warn "Google API key not configured (optional)"
    fi
else
    test_warn ".env file not found (copy from .env.example)"
fi

# Test 6: Server health
echo ""
echo "6. Testing server..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    test_pass "Server is responding"

    # Get health data
    HEALTH=$(curl -s http://localhost:3000/health)

    # Check voice system
    if echo "$HEALTH" | grep -q '"available":true'; then
        VOICE_PROVIDER=$(echo "$HEALTH" | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)
        test_pass "Voice system active: $VOICE_PROVIDER"
    else
        test_warn "Voice system not available"
    fi

    # Check skills/agents
    SKILLS=$(echo "$HEALTH" | grep -o '"skills":[0-9]*' | cut -d':' -f2)
    AGENTS=$(echo "$HEALTH" | grep -o '"agents":[0-9]*' | cut -d':' -f2)
    test_pass "Skills loaded: $SKILLS"
    test_pass "Agents loaded: $AGENTS"
else
    test_fail "Server not responding (start with: ./quickstart.sh)"
fi

# Test 7: API endpoints
echo ""
echo "7. Testing API endpoints..."

if curl -s http://localhost:3000/api/skills > /dev/null 2>&1; then
    test_pass "GET /api/skills"
else
    test_fail "GET /api/skills failed"
fi

if curl -s http://localhost:3000/api/agents > /dev/null 2>&1; then
    test_pass "GET /api/agents"
else
    test_fail "GET /api/agents failed"
fi

if curl -s http://localhost:3000/api/voices > /dev/null 2>&1; then
    test_pass "GET /api/voices"
else
    test_fail "GET /api/voices failed"
fi

# Test 8: Voice providers
echo ""
echo "8. Testing voice providers..."

PROVIDERS=$(curl -s http://localhost:3000/api/voice/providers)
if echo "$PROVIDERS" | grep -q "macOS\|Windows\|Android\|ElevenLabs"; then
    AVAILABLE=$(echo "$PROVIDERS" | grep -o '"available":true' | wc -l)
    test_pass "Voice providers available: $AVAILABLE"
else
    test_warn "No voice providers detected"
fi

# Test 9: Auto-start configuration
echo ""
echo "9. Checking auto-start configuration..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -f ~/Library/LaunchAgents/com.pai.server.plist ]; then
        test_pass "macOS launch agent configured"
    else
        test_warn "macOS launch agent not configured"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f ~/.config/systemd/user/pai-server.service ]; then
        test_pass "systemd service configured"

        if systemctl --user is-enabled pai-server &> /dev/null; then
            test_pass "Service enabled for auto-start"
        else
            test_warn "Service not enabled"
        fi
    else
        test_warn "systemd service not configured"
    fi
fi

# Test 10: PWA build
echo ""
echo "10. Checking PWA..."

if [ -d "$PAI_DIR/pai-web/dist" ]; then
    test_pass "PWA built (production ready)"
else
    test_warn "PWA not built (run: cd pai-web && bun run build)"
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your PAI system is fully operational."
    echo ""
    echo "Next steps:"
    echo "  • Access server: http://localhost:3000"
    echo "  • Configure API keys: ./quickstart.sh → Option 7"
    echo "  • View logs: ./quickstart.sh → Option 4"
    exit 0
else
    echo -e "${RED}✗ $FAILURES test(s) failed${NC}"
    echo ""
    echo "Please fix the failures above and re-run:"
    echo "  bash test-system.sh"
    exit 1
fi
