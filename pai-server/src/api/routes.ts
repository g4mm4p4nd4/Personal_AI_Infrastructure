/**
 * PAI Server API Routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { PAICore } from '../core/pai-core'
import type { VoiceManager } from '../voice/manager'
import type { DeviceAuthManager } from '../auth/device-auth'
import type { ChatRequest } from '../types'

export async function registerRoutes(
  server: FastifyInstance,
  pai: PAICore,
  voice: VoiceManager,
  deviceAuth: DeviceAuthManager
) {
  // Health check
  server.get('/health', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      voice: {
        available: voice.isAvailable(),
        provider: voice.getActiveProvider(),
      },
      pai: {
        skills: pai.getSkills().length,
        agents: pai.getAgents().length,
      },
    }
  })

  // Device registration
  server.post('/api/devices/register', async (request: FastifyRequest<{
    Body: {
      name: string
      type: 'mobile' | 'desktop' | 'tablet' | 'watch'
      platform: 'ios' | 'android' | 'macos' | 'windows' | 'linux'
    }
  }>, reply: FastifyReply) => {
    try {
      const { device, token } = await deviceAuth.registerDevice(request.body)
      return {
        device,
        token,
        message: 'Device registered successfully',
      }
    } catch (error: any) {
      reply.status(500)
      return { error: error.message }
    }
  })

  // List trusted devices
  server.get('/api/devices', async (request: FastifyRequest, reply: FastifyReply) => {
    // Verify authentication via header
    const authHeader = request.headers.authorization
    if (!authHeader) {
      reply.status(401)
      return { error: 'Authentication required' }
    }

    const token = authHeader.replace(/^Bearer\s+/i, '')
    const device = await deviceAuth.verifyDevice(token)

    if (!device) {
      reply.status(403)
      return { error: 'Invalid or revoked device token' }
    }

    const devices = deviceAuth.getTrustedDevices()
    return { devices }
  })

  // Revoke device
  server.delete('/api/devices/:fingerprint', async (request: FastifyRequest<{
    Params: { fingerprint: string }
  }>, reply: FastifyReply) => {
    const { fingerprint } = request.params
    const revoked = await deviceAuth.revokeDevice(fingerprint)

    if (revoked) {
      return { message: 'Device revoked successfully' }
    } else {
      reply.status(404)
      return { error: 'Device not found' }
    }
  })

  // Chat endpoint
  server.post('/api/chat', async (request: FastifyRequest<{
    Body: ChatRequest
  }>, reply: FastifyReply) => {
    try {
      const chatRequest = request.body

      // Process chat through PAI core
      const response = await pai.chat(chatRequest)

      // Speak response if voice enabled
      if (chatRequest.voiceEnabled && voice.isAvailable()) {
        // Get voice for agent
        const agent = pai.getAgent(chatRequest.agentType || 'kai')
        const voiceOptions = agent?.voiceId ? { voice: agent.voiceId } : undefined

        // Speak in background (don't block response)
        voice.speak(response.message, voiceOptions).catch(err => {
          console.error('Voice synthesis failed:', err)
        })
      }

      return response
    } catch (error: any) {
      reply.status(500)
      return { error: error.message }
    }
  })

  // Get skills
  server.get('/api/skills', async () => {
    return {
      skills: pai.getSkills(),
    }
  })

  // Get agents
  server.get('/api/agents', async () => {
    return {
      agents: pai.getAgents(),
    }
  })

  // Get available voices
  server.get('/api/voices', async () => {
    const voices = await voice.getVoices()
    return {
      provider: voice.getActiveProvider(),
      voices,
    }
  })

  // Test voice
  server.post('/api/voice/test', async (request: FastifyRequest<{
    Body: {
      text: string
      voice?: string
    }
  }>, reply: FastifyReply) => {
    try {
      const { text, voice: voiceId } = request.body

      await voice.speak(text, voiceId ? { voice: voiceId } : undefined)

      return {
        message: 'Voice test successful',
      }
    } catch (error: any) {
      reply.status(500)
      return { error: error.message }
    }
  })

  // Get voice providers
  server.get('/api/voice/providers', async () => {
    return {
      active: voice.getActiveProvider(),
      available: voice.getProviders().map(p => ({
        name: p.name,
        available: p.available,
      })),
    }
  })

  // Switch voice provider
  server.post('/api/voice/provider', async (request: FastifyRequest<{
    Body: { provider: string }
  }>, reply: FastifyReply) => {
    try {
      await voice.setProvider(request.body.provider)
      return {
        message: `Switched to ${request.body.provider}`,
      }
    } catch (error: any) {
      reply.status(400)
      return { error: error.message }
    }
  })
}
