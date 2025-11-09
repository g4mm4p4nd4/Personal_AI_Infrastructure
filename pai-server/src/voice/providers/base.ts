/**
 * Base Voice Provider Interface
 */

import type { VoiceProvider, VoiceOptions, VoiceInfo } from '../../types'

export abstract class BaseVoiceProvider implements VoiceProvider {
  abstract name: string
  abstract available: boolean

  abstract speak(text: string, options?: VoiceOptions): Promise<void>
  abstract getVoices(): Promise<VoiceInfo[]>

  /**
   * Check if this provider is available on the current platform
   */
  abstract isAvailable(): Promise<boolean>

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Sanitize text for speech
   */
  protected sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '')  // Remove HTML-like tags
      .replace(/\*\*/g, '')  // Remove markdown bold
      .replace(/\*/g, '')    // Remove markdown italic
      .replace(/`/g, '')     // Remove code markers
      .replace(/#{1,6}\s/g, '')  // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert markdown links to text
      .trim()
  }
}
