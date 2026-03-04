'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* Sad Cat Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-8xl mb-6"
        >
          😿
        </motion.div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Checkout Cancelled
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          No worries! Your subscription wasn't started and you weren't charged.
        </p>

        {/* Why Cancel Section */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Changed your mind?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You can still use Meowdel for free! The free tier includes 100 messages per month
            with Meowdel.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            If you had questions about pricing or features, we'd love to help! Just reach out
            to us.
          </p>
        </div>

        {/* Options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/chat"
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Try Free Chat 🐱
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
          >
            View Plans Again
          </Link>
        </div>

        {/* Support */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Have questions about our plans?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@meowdel.ai"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              📧 Email Support
            </a>
            <a
              href="https://twitter.com/meowdel_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              🐦 Twitter
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
