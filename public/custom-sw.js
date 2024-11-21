/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'app-cache-v2';

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
      const { status, errorStatus, file, totalCount, successFileCount, requestId, isCancelled } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_UPLOAD_STATUS',
            status,
            errorStatus,
            isCancelled,
            file,
            totalCount,
            successFileCount,
            requestId
          });
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

    case 'CONFIRMATION_RENAME_DIR_REQUEST':
      const { currentItemTitle, targetDirTitle, parentDirTitles, typeCurrentItem } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CONFIRMATION_RENAME_DIR_REQUEST', currentItemTitle, parentDirTitles, typeCurrentItem, targetDirTitle });
        });
      });
      break;

    case 'CONFIRMATION_RENAME_DIR_RESPONSE':
      const { confirmedRenameItem, titleRenamingItem } = event.data;
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CONFIRMATION_RENAME_DIR_RESPONSE', confirmedRenameItem, titleRenamingItem });
        });
      });
      break;

    default:
      break;
  }
});
