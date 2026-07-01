// ============================================================
// L1DERES Car Wash — Service Worker v5
// Estrategia: Cache-First para assets, Stale-While-Revalidate
// para API, Background Sync para requests offline + Offline Page
// ============================================================

const CACHE_VERSION = 'v11';
const CACHE_NAME = `lavadero-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lavadero-dynamic-${CACHE_VERSION}`;
const SYNC_STORE_NAME = 'sync-store';
const DB_NAME = 'lavadero-offline-db';
const OFFLINE_URL = './offline.html';

// Assets críticos que se cachean en la instalación
const STATIC_ASSETS = [
  './cliente.html',
  './kiosko.html',
  './tablet_ingreso.html',
  './app.js',
  './estilos.css',
  './manifest.json',
  './manifest-kiosko.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './offline.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=Orbitron:wght@500;700;900&family=Outfit:wght@300;400;600;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ─── IndexedDB helpers ──────────────────────────────────────

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

async function saveRequestForSync(url, method, headers, body) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    store.add({ url, method, headers, body, timestamp: Date.now() });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject();
  });
}

async function syncPendingRequests() {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const items = request.result;
      if (!items || items.length === 0) return resolve();

      for (const item of items) {
        try {
          await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
          });
          const deleteTx = db.transaction(SYNC_STORE_NAME, 'readwrite');
          deleteTx.objectStore(SYNC_STORE_NAME).delete(item.id);
        } catch (e) {
          console.warn('[SW] Fallo al reintentar request:', e);
        }
      }
      resolve();
    };
  });
}

// ─── Install: cachear assets estáticos ──────────────────────

self.addEventListener('install', event => {
  console.log(`[SW] Instalando ${CACHE_NAME}...`);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Algunos assets no se pudieron cachear:', err);
      });
    })
  );
});

// ─── Activate: limpiar cachés viejos ────────────────────────

self.addEventListener('activate', event => {
  console.log(`[SW] Activando ${CACHE_NAME}...`);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[SW] Eliminando caché viejo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: estrategias por tipo de request ─────────────────

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar extensiones de Chrome y requests no-http
  if (!request.url.startsWith('http')) return;

  // POST/PATCH offline → Background Sync con Supabase
  if (request.method !== 'GET') {
    if (url.origin.includes('supabase.co')) {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          console.log('[SW] Offline: guardando POST en IndexedDB...');
          const headers = {};
          request.headers.forEach((value, key) => { headers[key] = value; });
          const body = await request.clone().text();
          await saveRequestForSync(request.url, request.method, headers, body);

          if ('sync' in self.registration) {
            self.registration.sync.register('sync-supabase-data');
          }

          return new Response(JSON.stringify({ status: 'queued_offline', message: 'Request guardado para sincronizar cuando haya conexión.' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
    }
    return;
  }

  // GET a Supabase API → Stale-While-Revalidate
  if (url.origin.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(networkRes => {
            if (networkRes && networkRes.status === 200) {
              cache.put(request, networkRes.clone());
            }
            return networkRes;
          }).catch(() => {
            console.log('[SW] Offline: sirviendo API desde caché');
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // GET a Google Fonts / CDN → Cache-First
  if (url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com') ||
      url.origin.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // GET assets locales → Network First, fallback a caché
  event.respondWith(
    fetch(request).then(networkRes => {
      if (networkRes && networkRes.status === 200) {
        caches.open(CACHE_NAME).then(cache => cache.put(request, networkRes.clone()));
      }
      return networkRes;
    }).catch(() => {
      return caches.match(request).then(cached => {
        if (cached) return cached;
        // Si es navegación a una página HTML, mostrar offline.html
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        console.log('[SW] Recurso no disponible offline:', request.url);
      });
    })
  );
});

// ─── Background Sync ────────────────────────────────────────

self.addEventListener('sync', event => {
  if (event.tag === 'sync-supabase-data') {
    console.log('[SW] Background Sync activado. Sincronizando...');
    event.waitUntil(syncPendingRequests());
  }
});

// ─── Push Notifications ─────────────────────────────────────

self.addEventListener('push', event => {
  const data = event.data
    ? event.data.json()
    : { title: 'L1DERES Car Wash', body: '¡Tu auto está listo! 🚗✨' };

  const options = {
    body: data.body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'lavadero-notif',
    renotify: true,
    data: { url: data.url || './cliente.html' },
    actions: [
      { action: 'ver', title: 'Ver estado 🚗' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'L1DERES Car Wash', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'cerrar') return;

  const targetUrl = event.notification.data?.url || './cliente.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('app_cliente') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ─── Mensaje desde la app ────────────────────────────────────

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
