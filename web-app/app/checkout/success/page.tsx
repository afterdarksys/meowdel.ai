'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('session_id')
    setSessionId(id)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to the Family! 🐱
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Your subscription is now active and Meowdel is excited to chat with you!
        </p>

        {/* What's Next */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            What's Next?
          </h2>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <span className="text-purple-500 mr-3 text-xl">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Start chatting</strong> - Your premium access is active right now!
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-3 text-xl">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Check your email</strong> - Receipt and account details sent
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-3 text-xl">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Manage subscription</strong> - Update payment, view invoices anytime
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-3 text-xl">✓</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong>Early access</strong> - You'll get new features before anyone else!
              </span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Start Chatting Now! 🎉
          </Link>
          <a
            href="https://billing.stripe.com/p/login/test_123"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
          >
            Manage Subscription
          </a>
        </div>

        {/* Session ID for debugging */}
        {sessionId && (
          <p className="mt-8 text-xs text-gray-400">
            Session ID: {sessionId}
          </p>
        )}

        {/* Support */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Questions? Need help?{' '}
            <a
              href="mailto:support@meowdel.ai"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <SuccessContent />
    </Suspense>
  )
}
