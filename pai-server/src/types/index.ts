/**
 * PAI Server Type Definitions
 */

export interface PAIConfig {
  port: number
  host: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  enableTLS: boolean
  tlsCert?: string
  tlsKey?: string
  jwtSecret: string
  allowedDevices: string[]  // Device fingerprints/IDs
}

export interface Device {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet' | 'watch'
  platform: 'ios' | 'android' | 'macos' | 'windows' | 'linux'
  fingerprint: string
  lastSeen: Date
  trusted: boolean
}

export interface Session {
  id: string
  deviceId: string
  agentType?: string
  createdAt: Date
  lastActivity: Date
  messages: Message[]
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    skillActivated?: string
    mcpToolsUsed?: string[]
    voiceEnabled?: boolean
  }
}

export interface VoiceProvider {
  name: string
  available: boolean
  speak(text: string, options?: VoiceOptions): Promise<void>
  getVoices(): Promise<VoiceInfo[]>
}

export interface VoiceOptions {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface VoiceInfo {
  id: string
  name: string
  language: string
  gender?: 'male' | 'female' | 'neutral'
  quality?: 'enhanced' | 'premium' | 'standard'
}

export interface SkillInfo {
  name: string
  description: string
  triggers: string[]
  mcpServers: string[]
  active: boolean
}

export interface AgentInfo {
  name: string
  description: string
  model: string
  voiceId?: string
  permissions: string[]
}

export interface ChatRequest {
  message: string
  sessionId?: string
  agentType?: string
  voiceEnabled?: boolean
}

export interface ChatResponse {
  sessionId: string
  message: string
  agentUsed: string
  skillsActivated: string[]
  timestamp: Date
}
