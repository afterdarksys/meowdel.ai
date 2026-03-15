import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Define the shape of a plugin
export interface McpPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon: string
  isInstalled: boolean
  tags: string[]
}

// Mock database for plugins. 
// In a real app, `isInstalled` state would be saved in a config file or DB.
const MOCK_PLUGINS: McpPlugin[] = [
  {
    id: "mcp-github",
    name: "GitHub Connector",
    description: "Read issues, pull requests, and commit history directly into your brain context.",
    version: "1.2.0",
    author: "MeowdelHQ",
    icon: "github",
    isInstalled: true,
    tags: ["Development", "Integration"]
  },
  {
    id: "mcp-jira",
    name: "Jira Synchronizer",
    description: "Link notes to Jira tickets and auto-update statuses when tasks are marked complete.",
    version: "0.9.5",
    author: "Atlassian",
    icon: "trello", // lucide doesn't have Jira, fallback
    isInstalled: false,
    tags: ["Productivity", "Agile"]
  },
  {
    id: "mcp-weather",
    name: "Weather Node",
    description: "Append local weather data to your daily journal entries automatically.",
    version: "2.1.0",
    author: "WeatherGeeks",
    icon: "cloud-rain",
    isInstalled: false,
    tags: ["Life", "Automation"]
  },
  {
    id: "mcp-linear",
    name: "Linear Integration",
    description: "Create and manage Linear issues from your notes.",
    version: "1.0.1",
    author: "Linear",
    icon: "git-merge",
    isInstalled: false,
    tags: ["Productivity", "Development"]
  },
  {
    id: "mcp-spotify",
    name: "Spotify Now Playing",
    description: "Log your currently playing track into your daily notes.",
    version: "3.0.0",
    author: "MusicLover99",
    icon: "headphones",
    isInstalled: true,
    tags: ["Media", "Journaling"]
  },
  {
    id: "mcp-arxiv",
    name: "ArXiv Search",
    description: "Search and import academic papers directly into your knowledge graph as connected nodes.",
    version: "1.0.0",
    author: "ScienceHub",
    icon: "graduation-cap",
    isInstalled: false,
    tags: ["Research", "Academic"]
  }
]

// Determine where we store the mock "installed" state so it persists across hot reloads
const getConfigPath = () => path.resolve(process.cwd(), '../brain/.plugins.json')

async function getPluginsState(): Promise<McpPlugin[]> {
  const configPath = getConfigPath()
  try {
     const data = await fs.readFile(configPath, 'utf8')
     const installedIds = JSON.parse(data) as string[]
     return MOCK_PLUGINS.map(p => ({
        ...p,
        isInstalled: installedIds.includes(p.id) || (p.isInstalled && !installedIds.includes('__initialized__')) 
        // fallback to default if never initialized
     }))
  } catch (e) {
     // Config doesn't exist, return defaults
     return MOCK_PLUGINS
  }
}

async function savePluginsState(plugins: McpPlugin[]) {
   const configPath = getConfigPath()
   const installedIds = plugins.filter(p => p.isInstalled).map(p => p.id)
   installedIds.push('__initialized__') // Marker so we don't fallback to defaults
   await fs.writeFile(configPath, JSON.stringify(installedIds), 'utf8')
}

export async function GET() {
  try {
    const plugins = await getPluginsState()
    return NextResponse.json(plugins)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch plugins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { id, action } = await request.json()
    
    if (action !== 'install' && action !== 'uninstall') {
       return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const plugins = await getPluginsState()
    const target = plugins.find(p => p.id === id)
    
    if (!target) {
       return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    target.isInstalled = action === 'install'
    await savePluginsState(plugins)

    return NextResponse.json({ success: true, plugin: target })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update plugin state' }, { status: 500 })
  }
}
