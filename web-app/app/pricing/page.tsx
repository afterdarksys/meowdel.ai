'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface PricingTier {
  name: string
  price: number
  interval: 'month' | 'year'
  priceId: string
  messages: string
  features: string[]
  popular?: boolean
  cta: string
  voiceMinutes?: string
}

interface AddOnPack {
  name: string
  price: number
  priceId: string
  features: string[]
  icon: string
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    interval: 'month',
    priceId: '',
    messages: '100 messages/month',
    features: [
      'Chat with Meowdel',
      'Basic personality responses',
      'Code help and debugging',
      'Community support',
    ],
    cta: 'Start Free',
  },
  {
    name: 'Purr',
    price: 9,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PURR || '',
    messages: '1,000 messages/month',
    voiceMinutes: '3 minutes voice/day',
    features: [
      'Everything in Free',
      'All cat personalities',
      '3 minutes voice chat/day',
      '1 daily text from your cat',
      'Priority responses',
      'Email support',
    ],
    popular: true,
    cta: 'Start Purring',
  },
  {
    name: 'Meow',
    price: 25,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEOW || '',
    messages: '5,000 messages/month',
    voiceMinutes: '7 minutes voice/day',
    features: [
      'Everything in Purr',
      '7 minutes voice chat/day',
      '3 daily texts from your cat',
      '1 wake-up call/day',
      '2 reminders/day',
      'Vision capabilities (upload photos)',
      'API access',
    ],
    cta: 'Get Meowing',
  },
  {
    name: 'Biscuits',
    price: 55,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BISCUITS || '',
    messages: '15,000 messages/month',
    voiceMinutes: '15 minutes voice/day',
    features: [
      'Everything in Meow',
      '15 minutes voice chat/day',
      '5 daily texts from your cat',
      '2 wake-up calls/day',
      '5 reminders/day',
      'WhatsApp integration',
      'Priority support',
    ],
    cta: 'Make Biscuits',
  },
  {
    name: 'Swat',
    price: 75,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SWAT || '',
    messages: '30,000 messages/month',
    voiceMinutes: '30 minutes voice/day',
    features: [
      'Everything in Biscuits',
      '30 minutes voice chat/day',
      '10 daily texts from your cat',
      '3 wake-up calls/day',
      '10 reminders/day',
      'SMS access',
      'Advanced API features',
    ],
    cta: 'Time to Swat',
  },
  {
    name: 'Roar',
    price: 100,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ROAR || '',
    messages: 'Unlimited messages',
    voiceMinutes: 'Unlimited voice',
    features: [
      'Everything in Swat',
      'Unlimited messages',
      'Unlimited voice chat',
      'Unlimited texts',
      'Unlimited wake-up calls',
      'Unlimited reminders',
      'Phone access (1-800-PET-TALK)',
      'White-label options',
      'Dedicated support',
    ],
    cta: 'Unleash the Roar',
  },
]

