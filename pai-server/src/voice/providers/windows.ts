/**
 * Windows Voice Provider using SAPI (Speech API)
 * Uses PowerShell to invoke Windows Speech Synthesizer
 */

import { spawn } from 'child_process'
import { BaseVoiceProvider } from './base'
import type { VoiceOptions, VoiceInfo } from '../../types'

export class WindowsVoiceProvider extends BaseVoiceProvider {
  name = 'Windows'
  available = false

  async isAvailable(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return false
    }

    try {
      const proc = spawn('powershell', ['-Command', 'Get-Command Add-Type'])
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
      throw new Error('Windows voice provider not available')
    }

    const sanitized = this.sanitizeText(text)
    const escapedText = sanitized.replace(/"/g, '""')

    // PowerShell script to use SAPI
    const script = `
      Add-Type -AssemblyName System.Speech
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
      ${options?.voice ? `$synth.SelectVoice("${options.voice}")` : ''}
      ${options?.rate ? `$synth.Rate = ${this.normalizeRate(options.rate)}` : ''}
      $synth.Speak("${escapedText}")
      $synth.Dispose()
    `

    return new Promise((resolve, reject) => {
      const proc = spawn('powershell', ['-Command', script])

      let stderr = ''
      proc.stderr.on('data', data => {
        stderr += data.toString()
      })

      proc.on('error', reject)
      proc.on('exit', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`PowerShell exited with code ${code}: ${stderr}`))
        }
      })
    })
  }

  async getVoices(): Promise<VoiceInfo[]> {
    if (!this.available) {
      return []
    }

    // Query available SAPI voices
    const script = `
      Add-Type -AssemblyName System.Speech
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
      $synth.GetInstalledVoices() | ForEach-Object {
        $voice = $_.VoiceInfo
        Write-Output "$($voice.Name)|$($voice.Culture.Name)|$($voice.Gender)"
      }
      $synth.Dispose()
    `

    return new Promise((resolve, reject) => {
      const proc = spawn('powershell', ['-Command', script])

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', data => {
        stdout += data.toString()
      })

      proc.stderr.on('data', data => {
        stderr += data.toString()
      })

      proc.on('error', reject)
      proc.on('exit', code => {
        if (code !== 0) {
          reject(new Error(`PowerShell exited with code ${code}: ${stderr}`))
          return
        }

        const voices: VoiceInfo[] = stdout
          .trim()
          .split('\n')
          .filter(line => line.includes('|'))
          .map(line => {
            const [name, language, gender] = line.split('|')
            return {
              id: name,
              name,
              language,
              gender: gender.toLowerCase() as 'male' | 'female' | 'neutral',
              quality: 'standard' as const,
            }
          })

        resolve(voices)
      })
    })
  }

  /**
   * Convert WPM rate to SAPI rate (-10 to 10)
   */
  private normalizeRate(wpm: number): number {
    // SAPI rate: -10 (slow) to 10 (fast), 0 is normal (~180 WPM)
    // Convert from WPM (e.g., 200) to SAPI scale
    const normalized = ((wpm - 180) / 20)
    return Math.max(-10, Math.min(10, Math.round(normalized)))
  }
}
