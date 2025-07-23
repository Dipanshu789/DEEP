self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Navigation fallback for SPA routing
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open('attendance-app-cache').then(async cache => {
        let response = await cache.match('/index.html');
        if (response) return response;
        return await fetch('/index.html');
      })
    );
    return;
  }
  // Asset and API requests
  event.respondWith(
    caches.open('attendance-app-cache').then(cache => {
      return cache.match(event.request).then(response => {
        return response || fetch(event.request).then(networkResponse => {
          if (event.request.method === 'GET' && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
