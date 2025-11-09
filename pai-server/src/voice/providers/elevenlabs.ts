/**
 * ElevenLabs Voice Provider (Premium, Cloud-based)
 * Fallback for platforms without native TTS or for premium voices
 */

import { BaseVoiceProvider } from './base'
import type { VoiceOptions, VoiceInfo } from '../../types'

export class ElevenLabsVoiceProvider extends BaseVoiceProvider {
  name = 'ElevenLabs'
  available = false
  private apiKey?: string
  private defaultVoiceId = 's3TPKV1kjDlVtZbl4Ksh'  // Kai's voice

  constructor(apiKey?: string) {
    super()
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async initialize(): Promise<void> {
    this.available = await this.isAvailable()
  }

  async speak(text: string, options?: VoiceOptions): Promise<void> {
    if (!this.available || !this.apiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    const sanitized = this.sanitizeText(text)
    const voiceId = options?.voice || this.defaultVoiceId

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: sanitized,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    await this.playAudio(audioBuffer)
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.available || !this.apiKey) {
      return []
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        language: 'en-US',  // ElevenLabs doesn't expose language in API
        quality: 'premium' as const,
      }))
    } catch {
      return []
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    const tempFile = `/tmp/voice-${Date.now()}.mp3`

    // Write audio to temp file
    await Bun.write(tempFile, audioBuffer)

    // Detect audio player
    const player = await this.detectAudioPlayer()
    if (!player) {
      throw new Error('No audio player found')
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(player, [tempFile])

      proc.on('error', reject)
      proc.on('exit', code => {
        // Clean up temp file
        spawn('rm', [tempFile])

        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Audio player exited with code ${code}`))
        }
      })
    })
  }

  private async detectAudioPlayer(): Promise<string | null> {
    const players = [
      'afplay',      // macOS
      'mpg123',      // Linux
      'ffplay',      // Cross-platform (ffmpeg)
      'powershell',  // Windows (with custom script)
    ]

    for (const player of players) {
      try {
        const proc = spawn('which', [player])
        await new Promise((resolve, reject) => {
          proc.on('exit', code => code === 0 ? resolve(true) : reject())
          proc.on('error', reject)
        })
        return player
      } catch {
        continue
      }
    }

    return null
  }
}
