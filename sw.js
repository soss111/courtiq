const CACHE = 'courtiq-v1';
const SHELL = [
  '/courtiq/',
  '/courtiq/index.html'
];

// Install: cache the app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for Google APIs, cache-first for app shell
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always go network for Google APIs and external resources
  if (url.includes('script.google.com') ||
      url.includes('googleapis.com') ||
      url.includes('fonts.')) {
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        // Update cache with fresh version
        if (response.ok && e.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() { return cached; });

      // Return cached immediately if available, update in background
      return cached || networkFetch;
    })
  );
});
