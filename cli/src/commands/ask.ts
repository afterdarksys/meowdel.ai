import chalk from 'chalk'
import ora from 'ora'
import { chatRequest, apiError, loadConfig } from '../api/client'

interface AskOptions {
  pet: string
  json: boolean
}

export async function askCommand(question: string, options: AskOptions) {
  const config = loadConfig()
  const petId = options.pet || config.defaultPet || 'meowdel'

  const spinner = ora(chalk.gray('Thinking...')).start()
  try {
    const res = await chatRequest(question, petId)
    spinner.stop()

    if (options.json) {
      console.log(JSON.stringify(res, null, 2))
      return
    }

    console.log(chalk.magenta(`\n${res.petName}:`))
    console.log(res.message)

    const r = res._routing
    if (r) {
      console.log(chalk.gray(`\n↳ ${r.tier} · ${r.model}${r.reason ? ' · ' + r.reason : ''}\n`))
    }
  } catch (err) {
    spinner.stop()
    console.error(chalk.red('Error:'), apiError(err))
    if ((err as any).response?.status === 401) {
      console.log(chalk.yellow('💡 Run: meowdel config YOUR_API_KEY'))
    }
    process.exit(1)
  }
}
