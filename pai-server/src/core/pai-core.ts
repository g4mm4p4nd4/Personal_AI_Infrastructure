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

    // For now, return a mock response
    // TODO: Integrate with actual Claude API
    const response: ChatResponse = {
      sessionId: request.sessionId || this.generateSessionId(),
      message: `[${agent.name}] Processing: "${request.message}"`,
      agentUsed: agentType,
      skillsActivated: [],
      timestamp: new Date(),
    }

    return response
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
