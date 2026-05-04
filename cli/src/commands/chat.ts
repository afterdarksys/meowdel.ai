import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { chatRequest, apiError, loadConfig, KNOWN_PETS } from '../api/client'

interface ChatOptions {
  pet: string
}

export async function chatCommand(options: ChatOptions) {
  const config = loadConfig()
  const petId = options.pet || config.defaultPet || 'meowdel'

  console.log(chalk.magenta.bold('\n🐱 Meowdel Chat'))
  console.log(chalk.gray(`Pet: ${petId}  |  type "exit" to quit\n`))

  const history: Array<{ role: string; content: string }> = []

  while (true) {
    const { message } = await inquirer.prompt([{
      type: 'input',
      name: 'message',
      message: chalk.blue('You:'),
      prefix: '',
    }])

    const trimmed = message.trim()
    if (!trimmed) continue
    if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
      console.log(chalk.yellow('\n👋 Goodbye!\n'))
      break
    }

    const spinner = ora(chalk.gray('Thinking...')).start()
    try {
      const res = await chatRequest(trimmed, petId, history)
      spinner.stop()

      console.log(chalk.magenta(`\n${res.petName}:`), res.message)

      const r = res._routing
      if (r) {
        const parts: string[] = [`${r.tier} · ${r.model}`]
        if (r.activeSkills?.length) parts.push(`skills: ${r.activeSkills.join(', ')}`)
        if (r.cascadeMemoriesUsed) parts.push(`${r.cascadeMemoriesUsed} memories`)
        console.log(chalk.gray(`  ↳ ${parts.join(' · ')}\n`))
      }

      history.push({ role: 'user', content: trimmed })
      history.push({ role: 'assistant', content: res.message })
      if (history.length > 20) history.splice(0, 2)
    } catch (err) {
      spinner.stop()
      console.error(chalk.red('Error:'), apiError(err))
      if ((err as any).response?.status === 401) {
        console.log(chalk.yellow('💡 Run: meowdel config YOUR_API_KEY\n'))
        break
      }
    }
  }
}
