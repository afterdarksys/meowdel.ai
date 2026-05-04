const CACHE_NAME = 'meowdel-v1'
const STATIC_ASSETS = ['/', '/brain', '/chat', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  )
  self.clients.claim()
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const action = event.action
  const data = event.notification.data ?? {}

  if (action === 'snooze' && data.alarmId) {
    event.waitUntil(
      fetch(`/api/brain/alarms/${data.alarmId}/snooze`, { method: 'PATCH' }).catch(() => {})
    )
    return
  }

  // Default: focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow('/brain')
    })
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return // never cache API calls

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('/offline')))
  )
})
