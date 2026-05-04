#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

const program = new Command()

program
  .name('meowdel')
  .description(chalk.magenta('🐱 Meowdel AI — Chat with your AI cat from the terminal'))
  .version('2.0.0')

// ── chat ──────────────────────────────────────────────────────────────────────
program
  .command('chat')
  .description('Interactive chat session')
  .option('-p, --pet <id>', 'Pet personality to use', 'meowdel')
  .action(async (opts) => {
    const { chatCommand } = await import('./commands/chat')
    await chatCommand(opts)
  })

// ── console ───────────────────────────────────────────────────────────────────
program
  .command('console')
  .description('Full-screen TUI chat')
  .option('-p, --pet <id>', 'Pet personality to use', 'meowdel')
  .action(async (opts) => {
    const { consoleCommand } = await import('./commands/console')
    await consoleCommand(opts)
  })

// ── ask ───────────────────────────────────────────────────────────────────────
program
  .command('ask <question>')
  .description('Ask a one-shot question')
  .option('-p, --pet <id>', 'Pet personality to use', 'meowdel')
  .option('-j, --json', 'Output raw JSON', false)
  .action(async (question, opts) => {
    const { askCommand } = await import('./commands/ask')
    await askCommand(question, opts)
  })

// ── notes ─────────────────────────────────────────────────────────────────────
const notes = program.command('notes').description('Brain knowledge management')

notes
  .command('list')
  .description('List notes')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-s, --search <query>', 'Filter by title/summary/tag')
  .action(async (opts) => {
    const { notesListCommand } = await import('./commands/notes')
    await notesListCommand(opts)
  })

notes
  .command('view <slug>')
  .description('View a note')
  .action(async (slug) => {
    const { notesViewCommand } = await import('./commands/notes')
    await notesViewCommand(slug)
  })

notes
  .command('new [title]')
  .description('Create a note (opens $EDITOR)')
  .action(async (title) => {
    const { notesNewCommand } = await import('./commands/notes')
    await notesNewCommand(title)
  })

notes
  .command('edit <slug>')
  .description('Edit a note in $EDITOR')
  .action(async (slug) => {
    const { notesEditCommand } = await import('./commands/notes')
    await notesEditCommand(slug)
  })

notes
  .command('delete <slug>')
  .alias('rm')
  .description('Delete a note')
  .action(async (slug) => {
    const { notesDeleteCommand } = await import('./commands/notes')
    await notesDeleteCommand(slug)
  })

notes
  .command('search <query>')
  .description('Semantic search')
  .action(async (query) => {
    const { notesSearchCommand } = await import('./commands/notes')
    await notesSearchCommand(query)
  })

notes
  .command('tags')
  .description('List all tags with counts')
  .action(async () => {
    const { notesTagsCommand } = await import('./commands/notes')
    await notesTagsCommand()
  })

// ── alarms ────────────────────────────────────────────────────────────────────
const alarms = program.command('alarms').description('Alarm clock management (max 5)')

alarms
  .command('list')
  .description('List alarms')
  .action(async () => {
    const { alarmsListCommand } = await import('./commands/alarms')
    await alarmsListCommand()
  })

alarms
  .command('add')
  .description('Create a new alarm (interactive)')
  .action(async () => {
    const { alarmsAddCommand } = await import('./commands/alarms')
    await alarmsAddCommand()
  })

alarms
  .command('edit <id>')
  .description('Edit an alarm')
  .action(async (id) => {
    const { alarmsEditCommand } = await import('./commands/alarms')
    await alarmsEditCommand(id)
  })

alarms
  .command('toggle <id>')
  .description('Enable/disable an alarm')
  .action(async (id) => {
    const { alarmsToggleCommand } = await import('./commands/alarms')
    await alarmsToggleCommand(id)
  })

alarms
  .command('delete <id>')
  .alias('rm')
  .description('Delete an alarm')
  .action(async (id) => {
    const { alarmsDeleteCommand } = await import('./commands/alarms')
    await alarmsDeleteCommand(id)
  })

alarms
  .command('check')
  .description('Check for alarms due now')
  .action(async () => {
    const { alarmsCheckCommand } = await import('./commands/alarms')
    await alarmsCheckCommand()
  })

// ── pets ──────────────────────────────────────────────────────────────────────
program
  .command('pets')
  .description('List available pet personalities')
  .action(async () => {
    const { listPersonalities } = await import('./commands/personalities')
    await listPersonalities()
  })

// ── config ────────────────────────────────────────────────────────────────────
program
  .command('config [apiKey]')
  .description('Configure API key and settings')
  .option('--url <url>', 'Override API base URL')
  .option('--pet <id>', 'Set default pet personality')
  .action(async (apiKey, opts) => {
    const { configCommand } = await import('./commands/config')
    await configCommand(apiKey, opts)
  })

program.parse(process.argv)
