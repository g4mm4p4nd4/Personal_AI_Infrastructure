/**
 * Authentication Middleware
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { DeviceAuthManager } from './device-auth'

/**
 * Create authentication hook
 */
export function createAuthHook(deviceAuth: DeviceAuthManager) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/health',
      '/api/devices/register',
    ]

    if (publicEndpoints.some(path => request.url.startsWith(path))) {
      return
    }

    // Extract token from Authorization header
    const authHeader = request.headers.authorization
    if (!authHeader) {
      reply.status(401)
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      reply.status(401)
      throw new Error('Invalid authorization header')
    }

    // Verify device token
    const device = await deviceAuth.verifyDevice(token)
    if (!device) {
      reply.status(403)
      throw new Error('Invalid or revoked device token')
    }

    // Add device to request context
    ;(request as any).device = device
  }
}

/**
 * Require authentication decorator
 */
export function requireAuth(deviceAuth: DeviceAuthManager) {
  return {
    onRequest: createAuthHook(deviceAuth),
  }
}
