// Minimal offline cache. Network-first (so a deployed update is always picked up
// when online), falling back to the cache when offline or the network is slow.
// Only same-origin GET requests are cached; nothing is ever sent anywhere.
const CACHE = 'thermopolis-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      });
      try {
        return await Promise.race([
          network,
          new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 4000)),
        ]);
      } catch {
        const cached = await cache.match(req, { ignoreSearch: true });
        return cached || network;
      }
    })(),
  );
});
