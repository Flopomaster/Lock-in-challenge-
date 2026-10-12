// Offline support: the app shell is network-first (so updates land), while sprites and
// fonts are cache-first (they never change and are what makes the app usable offline).
const SHELL = 'shell-v1'
const ASSETS = 'assets-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const CACHE_FIRST_HOSTS = ['raw.githubusercontent.com', 'fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (CACHE_FIRST_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(SHELL).then((cache) => cache.put(req, res.clone()))
          return res
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(self.registration.scope))),
    )
  }
})
