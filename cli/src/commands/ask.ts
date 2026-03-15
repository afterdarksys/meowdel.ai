import chalk from 'chalk'
import ora from 'ora'
import { chatRequest } from '../api/client'

interface AskOptions {
  personality: string
  brain: boolean
  json: boolean
}

export async function askCommand(question: string, options: AskOptions) {
  const spinner = ora(chalk.gray('Thinking...')).start()

  try {
    const response = await chatRequest(question, {
      personality: options.personality,
      useBrainContext: options.brain,
    })

    spinner.stop()

    if (options.json) {
      console.log(JSON.stringify(response, null, 2))
      return
    }

    if (response.success) {
      console.log(chalk.magenta(`\n${response.data.personality.name}:`))
      console.log(response.data.message)

      if (response.data.brainContext && response.data.brainContext.length > 0) {
        console.log(chalk.gray(`\n📚 Used ${response.data.brainContext.length} brain documents`))
      }

      console.log(
        chalk.gray(
          `\n💭 Tokens: ${response.data.usage.inputTokens}↑ ${response.data.usage.outputTokens}↓\n`
        )
      )
    } else {
      console.error(chalk.red('Error:'), response.error)
      process.exit(1)
    }
  } catch (error: any) {
    spinner.stop()
    console.error(chalk.red('Error:'), error.response?.data?.error || error.message)

    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Set your API key with: meowdel config YOUR_KEY\n'))
    }

    process.exit(1)
  }
}
