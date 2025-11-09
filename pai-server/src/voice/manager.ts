/**
 * Voice Manager - Auto-detects and manages voice providers
 */

import { MacOSVoiceProvider } from './providers/macos'
import { WindowsVoiceProvider } from './providers/windows'
import { AndroidVoiceProvider } from './providers/android'
import { ElevenLabsVoiceProvider } from './providers/elevenlabs'
import type { VoiceProvider, VoiceOptions, VoiceInfo } from '../types'

export class VoiceManager {
  private providers: VoiceProvider[] = []
  private activeProvider: VoiceProvider | null = null
  private initialized = false

  constructor(private elevenLabsApiKey?: string) {}

  /**
   * Initialize and detect available voice providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // Create all providers
    const providers = [
      new MacOSVoiceProvider(),
      new WindowsVoiceProvider(),
      new AndroidVoiceProvider(),
      new ElevenLabsVoiceProvider(this.elevenLabsApiKey),
    ]

    // Initialize each provider
    for (const provider of providers) {
      try {
        await provider.initialize()
        if (provider.available) {
          this.providers.push(provider)
          console.log(`✓ Voice provider available: ${provider.name}`)
        }
      } catch (error) {
        console.warn(`Failed to initialize ${provider.name} provider:`, error)
      }
    }

    // Set active provider (prefer native over cloud)
    this.activeProvider = this.providers.find(
      p => p.name !== 'ElevenLabs'
    ) || this.providers[0] || null

    if (this.activeProvider) {
      console.log(`🎙️ Active voice provider: ${this.activeProvider.name}`)
    } else {
      console.warn('⚠️ No voice providers available')
    }

    this.initialized = true
  }

  /**
   * Speak text using the active provider
   */
  async speak(text: string, options?: VoiceOptions): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.activeProvider) {
      throw new Error('No voice provider available')
    }

    return this.activeProvider.speak(text, options)
  }

  /**
   * Get available voices from active provider
   */
  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.activeProvider) {
      return []
    }

    return this.activeProvider.getVoices()
  }

  /**
   * Get all available providers
   */
  getProviders(): VoiceProvider[] {
    return this.providers
  }

  /**
   * Get active provider name
   */
  getActiveProvider(): string | null {
    return this.activeProvider?.name || null
  }

  /**
   * Switch to a specific provider
   */
  async setProvider(providerName: string): Promise<void> {
    const provider = this.providers.find(
      p => p.name.toLowerCase() === providerName.toLowerCase()
    )

    if (!provider) {
      throw new Error(`Provider "${providerName}" not available`)
    }

    this.activeProvider = provider
    console.log(`Switched to voice provider: ${provider.name}`)
  }

  /**
   * Check if voice is available
   */
  isAvailable(): boolean {
    return this.activeProvider !== null
  }
}
