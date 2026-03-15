import blessed from 'blessed'
import chalk from 'chalk'
import { chatRequest } from '../api/client'

interface ConsoleOptions {
  personality: string
}

export async function consoleCommand(options: ConsoleOptions) {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Meowdel Console',
  })

  // Header
  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: `{center}🐱 Meowdel Console - ${options.personality}{/center}`,
    tags: true,
    style: {
      fg: 'magenta',
      bold: true,
      border: {
        fg: 'cyan'
      }
    },
    border: {
      type: 'line'
    }
  })

  // Chat display
  const chatBox = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: '80%-3',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      style: {
        bg: 'cyan'
      }
    },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    }
  })

  // Input box
  const inputBox = blessed.textarea({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    inputOnFocus: true,
    keys: true,
    mouse: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      },
      focus: {
        border: {
          fg: 'magenta'
        }
      }
    },
    label: ' Message (Ctrl+S to send, Ctrl+C to exit) '
  })

  screen.append(header)
  screen.append(chatBox)
  screen.append(inputBox)

  inputBox.focus()

  const conversationHistory: Array<{ role: string; content: string }> = []
  let chatContent = ''

  function appendMessage(role: string, message: string, color: string = 'white') {
    const timestamp = new Date().toLocaleTimeString()
    chatContent += `{${color}-fg}[${timestamp}] ${role}:{/${color}-fg} ${message}\n\n`
    chatBox.setContent(chatContent)
    chatBox.setScrollPerc(100)
    screen.render()
  }

  appendMessage('System', `Connected to ${options.personality}. Start chatting!`, 'gray')

  // Send message handler
  async function sendMessage() {
    const message = inputBox.getValue().trim()
    if (!message) return

    inputBox.clearValue()
    screen.render()

    appendMessage('You', message, 'blue')

    try {
      const response = await chatRequest(message, {
        personality: options.personality,
        useBrainContext: false,
        conversationHistory,
      })

      if (response.success) {
        const aiMessage = response.data.message
        appendMessage(response.data.personality.name, aiMessage, 'magenta')

        conversationHistory.push({ role: 'user', content: message })
        conversationHistory.push({ role: 'assistant', content: aiMessage })

        if (conversationHistory.length > 20) {
          conversationHistory.splice(0, 2)
        }
      } else {
        appendMessage('Error', response.error, 'red')
      }
    } catch (error: any) {
      appendMessage('Error', error.response?.data?.error || error.message, 'red')
    }

    inputBox.focus()
  }

  // Keyboard shortcuts
  inputBox.key(['C-s'], () => {
    sendMessage()
  })

  inputBox.key(['enter'], (ch, key) => {
    // Allow newlines with Shift+Enter
    if (!key.shift) {
      sendMessage()
    }
  })

  screen.key(['C-c', 'q'], () => {
    return process.exit(0)
  })

  screen.render()
}
