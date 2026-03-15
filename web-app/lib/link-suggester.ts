export interface SuggestionContext {
  query: string;
  startIndex: number;
}

export function findLinkTrigger(text: string, cursorPosition: number): SuggestionContext | null {
  // We're looking for text that *could* be a link.
  // Because we want to suggest things naturally without needing [[, we'll watch the current word.
  // E.g., user types "doc" -> we suggest "Docker Basics"

  // Get the text before the cursor
  const textBeforeCursor = text.slice(0, cursorPosition)
  
  // Find the start of the current word or phrase.
  // A simple approach: grab everything from the last space or newline.
  const lastBoundary = textBeforeCursor.search(/[\s\n\r(]/)
  
  // We might want to handle multi-word titles, so let's grab the last 3 words or so.
  // Or simply trigger if we've typed at least 3 characters of *something*.
  
  // Let's implement a robust approach: check the last few words.
  // For simplicity, let's just use the current word/phrase delimited by basic punctuation but allow spaces for multi-word titles.
  // Actually, standard Obsidian style is to trigger when `[[` is typed. 
  // But MISSING_MEW says: "Match against existing note titles in real-time. Show inline suggestion tooltip: "Link to [[existing-note]]?" Fuzzy matching."

  // Let's extract the recent typing context (up to 30 chars before cursor)
  const contextWindow = textBeforeCursor.slice(-30)
  
  // If we are already inside a [[, handle that differently, or just use the whole text.
  const openBracketIndex = contextWindow.lastIndexOf('[[')
  const closeBracketIndex = contextWindow.lastIndexOf(']]')
  
  if (openBracketIndex > -1 && closeBracketIndex < openBracketIndex) {
    // We are inside [[ ...
    const query = contextWindow.slice(openBracketIndex + 2)
    return {
      query,
      startIndex: cursorPosition - query.length - 2
    }
  }

  // Not inside [[. Let's look at the current word group.
  const words = textBeforeCursor.split(/[\n\r.,;:!?"'()\[\]{}]/)
  const currentPhrase = words[words.length - 1]
  
  if (currentPhrase && currentPhrase.trim().length >= 2) {
    return {
      query: currentPhrase.trimStart(), // keep trailing spaces for matching multi-word
      startIndex: cursorPosition - currentPhrase.trimStart().length
    }
  }

  return null
}

export function fuzzyMatch(query: string, text: string): boolean {
  const qStr = query.toLowerCase()
  const tStr = text.toLowerCase()
  
  // Exact substring match first
  if (tStr.includes(qStr)) return true

  // Very basic fuzzy: all chars in query exist in text in order
  let qIdx = 0
  let tIdx = 0
  
  while (qIdx < qStr.length && tIdx < tStr.length) {
    if (qStr[qIdx] === tStr[tIdx]) {
      qIdx++
    }
    tIdx++
  }
  
  return qIdx === qStr.length
}
