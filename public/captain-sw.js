const CACHE = 'captain-v1'
const OFFLINE_URL = '/captain/login'

const PRECACHE = [
  '/captain/login',
  '/captain',
  '/captain/attendance',
  '/captain/commissions',
  '/captain/tasks',
  '/captain/leaderboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // API calls: network only
  if (url.pathname.startsWith('/api/')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Switch Captain', {
      body: data.body ?? 'You have a new task or update.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'captain-notif',
      renotify: true,
      data: { url: data.url ?? '/captain' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/captain'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes('/captain') && 'focus' in c) return c.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
