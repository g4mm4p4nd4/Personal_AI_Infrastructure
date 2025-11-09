/**
 * macOS Voice Provider using native 'say' command
 * Supports Premium and Enhanced voices with zero cost
 */

import { spawn } from 'child_process'
import { BaseVoiceProvider } from './base'
import type { VoiceOptions, VoiceInfo } from '../../types'

export class MacOSVoiceProvider extends BaseVoiceProvider {
  name = 'macOS'
  available = false

  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return false
    }

    try {
      const proc = spawn('which', ['say'])
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
      throw new Error('macOS voice provider not available')
    }

    const sanitized = this.sanitizeText(text)
    const args: string[] = []

    if (options?.voice) {
      args.push('-v', options.voice)
    }

    if (options?.rate) {
      args.push('-r', options.rate.toString())
    }

    args.push(sanitized)

    return new Promise((resolve, reject) => {
      const proc = spawn('say', args)

      proc.on('error', reject)
      proc.on('exit', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`say command exited with code ${code}`))
        }
      })
    })
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.available) {
      return []
    }

    // Return common Premium/Enhanced voices
    return [
      {
        id: 'Jamie',
        name: 'Jamie (Premium)',
        language: 'en-GB',
        gender: 'male',
        quality: 'premium',
      },
      {
        id: 'Ava',
        name: 'Ava (Premium)',
        language: 'en-US',
        gender: 'female',
        quality: 'premium',
      },
      {
        id: 'Tom',
        name: 'Tom (Enhanced)',
        language: 'en-US',
        gender: 'male',
        quality: 'enhanced',
      },
      {
        id: 'Serena',
        name: 'Serena (Premium)',
        language: 'en-GB',
        gender: 'female',
        quality: 'premium',
      },
      {
        id: 'Isha',
        name: 'Isha (Premium)',
        language: 'en-IN',
        gender: 'female',
        quality: 'premium',
      },
      {
        id: 'Oliver',
        name: 'Oliver (Enhanced)',
        language: 'en-GB',
        gender: 'male',
        quality: 'enhanced',
      },
      {
        id: 'Samantha',
        name: 'Samantha (Enhanced)',
        language: 'en-US',
        gender: 'female',
        quality: 'enhanced',
      },
    ]
  }
}
