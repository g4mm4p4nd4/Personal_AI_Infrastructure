/**
 * Android Voice Provider using Termux TTS
 * Requires termux-tts-speak command to be available
 */

import { spawn } from 'child_process'
import { BaseVoiceProvider } from './base'
import type { VoiceOptions, VoiceInfo } from '../../types'

export class AndroidVoiceProvider extends BaseVoiceProvider {
  name = 'Android'
  available = false

  async isAvailable(): Promise<boolean> {
    // Check if termux-tts-speak is available
    try {
      const proc = spawn('which', ['termux-tts-speak'])
      await new Promise((resolve, reject) => {
        proc.on('exit', code => code === 0 ? resolve(true) : reject())
        proc.on('error', reject)
      })
      return true
    } catch {
      return false
    }
  }

  async initialize(): Promise<void> {
    this.available = await this.isAvailable()
  }

  async speak(text: string, options?: VoiceOptions): Promise<void> {
    if (!this.available) {
      throw new Error('Android voice provider not available')
    }

    const sanitized = this.sanitizeText(text)
    const args: string[] = []

    if (options?.rate) {
      // Termux TTS rate is 0.1 to 2.0
      const rate = options.rate / 175  // Normalize from WPM
      args.push('-r', Math.max(0.1, Math.min(2.0, rate)).toFixed(2))
    }

    if (options?.pitch) {
      // Pitch is 0.1 to 2.0
      args.push('-p', Math.max(0.1, Math.min(2.0, options.pitch)).toFixed(2))
    }

    args.push(sanitized)

    return new Promise((resolve, reject) => {
      const proc = spawn('termux-tts-speak', args)

      proc.on('error', reject)
      proc.on('exit', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`termux-tts-speak exited with code ${code}`))
        }
      })
    })
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.available) {
      return []
    }

    // Android TTS voices are system-dependent
    // Return a generic voice info
    return [
      {
        id: 'default',
        name: 'Android TTS',
        language: 'en-US',
        quality: 'standard',
      },
    ]
  }
}
