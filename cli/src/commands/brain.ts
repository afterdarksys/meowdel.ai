import chalk from 'chalk'
import axios from 'axios'
import { loadConfig } from '../api/client'

export async function brainCommand(action: string, query?: string) {
  const config = loadConfig()

  if (!config.apiKey) {
    console.error(chalk.red('API key not configured. Run: meowdel config YOUR_KEY'))
    process.exit(1)
  }

  const client = axios.create({
    baseURL: config.baseUrl + '/api/brain',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
    timeout: 30000,
  })

  try {
    switch (action) {
      case 'search':
        if (!query) {
          console.error(chalk.red('Query required for search'))
          process.exit(1)
        }
        const searchRes = await client.get('/search', { params: { q: query } })
        console.log(chalk.magenta('\n📚 Brain Search Results:\n'))
        searchRes.data.results.forEach((result: any, i: number) => {
          console.log(chalk.cyan(`${i + 1}. ${result.title || result.id}`))
          console.log(chalk.gray(`   Score: ${result.score.toFixed(2)}`))
          console.log(`   ${result.content.substring(0, 150)}...\n`)
        })
        break

      case 'list':
        const listRes = await client.get('/notes')
        console.log(chalk.magenta('\n📝 Brain Notes:\n'))
        listRes.data.notes.forEach((note: any) => {
          console.log(chalk.cyan(`• ${note.title || note.id}`))
          if (note.tags?.length > 0) {
            console.log(chalk.gray(`  Tags: ${note.tags.join(', ')}`))
          }
        })
        console.log(chalk.gray(`\nTotal: ${listRes.data.notes.length} notes\n`))
        break

      case 'graph':
        const graphRes = await client.get('/graph')
        console.log(chalk.magenta('\n🕸️  Brain Graph:\n'))
        console.log(chalk.cyan(`Nodes: ${graphRes.data.nodes.length}`))
        console.log(chalk.cyan(`Links: ${graphRes.data.links.length}`))
        console.log(chalk.gray('\nTop connected nodes:'))
        const sorted = graphRes.data.nodes
          .sort((a: any, b: any) => (b.connections || 0) - (a.connections || 0))
          .slice(0, 10)
        sorted.forEach((node: any, i: number) => {
          console.log(chalk.cyan(`  ${i + 1}. ${node.name} (${node.connections || 0} connections)`))
        })
        console.log()
        break

      default:
        console.error(chalk.red(`Unknown action: ${action}`))
        console.log(chalk.gray('Available actions: search, list, graph'))
        process.exit(1)
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.response?.data?.error || error.message)
    process.exit(1)
  }
}
