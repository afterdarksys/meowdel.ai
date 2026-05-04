export type RepeatFrequency = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'

const DOW_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function getLocalParts(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]))
  return {
    year: parseInt(parts.year),
    month: parseInt(parts.month),   // 1-12
    day: parseInt(parts.day),
    hour: parts.hour === '24' ? 0 : parseInt(parts.hour),
    minute: parseInt(parts.minute),
    dow: DOW_MAP[parts.weekday] ?? 0,  // 0=Sun
  }
}

/**
 * Convert a local date/time in `tz` to UTC.
 * Uses a two-pass approach to handle DST correctly.
 */
function localToUTC(year: number, month: number, day: number, h: number, min: number, tz: string): Date {
  // Pass 1: treat local time as UTC to get rough estimate
  const rough = new Date(Date.UTC(year, month - 1, day, h, min, 0))
  // Find what local time that UTC moment is in the target tz
  const parts = getLocalParts(rough, tz)
  const offsetMins = (parts.hour * 60 + parts.minute) - (h * 60 + min)
  return new Date(rough.getTime() - offsetMins * 60000)
}

function isValidDow(freq: RepeatFrequency, repeatDays: number[], dow: number): boolean {
  switch (freq) {
    case 'none':     return true
    case 'daily':    return true
    case 'weekdays': return dow >= 1 && dow <= 5
    case 'weekends': return dow === 0 || dow === 6
    case 'weekly':   return repeatDays.includes(dow)
    case 'custom':   return repeatDays.includes(dow)
  }
}

/**
 * Compute the next UTC timestamp when this alarm should fire.
 * Returns null only when repeatFrequency is 'custom' or 'weekly' with no valid days.
 */
export function computeNextFireAt(
  hour: number,
  minute: number,
  timezone: string,
  repeatFrequency: RepeatFrequency,
  repeatDays: number[],
  now: Date = new Date(),
): Date | null {
  const local = getLocalParts(now, timezone)

  // Start: alarm time today in the user's timezone
  let candidate = localToUTC(local.year, local.month, local.day, hour, minute, timezone)

  // If that moment is already in the past, move to tomorrow
  if (candidate.getTime() <= now.getTime()) {
    // Advance 25h to safely cross midnight even with DST
    const tomorrow = new Date(candidate.getTime() + 25 * 60 * 60 * 1000)
    const tParts = getLocalParts(tomorrow, timezone)
    candidate = localToUTC(tParts.year, tParts.month, tParts.day, hour, minute, timezone)
  }

  // Walk forward up to 7 days to land on a valid day-of-week
  for (let i = 0; i < 7; i++) {
    const parts = getLocalParts(candidate, timezone)
    if (isValidDow(repeatFrequency, repeatDays, parts.dow)) {
      return candidate
    }
    const next = new Date(candidate.getTime() + 25 * 60 * 60 * 1000)
    const nextParts = getLocalParts(next, timezone)
    candidate = localToUTC(nextParts.year, nextParts.month, nextParts.day, hour, minute, timezone)
  }

  return null
}

/** Human-readable description of a repeat schedule. */
export function describeRepeat(freq: RepeatFrequency, days: number[]): string {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  switch (freq) {
    case 'none':     return 'Once'
    case 'daily':    return 'Every day'
    case 'weekdays': return 'Weekdays'
    case 'weekends': return 'Weekends'
    case 'weekly':   return `Weekly on ${days.map(d => DAY_NAMES[d]).join(', ')}`
    case 'custom':   return days.length ? days.map(d => DAY_NAMES[d]).join(', ') : 'Custom (no days set)'
  }
}
