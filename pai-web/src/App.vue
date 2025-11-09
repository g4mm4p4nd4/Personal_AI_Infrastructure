<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1>🧠 PAI</h1>
        <div class="status">
          <span v-if="connected" class="status-dot connected"></span>
          <span v-else class="status-dot disconnected"></span>
          <span>{{ connected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
    </header>

    <!-- Chat Messages -->
    <div class="messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome">
        <h2>Welcome to PAI</h2>
        <p>Your personal AI assistant, available anywhere</p>
        <div class="suggestions">
          <button @click="sendMessage('What can you help me with?')">
            What can you help me with?
          </button>
          <button @click="sendMessage('Show me my skills')">
            Show me my skills
          </button>
          <button @click="sendMessage('Test voice')">
            Test voice
          </button>
        </div>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="message-content">
          <div class="message-header">
            <span class="role">{{ msg.role === 'user' ? 'You' : 'PAI' }}</span>
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-text">{{ msg.content }}</div>
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="message-content">
          <div class="typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-container">
      <div class="input-wrapper">
        <input
          v-model="inputText"
          @keypress.enter="sendMessage()"
          placeholder="Ask me anything..."
          :disabled="loading"
        />
        <button
          @click="toggleVoice"
          :class="['voice-btn', { active: voiceEnabled }]"
          title="Toggle voice"
        >
          🎙️
        </button>
        <button
          @click="sendMessage()"
          :disabled="loading || !inputText.trim()"
          class="send-btn"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// State
const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const connected = ref(false)
const voiceEnabled = ref(true)
const messagesContainer = ref<HTMLElement>()

// API configuration
const API_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : window.location.origin

// Register device on mount
onMounted(async () => {
  await registerDevice()
  await checkConnection()
})

// Register this device
async function registerDevice() {
  try {
    const deviceInfo = {
      name: `${getPlatform()} Browser`,
      type: getDeviceType(),
      platform: getPlatform(),
    }

    const res = await fetch(`${API_URL}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceInfo),
    })

    if (res.ok) {
      const data = await res.json()
      // Store device token
      localStorage.setItem('pai_device_token', data.token)
      console.log('Device registered:', data.device)
    }
  } catch (error) {
    console.error('Failed to register device:', error)
  }
}

// Check connection
async function checkConnection() {
  try {
    const res = await fetch(`${API_URL}/health`)
    connected.value = res.ok
  } catch {
    connected.value = false
  }
}

// Send message
async function sendMessage(text?: string) {
  const message = text || inputText.value.trim()
  if (!message || loading.value) return

  // Add user message
  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: message,
    timestamp: new Date(),
  }
  messages.value.push(userMsg)
  inputText.value = ''
  loading.value = true

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        voiceEnabled: voiceEnabled.value,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send message')
    }

    const data = await res.json()

    // Add assistant message
    const assistantMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.message,
      timestamp: new Date(data.timestamp),
    }
    messages.value.push(assistantMsg)

    // Scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Chat error:', error)
    const errorMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '❌ Sorry, something went wrong. Please try again.',
      timestamp: new Date(),
    }
    messages.value.push(errorMsg)
  } finally {
    loading.value = false
  }
}

// Toggle voice
function toggleVoice() {
  voiceEnabled.value = !voiceEnabled.value
}

// Format time
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

// Scroll to bottom
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Get platform
function getPlatform(): 'ios' | 'android' | 'macos' | 'windows' | 'linux' {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Mac/.test(ua)) return 'macos'
  if (/Win/.test(ua)) return 'windows'
  return 'linux'
}

// Get device type
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (/Mobile/.test(navigator.userAgent)) return 'mobile'
  if (/Tablet|iPad/.test(navigator.userAgent)) return 'tablet'
  return 'desktop'
}

// Auto-scroll on new messages
watch(messages, () => {
  nextTick(() => scrollToBottom())
})
</script>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1b26;
}

.header {
  background: #24283b;
  border-bottom: 1px solid #414868;
  padding: 1rem;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.5rem;
  color: #bb9af7;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7aa2f7;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.connected {
  background: #9ece6a;
}

.status-dot.disconnected {
  background: #f7768e;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  padding: 2rem;
}

.welcome h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #bb9af7;
}

.welcome p {
  color: #7aa2f7;
  margin-bottom: 2rem;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestions button {
  padding: 0.75rem 1rem;
  background: #24283b;
  border: 1px solid #414868;
  border-radius: 8px;
  color: #c0caf5;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestions button:hover {
  background: #414868;
  border-color: #7aa2f7;
}

.message {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 1rem;
  border-radius: 12px;
}

.message.user .message-content {
  background: #7aa2f7;
  color: #1a1b26;
}

.message.assistant .message-content {
  background: #24283b;
  border: 1px solid #414868;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.message-text {
  line-height: 1.5;
}

.typing {
  display: flex;
  gap: 4px;
}

.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7aa2f7;
  animation: typing 1.4s infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.input-container {
  padding: 1rem;
  background: #24283b;
  border-top: 1px solid #414868;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 0.5rem;
}

.input-wrapper input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: #1a1b26;
  border: 1px solid #414868;
  border-radius: 8px;
  color: #c0caf5;
  font-size: 1rem;
  outline: none;
}

.input-wrapper input:focus {
  border-color: #7aa2f7;
}

.voice-btn,
.send-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #414868;
  border-radius: 8px;
  background: #1a1b26;
  color: #c0caf5;
  cursor: pointer;
  transition: all 0.2s;
}

.voice-btn.active {
  background: #7aa2f7;
  color: #1a1b26;
  border-color: #7aa2f7;
}

.send-btn {
  background: #7aa2f7;
  color: #1a1b26;
  border-color: #7aa2f7;
  font-weight: 600;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #89b4fa;
  border-color: #89b4fa;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .message-content {
    max-width: 90%;
  }

  .suggestions {
    gap: 0.75rem;
  }
}
</style>
