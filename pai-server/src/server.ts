#!/usr/bin/env bun
/**
 * PAI Central Server
 * REST API server that wraps PAI core for cross-platform access
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import pino from 'pino'
import { readFileSync } from 'fs'
import { join } from 'path'

import { PAICore } from './core/pai-core'
import { VoiceManager } from './voice/manager'
import { DeviceAuthManager } from './auth/device-auth'
import { registerRoutes } from './api/routes'

// Load environment variables
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.pai')
const envPath = join(PAI_DIR, '.env')

if (Bun.file(envPath).size > 0) {
  const envContent = await Bun.file(envPath).text()
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim()
    }
  })
}

// Configuration
const PORT = parseInt(process.env.PAI_SERVER_PORT || '3000')
const HOST = process.env.PAI_SERVER_HOST || '0.0.0.0'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as pino.Level

// Create server
const server = Fastify({
  logger: pino({
    level: LOG_LEVEL,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    },
  }),
})

// Register plugins
await server.register(cors, {
  origin: true,  // Allow all origins for now (restrict in production)
  credentials: true,
})

await server.register(ws)

// Initialize components
const pai = new PAICore(PAI_DIR)
const voice = new VoiceManager(process.env.ELEVENLABS_API_KEY)
const deviceAuth = new DeviceAuthManager()

console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║        Personal AI Infrastructure Server            ║')
console.log('╚══════════════════════════════════════════════════════╝\n')

console.log('🚀 Initializing PAI Server...\n')

// Initialize PAI Core
await pai.initialize()

// Initialize Voice Manager
await voice.initialize()

// Load devices
await deviceAuth.loadDevices()

// Register API routes
await registerRoutes(server, pai, voice, deviceAuth)

// WebSocket for real-time chat
server.register(async (fastify) => {
  fastify.get('/ws/chat', { websocket: true }, (connection, req) => {
    connection.socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString())

        // Process chat message
        const response = await pai.chat(data)

        // Send response
        connection.socket.send(JSON.stringify(response))

        // Speak if voice enabled
        if (data.voiceEnabled && voice.isAvailable()) {
          const agent = pai.getAgent(data.agentType || 'kai')
          const voiceOptions = agent?.voiceId ? { voice: agent.voiceId } : undefined
          voice.speak(response.message, voiceOptions).catch(console.error)
        }
      } catch (error: any) {
        connection.socket.send(JSON.stringify({
          error: error.message,
        }))
      }
    })
  })
})

// Start server
try {
  await server.listen({ port: PORT, host: HOST })

  console.log('\n✅ PAI Server running!\n')
  console.log(`📡 HTTP API:  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  console.log(`🔌 WebSocket: ws://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/ws/chat`)
  console.log(`🎙️  Voice:     ${voice.getActiveProvider() || 'None'}`)
  console.log(`📂 PAI Dir:   ${PAI_DIR}`)
  console.log(`📱 Devices:   ${deviceAuth.getTrustedDevices().length} trusted`)
  console.log('')
  console.log('Available endpoints:')
  console.log('  GET  /health              - Health check')
  console.log('  POST /api/devices/register - Register device')
  console.log('  GET  /api/devices         - List devices')
  console.log('  POST /api/chat            - Send chat message')
  console.log('  GET  /api/skills          - List skills')
  console.log('  GET  /api/agents          - List agents')
  console.log('  GET  /api/voices          - List voices')
  console.log('  POST /api/voice/test      - Test voice')
  console.log('')
  console.log('🎉 Ready to accept connections!\n')
} catch (err) {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n\n🛑 Shutting down PAI Server...')
  await deviceAuth.saveDevices()
  await server.close()
  console.log('✓ Server stopped')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
