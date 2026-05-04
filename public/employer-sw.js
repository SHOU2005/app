const CACHE = 'switch-employer-v1'
const PRECACHE = ['/employer-manifest.json', '/icons/icon-192.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (new URL(e.request.url).pathname.startsWith('/api/')) return
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)) }
      return res
    }).catch(() => caches.match(e.request))
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {}
  e.waitUntil(self.registration.showNotification(data.title ?? 'Switch Employer', {
    body: data.body ?? '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    data: { url: data.url ?? '/employer' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url ?? '/employer'))
})
