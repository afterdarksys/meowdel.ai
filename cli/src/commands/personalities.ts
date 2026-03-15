import chalk from 'chalk'
import { getPersonalities } from '../api/client'

export async function listPersonalities() {
  try {
    const response = await getPersonalities()

    if (response.success) {
      console.log(chalk.magenta('\n🐱 Available Personalities:\n'))

      response.data.personalities.forEach((p: any) => {
        console.log(chalk.cyan(`${p.id}`))
        console.log(chalk.gray(`  Name: ${p.name}`))
        console.log(chalk.gray(`  Breed: ${p.breed}`))
        console.log(chalk.gray(`  Personality: ${p.personality}`))
        console.log(chalk.gray(`  Greeting: "${p.greeting}"`))
        console.log()
      })
    }
  } catch (error: any) {
    console.error(chalk.red('Error:'), error.response?.data?.error || error.message)

    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Set your API key with: meowdel config YOUR_KEY\n'))
    }

    process.exit(1)
  }
}
