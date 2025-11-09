#!/usr/bin/env bun
/**
 * Google Home MCP Server
 * Integrates PAI with Google Home devices and Gemini AI
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const GOOGLE_HOME_IP = process.env.GOOGLE_HOME_IP  // Optional: IP address of Google Home

if (!GOOGLE_API_KEY) {
  console.error('⚠️ GOOGLE_API_KEY not set in environment')
  process.exit(1)
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// Create MCP server
const server = new Server(
  {
    name: 'google-home',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

/**
 * Tool: Query Gemini AI
 */
async function queryGemini(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    throw new Error(`Gemini API error: ${error.message}`)
  }
}

/**
 * Tool: Speak to Google Home
 */
async function speakToGoogleHome(text: string, deviceIp?: string): Promise<void> {
  if (!deviceIp && !GOOGLE_HOME_IP) {
    throw new Error('Google Home IP address not configured')
  }

  const ip = deviceIp || GOOGLE_HOME_IP!

  try {
    // Use Google Home Notifier library
    const googlehome = await import('google-home-notifier')
    googlehome.device('Google Home', 'en')
    googlehome.ip(ip)

    await new Promise((resolve, reject) => {
      googlehome.notify(text, (notifyRes: any) => {
        if (notifyRes) {
          resolve(notifyRes)
        } else {
          reject(new Error('Failed to send notification'))
        }
      })
    })
  } catch (error: any) {
    throw new Error(`Google Home error: ${error.message}`)
  }
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_gemini',
        description: 'Query Google Gemini AI for information, analysis, or generation',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to Gemini',
            },
            context: {
              type: 'string',
              description: 'Optional context to provide to Gemini',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'speak_to_google_home',
        description: 'Make a Google Home device speak text aloud',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to speak',
            },
            deviceIp: {
              type: 'string',
              description: 'IP address of Google Home device (optional if configured in env)',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'gemini_chat',
        description: 'Have a conversation with Gemini, maintaining context',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to send to Gemini',
            },
            history: {
              type: 'array',
              description: 'Previous conversation history',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  parts: { type: 'string' },
                },
              },
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'gemini_vision',
        description: 'Analyze images using Gemini Vision',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Question or prompt about the image',
            },
            imageUrl: {
              type: 'string',
              description: 'URL of the image to analyze',
            },
            imageBase64: {
              type: 'string',
              description: 'Base64-encoded image data (alternative to URL)',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  }
})

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'query_gemini': {
        const { prompt, context } = args as { prompt: string; context?: string }
        const fullPrompt = context ? `Context: ${context}\n\n${prompt}` : prompt
        const response = await queryGemini(fullPrompt)

        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        }
      }

      case 'speak_to_google_home': {
        const { text, deviceIp } = args as { text: string; deviceIp?: string }
        await speakToGoogleHome(text, deviceIp)

        return {
          content: [
            {
              type: 'text',
              text: `Successfully sent message to Google Home: "${text}"`,
            },
          ],
        }
      }

      case 'gemini_chat': {
        const { message, history } = args as {
          message: string
          history?: Array<{ role: string; parts: string }>
        }

        // Create chat session with history
        const chat = model.startChat({
          history: history || [],
          generationConfig: {
            maxOutputTokens: 1000,
          },
        })

        const result = await chat.sendMessage(message)
        const response = await result.response
        const text = response.text()

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        }
      }

      case 'gemini_vision': {
        const { prompt, imageUrl, imageBase64 } = args as {
          prompt: string
          imageUrl?: string
          imageBase64?: string
        }

        const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

        let imageParts: any[] = []

        if (imageUrl) {
          // Fetch image from URL
          const response = await fetch(imageUrl)
          const buffer = await response.arrayBuffer()
          imageParts = [
            {
              inlineData: {
                data: Buffer.from(buffer).toString('base64'),
                mimeType: response.headers.get('content-type') || 'image/jpeg',
              },
            },
          ]
        } else if (imageBase64) {
          imageParts = [
            {
              inlineData: {
                data: imageBase64,
                mimeType: 'image/jpeg',
              },
            },
          ]
        } else {
          throw new Error('Either imageUrl or imageBase64 must be provided')
        }

        const result = await visionModel.generateContent([prompt, ...imageParts])
        const response = await result.response
        const text = response.text()

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Google Home MCP server running on stdio')
}

main().catch(console.error)
