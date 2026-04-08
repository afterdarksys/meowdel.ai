/**
 * Stripe Webhook — Subscription Sync
 *
 * Register this URL in Stripe Dashboard → Webhooks:
 *   https://yourdomain.com/api/stripe/webhook
 *
 * Events to enable:
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   checkout.session.completed
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Map Stripe price IDs → subscription tiers
function priceToTier(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'team'
  return 'free'
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const tier = priceToTier(priceId)
  const status = subscription.status // active, canceled, past_due, etc.
  const expiresAt = new Date(((subscription as unknown as { current_period_end: number }).current_period_end) * 1000)

  await db.update(users)
    .set({
      subscriptionTier: status === 'active' ? tier : 'free',
      subscriptionStatus: status,
      subscriptionExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId))
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const customerId = session.customer as string
  const customerEmail = session.customer_email

  // Link Stripe customer ID to our user by email
  if (customerEmail && customerId) {
    await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.email, customerEmail))
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
    }
  } catch (err) {
    console.error(`[Stripe] Failed to process ${event.type}:`, err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
