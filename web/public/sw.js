const CACHE_NAME = 'lavadero-cliente-v4-premium';
const DYNAMIC_CACHE = 'lavadero-dynamic-v4';
const SYNC_STORE_NAME = 'sync-store';
const DB_NAME = 'lavadero-offline-db';

// Assets estáticos críticos para PWA (Cache-First)
const staticAssets = [
  './app_cliente.html',
  './style.css',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Orbitron:wght@700;900&family=Outfit:wght@400;600;800&display=swap'
];

// Iniciar IndexedDB
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
    const requestData = { url, method, headers, body, timestamp: Date.now() };
    const request = store.add(requestData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject();
  });
}

async function syncPendingRequests() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
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
          // Eliminar de IDB si fue exitoso
          const deleteTx = db.transaction(SYNC_STORE_NAME, 'readwrite');
          deleteTx.objectStore(SYNC_STORE_NAME).delete(item.id);
        } catch (e) {
          console.error("Fallo al reintentar request en background", e);
        }
      }
      resolve();
    };
  });
}

// Instalación: Cachear assets estáticos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(staticAssets);
    })
  );
});

// Activación: Limpiar cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch: Stale-While-Revalidate avanzado y manejo offline para Supabase
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Manejar POST/PATCH offline (Background Sync Manual / Fallback)
  if (request.method !== 'GET') {
    if (url.origin.includes('supabase.co')) {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          console.log("Offline: Guardando request en IndexedDB para Background Sync");
          const headers = {};
          request.headers.forEach((value, key) => headers[key] = value);
          const body = await request.clone().text();
          await saveRequestForSync(request.url, request.method, headers, body);
          
          // Registrar para Background Sync nativo si está disponible
          if ('sync' in self.registration) {
            self.registration.sync.register('sync-supabase-data');
          }
          
          return new Response(JSON.stringify({ status: 'queued_offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
    return;
  }

  // Estrategia para API/Supabase GET (Stale-While-Revalidate)
  if (url.origin.includes('supabase.co') || url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            console.log("Offline: No se pudo actualizar datos de la API");
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Estrategia para Assets Estáticos (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(err => {
        console.log("Offline: Usando fallback caché estático", err);
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Evento Sync nativo (Background Sync API)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-supabase-data') {
    console.log("Background Sync activado. Sincronizando datos pendientes...");
    event.waitUntil(syncPendingRequests());
  }
});

// Manejo de eventos Push para notificaciones
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Lavadero de Lujo', body: '¡Tenemos novedades para ti!' };
  const options = {
    body: data.body,
    icon: 'logo.png',
    vibrate: [100, 50, 100],
    data: { url: './app_cliente.html' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Al clickear la notificación, abrir la app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
