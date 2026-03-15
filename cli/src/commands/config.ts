import chalk from 'chalk'
import { loadConfig, saveConfig } from '../api/client'

export async function configCommand(key?: string) {
  if (!key) {
    const config = loadConfig()
    console.log(chalk.magenta('\n📋 Current Configuration:\n'))
    console.log(chalk.cyan('API Key:'), config.apiKey ? '****' + config.apiKey.slice(-8) : 'Not set')
    console.log(chalk.cyan('Base URL:'), config.baseUrl)
    console.log()
    return
  }

  const config = loadConfig()
  config.apiKey = key
  saveConfig(config)

  console.log(chalk.green('\n✅ API key saved successfully!\n'))
  console.log(chalk.gray('You can now use: meowdel chat\n'))
}
