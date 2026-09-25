const CACHE_NAME = 'brokerflow-v20260925-v8';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './engine.js',
  './auth.js',
  './manifest.json',
  
  // Static Core Data
  './data/policies.json',
  './data/products.json',
  './data/branches.json',
  './data/tassi_giornalieri.json',
  './data/historical_rates.json',
  './data/comuni.json',
  './data/bnl_policy.json',
  './data/deals.json',

  // PDF Libraries
  './assets/js/pdf.min.js',
  './assets/js/pdf.worker.min.js',

  // App Icons & Brand
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/brand/BrokerFlow_app_icon.png',
  './assets/brand/BrokerFlow_icon.png',
  './assets/brand/BrokerFlow_icon.svg',
  './assets/brand/BrokerFlow_primary.png',
  './assets/brand/BrokerFlow_primary.svg',
  './assets/brand/BrokerFlow_symbol_3d.png',
  './assets/brand/BrokerFlow_symbol_3d_dark.png',
  './assets/brand/BrokerFlow_horizontal.png',
  './assets/brand/BrokerFlow_dark.png',

  // Bank Logos
  './assets/logos/avvera.svg',
  './assets/logos/banco_di_sardegna.jpeg',
  './assets/logos/bancobpm.svg',
  './assets/logos/bdm.png',
  './assets/logos/bdm.svg',
  './assets/logos/bnl.svg',
  './assets/logos/bper.jpeg',
  './assets/logos/bper.svg',
  './assets/logos/chebanca.jpeg',
  './assets/logos/credem.svg',
  './assets/logos/credit_agricole.svg',
  './assets/logos/generic_bank.svg',
  './assets/logos/ing.png',
  './assets/logos/ing.svg',
  './assets/logos/intesa.svg',
  './assets/logos/mediobanca.jpeg',
  './assets/logos/mediobanca.svg',
  './assets/logos/mediobanca_premier.jpeg',
  './assets/logos/mediolanum.svg',
  './assets/logos/mps.jpeg',
  './assets/logos/mps.svg',
  './assets/logos/sardegna.jpeg',
  './assets/logos/sardegna.svg',
  './assets/logos/sella.svg',
  './assets/logos/sparkasse.png',
  './assets/logos/sparkasse.svg',
  './assets/logos/unicredit.svg'
];

// Install: pre-cache all essential static assets and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('BrokerFlow SW pre-fetch non-critical warning:', err);
      });
    })
  );
});

// Activate: delete old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('BrokerFlow SW deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML/JS/CSS, Cache-First with revalidate for static media/assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Check if this is a core code file (HTML, JS, CSS, JSON data)
  const isCoreCode = event.request.mode === 'navigate' || 
                     url.pathname.endsWith('.html') || 
                     url.pathname.endsWith('.js') || 
                     url.pathname.endsWith('.css') || 
                     url.pathname.endsWith('.json');

  if (isCoreCode) {
    // NETWORK-FIRST STRATEGY: always attempt to get freshest code from server
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cached = await caches.match(event.request, { ignoreSearch: true });
          if (cached) return cached;

          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            const indexFallback = await caches.match('./index.html');
            if (indexFallback) return indexFallback;
          }

          return new Response('Offline resource not found', {
            status: 503,
            statusText: 'Service Unavailable (Offline)'
          });
        })
    );
  } else {
    // CACHE-FIRST STRATEGY with background revalidation for images/icons
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        const fetchPromise = fetch(event.request).then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cached || fetchPromise;
      })
    );
  }
});
