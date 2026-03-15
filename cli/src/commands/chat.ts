import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { chatRequest } from '../api/client'

interface ChatOptions {
  personality: string
  brain: boolean
}

export async function chatCommand(options: ChatOptions) {
  console.clear()
  console.log(chalk.magenta.bold('🐱 Meowdel Chat'))
  console.log(chalk.gray(`Chatting with: ${options.personality}`))
  console.log(chalk.gray(`Brain context: ${options.brain ? 'enabled' : 'disabled'}`))
  console.log(chalk.gray('Type "exit" or "quit" to end the chat\n'))

  const conversationHistory: Array<{ role: string; content: string }> = []

  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: chalk.blue('You:'),
        prefix: '',
      },
    ])

    if (!message.trim()) continue
    if (['exit', 'quit', 'q'].includes(message.toLowerCase())) {
      console.log(chalk.yellow('\n👋 Goodbye!\n'))
      break
    }

    const spinner = ora(chalk.gray('Thinking...')).start()

    try {
      const response = await chatRequest(message, {
        personality: options.personality,
        useBrainContext: options.brain,
        conversationHistory,
      })

      spinner.stop()

      if (response.success) {
        const aiMessage = response.data.message
        console.log(chalk.magenta(`\n${response.data.personality.name}:`), aiMessage)

        if (response.data.brainContext && response.data.brainContext.length > 0) {
          console.log(
            chalk.gray(`\n📚 Used ${response.data.brainContext.length} brain documents`)
          )
        }

        console.log(
          chalk.gray(
            `\n💭 Tokens: ${response.data.usage.inputTokens}↑ ${response.data.usage.outputTokens}↓\n`
          )
        )

        // Update conversation history
        conversationHistory.push({ role: 'user', content: message })
        conversationHistory.push({ role: 'assistant', content: aiMessage })

        // Keep only last 20 messages
        if (conversationHistory.length > 20) {
          conversationHistory.splice(0, 2)
        }
      } else {
        console.log(chalk.red('Error:'), response.error)
      }
    } catch (error: any) {
      spinner.stop()
      console.error(chalk.red('Error:'), error.response?.data?.error || error.message)

      if (error.response?.status === 401) {
        console.log(chalk.yellow('\n💡 Tip: Set your API key with: meowdel config YOUR_KEY\n'))
        break
      }
    }
  }
}
