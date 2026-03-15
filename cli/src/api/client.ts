import axios, { AxiosInstance } from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.meowdel')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

interface Config {
  apiKey?: string
  baseUrl?: string
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch (error) {
    // Ignore errors, return defaults
  }
  return {
    baseUrl: process.env.MEOWDEL_API_URL || 'https://meowdel.ai'
  }
}

export function saveConfig(config: Config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function createApiClient(): AxiosInstance {
  const config = loadConfig()

  if (!config.apiKey) {
    throw new Error(
      'API key not configured. Run: meowdel config YOUR_API_KEY'
    )
  }

  return axios.create({
    baseURL: config.baseUrl + '/api/v1',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })
}

export async function chatRequest(
  message: string,
  options: {
    personality?: string
    useBrainContext?: boolean
    conversationHistory?: Array<{ role: string; content: string }>
  } = {}
) {
  const client = createApiClient()
  const response = await client.post('/chat', {
    message,
    personality: options.personality || 'mittens',
    useBrainContext: options.useBrainContext || false,
    conversationHistory: options.conversationHistory || [],
  })
  return response.data
}

export async function combineRequest(
  query: string,
  operations: string[],
  options: {
    primaryPersonality?: string
    secondaryPersonality?: string
  } = {}
) {
  const client = createApiClient()
  const response = await client.post('/combine', {
    query,
    operations,
    primaryPersonality: options.primaryPersonality || 'mittens',
    secondaryPersonality: options.secondaryPersonality || 'professor',
  })
  return response.data
}

export async function getPersonalities() {
  const client = createApiClient()
  const response = await client.get('/chat')
  return response.data
}
