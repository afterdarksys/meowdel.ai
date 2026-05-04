import chalk from 'chalk'
import { loadConfig, saveConfig } from '../api/client'

export async function configCommand(key?: string, options: { url?: string; pet?: string } = {}) {
  const config = loadConfig()

  if (!key && !options.url && !options.pet) {
    console.log(chalk.magenta('\n📋 Current Configuration:\n'))
    console.log(chalk.cyan('API Key:    '), config.apiKey ? '****' + config.apiKey.slice(-8) : chalk.red('Not set'))
    console.log(chalk.cyan('Base URL:   '), config.baseUrl || 'https://meowdel.ai')
    console.log(chalk.cyan('Default pet:'), config.defaultPet || 'meowdel')
    console.log()
    if (!config.apiKey) {
      console.log(chalk.yellow('Set your API key: meowdel config <YOUR_API_KEY>'))
      console.log(chalk.gray('Get a key from: meowdel.ai/brain/api-keys\n'))
    }
    return
  }

  if (key) {
    config.apiKey = key
    console.log(chalk.green('✓ API key saved'))
  }
  if (options.url) {
    config.baseUrl = options.url.replace(/\/$/, '')
    console.log(chalk.green(`✓ Base URL set to ${config.baseUrl}`))
  }
  if (options.pet) {
    config.defaultPet = options.pet
    console.log(chalk.green(`✓ Default pet set to ${options.pet}`))
  }

  saveConfig(config)
}
