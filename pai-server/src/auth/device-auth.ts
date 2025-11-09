/**
 * Device Authentication System
 * Uses JWT tokens with device fingerprinting for trusted devices
 */

import { randomBytes, createHash } from 'crypto'
import type { Device } from '../types'

// Auto-save devices every 5 minutes
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000

export class DeviceAuthManager {
  private trustedDevices: Map<string, Device> = new Map()
  private deviceTokens: Map<string, string> = new Map()  // fingerprint -> token
  private autoSaveTimer?: Timer

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

    // Auto-save after registration
    await this.saveDevices()

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
   * Load devices from storage
   */
  async loadDevices(): Promise<void> {
    const storageFile = this.getStorageFile()

    try {
      if (await Bun.file(storageFile).exists()) {
        const data = await Bun.file(storageFile).json()

        // Restore devices
        this.trustedDevices.clear()
        this.deviceTokens.clear()

        for (const deviceData of data.devices) {
          const device: Device = {
            ...deviceData,
            lastSeen: new Date(deviceData.lastSeen),
          }
          this.trustedDevices.set(device.fingerprint, device)
        }

        // Restore tokens
        for (const [fingerprint, token] of Object.entries(data.tokens)) {
          this.deviceTokens.set(fingerprint, token as string)
        }

        console.log(`📂 Loaded ${this.trustedDevices.size} trusted devices`)
      } else {
        console.log('📂 No existing devices file, starting fresh')
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    }

    // Start auto-save timer
    this.startAutoSave()
  }

  /**
   * Save devices to storage
   */
  async saveDevices(): Promise<void> {
    const storageFile = this.getStorageFile()

    try {
      const data = {
        version: 1,
        devices: Array.from(this.trustedDevices.values()),
        tokens: Object.fromEntries(this.deviceTokens.entries()),
      }

      await Bun.write(storageFile, JSON.stringify(data, null, 2))
      console.log(`💾 Saved ${this.trustedDevices.size} devices to ${storageFile}`)
    } catch (error) {
      console.error('Failed to save devices:', error)
    }
  }

  /**
   * Get storage file path
   */
  private getStorageFile(): string {
    const paiDir = process.env.PAI_DIR || `${process.env.HOME}/.pai`
    return `${paiDir}/.devices.json`
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveDevices().catch(console.error)
    }, AUTO_SAVE_INTERVAL)
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = undefined
    }
  }
}
