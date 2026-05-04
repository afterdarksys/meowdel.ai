import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { outboundWebhooks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export type WebhookEvent =
  | 'note.created'
  | 'note.updated'
  | 'note.deleted'
  | 'note.published'
  | 'note.tagged'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

export async function dispatchWebhooks(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  const hooks = await db
    .select()
    .from(outboundWebhooks)
    .where(
      and(
        eq(outboundWebhooks.userId, userId),
        eq(outboundWebhooks.isActive, true),
      )
    )

  const matching = hooks.filter(h => h.events.includes(event))
  if (matching.length === 0) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }
  const body = JSON.stringify(payload)

  await Promise.allSettled(
    matching.map(async hook => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Meowdel-Event': event,
        'X-Meowdel-Delivery': crypto.randomUUID(),
      }

      if (hook.secret) {
        const sig = createHmac('sha256', hook.secret).update(body).digest('hex')
        headers['X-Meowdel-Signature'] = `sha256=${sig}`
      }

      try {
        const res = await fetch(hook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10_000),
        })

        await db
          .update(outboundWebhooks)
          .set({
            lastTriggeredAt: new Date(),
            lastStatusCode: res.status,
            failureCount: res.ok ? 0 : (hook.failureCount ?? 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(outboundWebhooks.id, hook.id))
      } catch {
        await db
          .update(outboundWebhooks)
          .set({
            lastTriggeredAt: new Date(),
            failureCount: (hook.failureCount ?? 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(outboundWebhooks.id, hook.id))
      }
    })
  )
}
