/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'app-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  const { type } = event.data;

  switch (type) {
    case 'UPLOAD_PROGRESS':
      const { status, isImporting, errorStatus, file, totalCount, successFileCount, requestId, isCancelled } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_UPLOAD_STATUS',
            status,
            errorStatus,
            isImporting,
            isCancelled,
            file,
            totalCount,
            successFileCount,
            requestId
          });
        });
      });
      break;

    default:
      break;
  }
});
