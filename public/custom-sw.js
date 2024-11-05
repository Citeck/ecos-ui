const CACHE_NAME = 'app-cache-v1';

window.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  window.skipWaiting();
});

window.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  window.clients.claim();
});

window.addEventListener('message', (event) => {
  const { type } = event.data;

  switch (type) {
    case 'UPLOAD_PROGRESS':
      const { status, file, totalCount, successFileCount } = event.data;
      window.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_UPLOAD_STATUS', status, file, totalCount, successFileCount });
        });
      });
      break;

    case 'CONFIRMATION_FILE_RESPONSE':
      const { confirmed, isReplaceAllFiles } = event.data;
      window.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CONFIRMATION_FILE_RESPONSE', confirmed, isReplaceAllFiles });
        });
      });
      break;

    default:
      break;
  }
});
