'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl select-none">🐱</div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            You&apos;re offline
          </h1>
          <p className="mt-3 text-zinc-400 text-lg">
            Meowdel can&apos;t reach the server right now.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400 space-y-2">
          <p>Your cached notes and brain are still available once you reconnect.</p>
          <p>Check your internet connection and try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition-colors px-6 py-3 font-semibold text-white text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
