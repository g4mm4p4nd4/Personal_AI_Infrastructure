/**
 * Device Authentication System
 * Uses JWT tokens with device fingerprinting for trusted devices
 */

import { randomBytes, createHash } from 'crypto'
import type { Device } from '../types'

export class DeviceAuthManager {
  private trustedDevices: Map<string, Device> = new Map()
  private deviceTokens: Map<string, string> = new Map()  // fingerprint -> token

  /**
   * Register a new trusted device
   */
  async registerDevice(device: Omit<Device, 'id' | 'fingerprint' | 'lastSeen' | 'trusted'>): Promise<{ device: Device; token: string }> {
    const id = this.generateDeviceId()
    const fingerprint = this.generateFingerprint(device)

    const newDevice: Device = {
      ...device,
      id,
      fingerprint,
      lastSeen: new Date(),
      trusted: true,
    }

    this.trustedDevices.set(fingerprint, newDevice)

    // Generate device token
    const token = this.generateDeviceToken(fingerprint)
    this.deviceTokens.set(fingerprint, token)

    console.log(`📱 Registered device: ${device.name} (${device.type}/${device.platform})`)

    return { device: newDevice, token }
  }

  /**
   * Verify device token
   */
  async verifyDevice(token: string): Promise<Device | null> {
    // Find device by token
    for (const [fingerprint, deviceToken] of this.deviceTokens.entries()) {
      if (deviceToken === token) {
        const device = this.trustedDevices.get(fingerprint)
        if (device && device.trusted) {
          // Update last seen
          device.lastSeen = new Date()
          return device
        }
      }
    }

    return null
  }

  /**
   * Revoke device access
   */
  async revokeDevice(fingerprint: string): Promise<boolean> {
    const device = this.trustedDevices.get(fingerprint)
    if (device) {
      device.trusted = false
      this.deviceTokens.delete(fingerprint)
      console.log(`🚫 Revoked device: ${device.name}`)
      return true
    }
    return false
  }

  /**
   * List all trusted devices
   */
  getTrustedDevices(): Device[] {
    return Array.from(this.trustedDevices.values()).filter(d => d.trusted)
  }

  /**
   * Get device by fingerprint
   */
  getDevice(fingerprint: string): Device | undefined {
    return this.trustedDevices.get(fingerprint)
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `dev_${randomBytes(16).toString('hex')}`
  }

  /**
   * Generate device fingerprint from device properties
   */
  private generateFingerprint(device: Pick<Device, 'name' | 'type' | 'platform'>): string {
    const data = `${device.name}|${device.type}|${device.platform}|${Date.now()}`
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Generate secure device token
   */
  private generateDeviceToken(fingerprint: string): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const data = `${fingerprint}|${secret}|${Date.now()}`
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Load devices from storage (implement persistence later)
   */
  async loadDevices(): Promise<void> {
    // TODO: Load from database or file
    console.log('📂 Loading trusted devices...')
  }

  /**
   * Save devices to storage
   */
  async saveDevices(): Promise<void> {
    // TODO: Save to database or file
    console.log('💾 Saving trusted devices...')
  }
}
