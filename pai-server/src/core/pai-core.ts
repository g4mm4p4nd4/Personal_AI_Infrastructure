/**
 * PAI Core Integration
 * Bridges the REST API with existing PAI functionality
 */

import { spawn } from 'child_process'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { ChatRequest, ChatResponse, SkillInfo, AgentInfo } from '../types'

export class PAICore {
  private paiDir: string
  private skills: Map<string, SkillInfo> = new Map()
  private agents: Map<string, AgentInfo> = new Map()

  constructor(paiDir?: string) {
    this.paiDir = paiDir || process.env.PAI_DIR || join(process.env.HOME!, '.pai')
    console.log(`📁 PAI Directory: ${this.paiDir}`)
  }

  /**
   * Initialize PAI Core
   */
  async initialize(): Promise<void> {
    await this.loadSkills()
    await this.loadAgents()
    console.log(`✓ PAI Core initialized`)
    console.log(`  - ${this.skills.size} skills loaded`)
    console.log(`  - ${this.agents.size} agents loaded`)
  }

  /**
   * Process a chat message
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const agentType = request.agentType || 'kai'
    const agent = this.agents.get(agentType)

    if (!agent) {
      throw new Error(`Agent "${agentType}" not found`)
    }

    // Process message through Claude
    const responseText = await this.processWithClaude(request.message, agentType)

    // Detect activated skills (simple heuristic)
    const skillsActivated = this.detectActivatedSkills(request.message, responseText)

    const response: ChatResponse = {
      sessionId: request.sessionId || this.generateSessionId(),
      message: responseText,
      agentUsed: agentType,
      skillsActivated,
      timestamp: new Date(),
    }

    return response
  }

  /**
   * Process message with Claude API
   */
  private async processWithClaude(message: string, agentType: string): Promise<string> {
    // Use Anthropic API if available
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: message,
              },
            ],
            system: this.getSystemPromptForAgent(agentType),
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Claude API error: ${response.status} - ${error}`)
        }

        const data = await response.json()
        return data.content[0].text
      } catch (error: any) {
        console.error('Claude API error:', error)
        // Fall back to echo with agent name
        return this.getEchoResponse(message, agentType)
      }
    } else {
      // No API key - return helpful echo response
      return this.getEchoResponse(message, agentType)
    }
  }

  /**
   * Get system prompt for agent
   */
  private getSystemPromptForAgent(agentType: string): string {
    const agent = this.agents.get(agentType)
    if (!agent) {
      return 'You are a helpful AI assistant.'
    }

    const skillsList = Array.from(this.skills.values())
      .map(s => `- ${s.name}: ${s.description}`)
      .join('\n')

    return `You are ${agent.name}, ${agent.description}.

Available skills:
${skillsList}

You have access to these permissions:
${agent.permissions.join(', ')}

Respond naturally and helpfully.`
  }

  /**
   * Get echo response when Claude API is unavailable
   */
  private getEchoResponse(message: string, agentType: string): string {
    const agent = this.agents.get(agentType)
    const agentName = agent?.name || agentType

    return `[${agentName}] I received your message: "${message}"

Note: The Anthropic API key is not configured. To enable full AI capabilities, add ANTHROPIC_API_KEY to your .env file.

You can get an API key from: https://console.anthropic.com/

Available skills: ${Array.from(this.skills.keys()).join(', ')}
Available agents: ${Array.from(this.agents.keys()).join(', ')}`
  }

  /**
   * Detect which skills were activated based on message and response
   */
  private detectActivatedSkills(message: string, response: string): string[] {
    const activated: string[] = []
    const messageLower = message.toLowerCase()

    for (const [name, skill] of this.skills.entries()) {
      // Check if any triggers match
      const hasMatchingTrigger = skill.triggers.some(trigger =>
        messageLower.includes(trigger.toLowerCase())
      )

      if (hasMatchingTrigger) {
        activated.push(name)
      }
    }

    return activated
  }

  /**
   * Load skills from PAI directory
   */
  private async loadSkills(): Promise<void> {
    const skillsDir = join(this.paiDir, 'skills')

    try {
      const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

      for (const skillName of skillDirs) {
        try {
          const skillFile = join(skillsDir, skillName, 'SKILL.md')
          const content = readFileSync(skillFile, 'utf-8')

          // Parse YAML frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (frontmatterMatch) {
            const yaml = frontmatterMatch[1]
            const skill: SkillInfo = {
              name: skillName,
              description: this.extractYamlValue(yaml, 'description') || '',
              triggers: this.extractYamlArray(yaml, 'triggers') || [],
              mcpServers: this.extractYamlArray(yaml, 'mcp_servers') || [],
              active: true,
            }
            this.skills.set(skillName, skill)
          }
        } catch (err) {
          console.warn(`⚠️ Failed to load skill: ${skillName}`, err)
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to load skills directory', err)
    }
  }

  /**
   * Load agents from PAI directory
   */
  private async loadAgents(): Promise<void> {
    const agentsDir = join(this.paiDir, 'agents')

    try {
      const agentFiles = readdirSync(agentsDir)
        .filter(f => f.endsWith('.md'))

      for (const agentFile of agentFiles) {
        try {
          const agentName = agentFile.replace('.md', '')
          const content = readFileSync(join(agentsDir, agentFile), 'utf-8')

          // Parse YAML frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (frontmatterMatch) {
            const yaml = frontmatterMatch[1]
            const agent: AgentInfo = {
              name: agentName,
              description: this.extractYamlValue(yaml, 'description') || '',
              model: this.extractYamlValue(yaml, 'model') || 'sonnet',
              voiceId: this.extractYamlValue(yaml, 'voiceId'),
              permissions: this.extractYamlArray(yaml, 'permissions.allow') || [],
            }
            this.agents.set(agentName, agent)
          }
        } catch (err) {
          console.warn(`⚠️ Failed to load agent: ${agentFile}`, err)
        }
      }

      // Add default 'kai' agent if not found
      if (!this.agents.has('kai')) {
        this.agents.set('kai', {
          name: 'kai',
          description: 'Your personal AI assistant',
          model: 'sonnet',
          permissions: ['*'],
        })
      }
    } catch (err) {
      console.warn('⚠️ Failed to load agents directory', err)
    }
  }

  /**
   * Get all skills
   */
  getSkills(): SkillInfo[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get all agents
   */
  getAgents(): AgentInfo[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): SkillInfo | undefined {
    return this.skills.get(name)
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): AgentInfo | undefined {
    return this.agents.get(name)
  }

  /**
   * Extract YAML value
   */
  private extractYamlValue(yaml: string, key: string): string | undefined {
    const regex = new RegExp(`^${key}:\\s*(.+)$`, 'm')
    const match = yaml.match(regex)
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : undefined
  }

  /**
   * Extract YAML array
   */
  private extractYamlArray(yaml: string, key: string): string[] | undefined {
    const regex = new RegExp(`^${key}:$`, 'm')
    if (!regex.test(yaml)) return undefined

    const lines = yaml.split('\n')
    const startIndex = lines.findIndex(line => line.trim().startsWith(`${key}:`))
    if (startIndex === -1) return undefined

    const items: string[] = []
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('- ')) {
        items.push(line.substring(2).trim().replace(/^["']|["']$/g, ''))
      } else if (line && !line.startsWith('#')) {
        break
      }
    }

    return items.length > 0 ? items : undefined
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
