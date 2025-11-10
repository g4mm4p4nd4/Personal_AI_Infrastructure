# Contributing to PAI

Thank you for your interest in contributing to Personal AI Infrastructure! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/danielmiessler/Personal_AI_Infrastructure/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System info (OS, Bun version, etc.)
   - Logs if applicable

### Suggesting Features

1. Check [Discussions](https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions) for similar ideas
2. Create a new discussion with:
   - Clear use case
   - Proposed solution
   - Alternatives considered
   - Any implementation ideas

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Personal_AI_Infrastructure.git
   cd Personal_AI_Infrastructure
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   # Install dependencies
   cd pai-server && bun install
   cd ../mcp-servers/google-home && bun install
   cd ../../pai-web && bun install

   # Start server
   cd pai-server
   bun src/server.ts

   # Run tests
   cd ..
   bash test-system.sh
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```

   Commit message format:
   - `Add: New feature`
   - `Fix: Bug description`
   - `Update: Component changes`
   - `Docs: Documentation updates`
   - `Refactor: Code improvements`

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## Development Setup

### Prerequisites

- **Bun** - https://bun.sh
- **Git**
- **Code editor** (VS Code recommended)

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/danielmiessler/Personal_AI_Infrastructure.git ~/.pai
cd ~/.pai
bash install-server.sh

# 2. Development server
cd pai-server
bun --hot src/server.ts

# 3. PWA development
cd ../pai-web
bun run dev

# 4. Test changes
bash test-system.sh
```

## Project Structure

```
Personal_AI_Infrastructure/
├── pai-server/           # Central API server
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── auth/        # Authentication
│   │   ├── core/        # PAI integration
│   │   ├── voice/       # Voice providers
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── pai-web/             # Progressive Web App
│   ├── src/
│   │   ├── App.vue      # Main component
│   │   └── main.ts
│   └── package.json
│
├── mcp-servers/         # MCP integrations
│   └── google-home/     # Google Home + Gemini
│
├── skills/              # Capability packages
├── agents/              # AI personas
├── commands/            # Workflows
└── hooks/               # Event system
```

## Coding Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Prefer `async/await` over callbacks
- Add JSDoc comments for public APIs
- Handle errors gracefully
- Validate user input

Example:
```typescript
/**
 * Process chat message
 * @param request - Chat request with message and options
 * @returns Chat response with AI-generated message
 */
async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Validate input
  if (!request.message?.trim()) {
    throw new Error('Message cannot be empty')
  }

  try {
    // Process with Claude API
    const response = await processWithClaude(request.message)
    return response
  } catch (error) {
    console.error('Chat error:', error)
    throw error
  }
}
```

### Vue Components

- Use `<script setup>` syntax
- Prefer Composition API
- Keep components focused and small
- Add TypeScript types

Example:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Message {
  id: string
  content: string
  timestamp: Date
}

const messages = ref<Message[]>([])

async function loadMessages() {
  const response = await fetch('/api/messages')
  messages.value = await response.json()
}

onMounted(loadMessages)
</script>
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error: any) {
  console.error('Operation failed:', error)

  // Provide helpful error message
  throw new Error(
    `Failed to complete operation: ${error.message}\n` +
    `Try: Check your API key configuration`
  )
}
```

## Areas We Need Help

### High Priority

- **Native Mobile Apps**
  - iOS app (SwiftUI)
  - Android app (Kotlin/Compose)
  - React Native implementation

- **Voice Providers**
  - Linux TTS support (espeak, Festival)
  - iOS native TTS
  - Android native TTS (without Termux)

- **MCP Servers**
  - Home Assistant integration
  - HomeKit bridge
  - Alexa skill
  - Additional smart home platforms

### Medium Priority

- **Testing**
  - Unit tests for core functions
  - Integration tests for API
  - E2E tests for PWA

- **Documentation**
  - Video tutorials
  - Architecture diagrams
  - API examples

- **Features**
  - Session persistence
  - Multi-user support
  - Conversation history
  - Skill marketplace

### Low Priority

- **Optimizations**
  - Caching layer
  - Response streaming
  - Bundle size reduction

- **Integrations**
  - More MCP servers
  - Additional AI models
  - External APIs

## Questions?

- **Discussions**: https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions
- **Issues**: https://github.com/danielmiessler/Personal_AI_Infrastructure/issues
- **Email**: (See profile)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