const addOnPacks: AddOnPack[] = [
  {
    name: 'Extra Voice Time',
    price: 10,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ADDON_VOICE || 'price_1T5xKzRzkrRnzwVvN08cs3Xa',
    icon: '📞',
    features: [
      '+30 minutes voice/day',
      'Stacks with your plan',
      'Roll over unused minutes',
    ],
  },
  {
    name: 'Wake-Up Pack',
    price: 5,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ADDON_WAKEUP || 'price_1T5xKzRzkrRnzwVvvbNViudr',
    icon: '⏰',
    features: [
      '+5 wake-up calls/day',
      'Custom wake-up messages',
      'Snooze protection mode',
    ],
  },
  {
    name: 'Daily Check-Ins',
    price: 8,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ADDON_TEXTS || 'price_1T5xL0RzkrRnzwVvPiTb48t0',
    icon: '💬',
    features: [
      '+10 daily texts',
      'Scheduled check-ins',
      'Mood-based messages',
    ],
  },
  {
    name: 'Reminder Pro',
    price: 7,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ADDON_REMINDERS || 'price_1T5xL0RzkrRnzwVvB0BF28X5',
    icon: '🔔',
    features: [
      '+10 reminders/day',
      'Smart scheduling',
      'Context-aware alerts',
    ],
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const handleCheckout = async (priceId: string, tierName: string) => {
    if (!priceId) {
      // Free tier - just go to chat
      window.location.href = '/chat'
      return
    }

    setLoading(tierName)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          email: email || undefined,
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              🐱 Meowdel.ai
            </Link>
            <Link
              href="/chat"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From curious cat lovers to power users - we have a plan for every spending pattern!
          </p>

          {/* Email Input */}
          <div className="mt-8 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Add your email to pre-fill checkout (optional)
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-16">
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${
                tier.popular ? 'ring-4 ring-purple-500 ring-opacity-50 lg:col-span-2' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 -mt-3 -mr-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/{tier.interval}</span>
                  )}
                </div>
                <p className="text-purple-600 dark:text-purple-400 font-medium text-sm mb-1">
                  {tier.messages}
                </p>
                {tier.voiceMinutes && (
                  <p className="text-pink-600 dark:text-pink-400 font-medium text-sm mb-4">
                    {tier.voiceMinutes}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 min-h-[200px]">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 text-sm">✓</span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.priceId, tier.name)}
                disabled={loading === tier.name}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                  tier.popular
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.name ? 'Loading...' : tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Add-On Packs Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Add-On Packs
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Customize your plan with extra features. Add as many as you need!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOnPacks.map((addon) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md p-6 border-2 border-purple-200 dark:border-purple-800"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{addon.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {addon.name}
                  </h3>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    +${addon.price}/mo
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {addon.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 mr-2 text-sm">+</span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(addon.priceId, addon.name)}
                  disabled={loading === addon.name}
                  className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {loading === addon.name ? 'Loading...' : 'Add to Plan'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* After Dark Employee Notice */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              💼 After Dark Systems Employees
            </h3>
            <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Sign in with your After Dark SSO account for unlimited access to all features!
              We detect @afterdarksystems.com emails automatically.
            </p>
            <button className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
              Sign In with After Dark SSO (Coming Soon)
            </button>
          </div>
        </div>

        {/* Pricing Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-2">Free</th>
                  <th className="text-center py-4 px-2 bg-purple-50 dark:bg-purple-900/20">Purr</th>
                  <th className="text-center py-4 px-2">Meow</th>
                  <th className="text-center py-4 px-2">Biscuits</th>
                  <th className="text-center py-4 px-2">Swat</th>
                  <th className="text-center py-4 px-2">Roar</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Messages/month</td>
                  <td className="text-center py-3 px-2">100</td>
                  <td className="text-center py-3 px-2 bg-purple-50 dark:bg-purple-900/20">1,000</td>
                  <td className="text-center py-3 px-2">5,000</td>
                  <td className="text-center py-3 px-2">15,000</td>
                  <td className="text-center py-3 px-2">30,000</td>
                  <td className="text-center py-3 px-2">∞</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Voice minutes/day</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2 bg-purple-50 dark:bg-purple-900/20">3</td>
                  <td className="text-center py-3 px-2">7</td>
                  <td className="text-center py-3 px-2">15</td>
                  <td className="text-center py-3 px-2">30</td>
                  <td className="text-center py-3 px-2">∞</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Daily texts</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2 bg-purple-50 dark:bg-purple-900/20">1</td>
                  <td className="text-center py-3 px-2">3</td>
                  <td className="text-center py-3 px-2">5</td>
                  <td className="text-center py-3 px-2">10</td>
                  <td className="text-center py-3 px-2">∞</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Wake-up calls/day</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2 bg-purple-50 dark:bg-purple-900/20">-</td>
                  <td className="text-center py-3 px-2">1</td>
                  <td className="text-center py-3 px-2">2</td>
                  <td className="text-center py-3 px-2">3</td>
                  <td className="text-center py-3 px-2">∞</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-medium">Reminders/day</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2 bg-purple-50 dark:bg-purple-900/20">-</td>
                  <td className="text-center py-3 px-2">2</td>
                  <td className="text-center py-3 px-2">5</td>
                  <td className="text-center py-3 px-2">10</td>
                  <td className="text-center py-3 px-2">∞</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Can I mix and match add-ons?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Add as many add-on packs as you need to customize your perfect plan. They all stack with your base tier.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely! Change your plan anytime through the customer portal. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                What happens to unused voice minutes?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Daily voice minutes reset each day, but with our Extra Voice Time add-on, unused minutes roll over for up to 30 days!
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! We offer a 7-day money-back guarantee. Just contact support if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
