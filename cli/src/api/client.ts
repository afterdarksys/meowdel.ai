import axios, { AxiosInstance, AxiosError } from 'axios'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG_DIR = path.join(os.homedir(), '.meowdel')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

export interface Config {
  apiKey?: string
  baseUrl?: string
  defaultPet?: string
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch {
    // fall through to defaults
  }
  return {
    baseUrl: process.env.MEOWDEL_API_URL || 'https://meowdel.ai',
    defaultPet: 'meowdel',
  }
}

export function saveConfig(config: Config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// ── HTTP client factory ───────────────────────────────────────────────────────

function makeClient(): AxiosInstance {
  const config = loadConfig()
  const apiKey = process.env.MEOWDEL_API_KEY || config.apiKey

  if (!apiKey) {
    throw new Error(
      'API key not configured.\n  Run: meowdel config YOUR_API_KEY\n  Or set MEOWDEL_API_KEY env var'
    )
  }

  return axios.create({
    baseURL: (config.baseUrl || 'https://meowdel.ai').replace(/\/$/, '') + '/api',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'meowdel-cli/2.0.0',
    },
    timeout: 60_000,
  })
}

/** Extract a human-readable error message from an Axios error. */
export function apiError(err: unknown): string {
  const e = err as AxiosError<{ error?: string }>
  if (e.response) {
    const body = e.response.data
    return `HTTP ${e.response.status}: ${body?.error || JSON.stringify(body)}`
  }
  return (err as Error).message
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatRouting {
  tier: string
  model: string
  reason: string
  activeSkills: string[]
  cascadeMemoriesUsed: number
}

export interface ChatResponse {
  message: string
  petId: string
  petName: string
  photo: string
  timestamp: string
  _routing: ChatRouting
}

export async function chatRequest(
  message: string,
  petId: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  sessionId?: string,
): Promise<ChatResponse> {
  const client = makeClient()
  const res = await client.post(`/pets/${petId}/chat`, {
    message,
    conversationHistory: conversationHistory.slice(-20),
    sessionId,
  })
  return res.data.response as ChatResponse
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface NoteSummary {
  id: string
  slug: string
  title: string
  tags: string[]
  summary: string | null
  wordCount: number
  updatedAt: string
}

export interface NoteDetail extends NoteSummary {
  content: string
  frontmatter: Record<string, unknown> | null
  createdAt: string
}

export async function listNotes(): Promise<NoteSummary[]> {
  const client = makeClient()
  const res = await client.get('/brain/notes')
  // Backend returns a flat array
  return Array.isArray(res.data) ? res.data : res.data.notes ?? []
}

export async function getNote(slug: string): Promise<NoteDetail> {
  const client = makeClient()
  const res = await client.get(`/brain/notes/${slug}`)
  return res.data
}

export async function createNote(
  title: string,
  content: string,
  tags: string[] = [],
): Promise<{ id: string; slug: string }> {
  const client = makeClient()
  const res = await client.post('/brain/notes', { title, content, tags })
  return res.data
}

export async function updateNote(
  slug: string,
  updates: { title?: string; content?: string; tags?: string[] },
): Promise<void> {
  const client = makeClient()
  await client.put(`/brain/notes/${slug}`, updates)
}

export async function deleteNote(slug: string): Promise<void> {
  const client = makeClient()
  await client.delete(`/brain/notes/${slug}`)
}

export async function searchNotes(query: string, limit = 10): Promise<NoteSummary[]> {
  const client = makeClient()
  const res = await client.post('/brain/search', { query, limit })
  const data = res.data
  if (Array.isArray(data)) return data
  return data.results ?? data.documents ?? []
}

// ── Alarms ────────────────────────────────────────────────────────────────────

export type RepeatFrequency = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'

export interface Alarm {
  id: string
  userId: string
  label: string
  hour: number
  minute: number
  timezone: string
  isEnabled: boolean
  repeatEnabled: boolean
  repeatFrequency: RepeatFrequency
  repeatDays: number[]
  petId: string | null
  nextFireAt: string | null
  lastFiredAt: string | null
  snoozeUntil: string | null
  createdAt: string
  updatedAt: string
}

export interface FiredAlarm {
  id: string
  label: string
  hour: number
  minute: number
  timezone: string
  petId: string
  catMessage: string
  photo: string | null
  nextFireAt: string | null
}

export async function listAlarms(): Promise<{ alarms: Alarm[]; max: number }> {
  const client = makeClient()
  const res = await client.get('/brain/alarms')
  return res.data
}

export async function createAlarm(payload: {
  label: string
  hour: number
  minute: number
  timezone: string
  repeatEnabled: boolean
  repeatFrequency: RepeatFrequency
  repeatDays: number[]
  petId?: string
}): Promise<Alarm> {
  const client = makeClient()
  const res = await client.post('/brain/alarms', payload)
  return res.data.alarm
}

export async function updateAlarm(
  id: string,
  payload: Partial<{
    label: string
    hour: number
    minute: number
    timezone: string
    isEnabled: boolean
    repeatEnabled: boolean
    repeatFrequency: RepeatFrequency
    repeatDays: number[]
    petId: string | null
  }>,
): Promise<Alarm> {
  const client = makeClient()
  const res = await client.put(`/brain/alarms/${id}`, payload)
  return res.data.alarm
}

export async function deleteAlarm(id: string): Promise<void> {
  const client = makeClient()
  await client.delete(`/brain/alarms/${id}`)
}

export async function checkAlarms(): Promise<FiredAlarm[]> {
  const client = makeClient()
  const res = await client.get('/brain/alarms/check')
  return res.data.fired ?? []
}

export async function snoozeAlarm(id: string, minutes = 9): Promise<void> {
  const client = makeClient()
  await client.patch(`/brain/alarms/${id}/snooze`, { minutes })
}

// ── Pets ──────────────────────────────────────────────────────────────────────

export interface PetInfo {
  id: string
  name: string
  breed: string
  personality: string
  greeting: string
  photo: string
}

export async function getPet(petId: string): Promise<PetInfo> {
  const client = makeClient()
  const res = await client.get(`/pets/${petId}`)
  return res.data.pet
}

export const KNOWN_PETS = [
  'meowdel', 'bandit', 'luna', 'catdog', 'spotty',
  'bella', 'blubie', 'blinker', 'nursicat', 'lobstercat',
]
