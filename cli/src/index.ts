#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { chatCommand } from './commands/chat'
import { consoleCommand } from './commands/console'
import { askCommand } from './commands/ask'
import { brainCommand } from './commands/brain'
import { configCommand } from './commands/config'
import dotenv from 'dotenv'

dotenv.config()

const program = new Command()

program
  .name('meowdel')
  .description(chalk.magenta('🐱 Meowdel AI - Chat with your AI cat personalities'))
  .version('1.0.0')

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-p, --personality <name>', 'Choose personality (mittens, luna, etc.)', 'mittens')
  .option('-b, --brain', 'Enable brain context', false)
  .action(chatCommand)

program
  .command('console')
  .description('Launch interactive console with rich UI')
  .option('-p, --personality <name>', 'Choose personality', 'mittens')
  .action(consoleCommand)

program
  .command('ask <question>')
  .description('Ask a one-off question')
  .option('-p, --personality <name>', 'Choose personality', 'mittens')
  .option('-b, --brain', 'Enable brain context', false)
  .option('-j, --json', 'Output as JSON', false)
  .action(askCommand)

program
  .command('brain')
  .description('Brain knowledge operations')
  .argument('<action>', 'Action: search, list, graph')
  .argument('[query]', 'Query for search')
  .action(brainCommand)

program
  .command('config')
  .description('Configure API key and settings')
  .argument('[key]', 'API key to set')
  .action(configCommand)

program
  .command('personalities')
  .description('List available AI personalities')
  .action(async () => {
    const { listPersonalities } = await import('./commands/personalities')
    await listPersonalities()
  })

program.parse(process.argv)
