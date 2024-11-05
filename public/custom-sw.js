/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'app-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app resources');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
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
      const { status, file, totalCount, successFileCount } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_UPLOAD_STATUS', status, file, totalCount, successFileCount });
        });
      });
      break;

    case 'CONFIRMATION_FILE_RESPONSE':
      const { confirmed, isReplaceAllFiles } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CONFIRMATION_FILE_RESPONSE', confirmed, isReplaceAllFiles });
        });
      });
      break;

    default:
      break;
  }
});
