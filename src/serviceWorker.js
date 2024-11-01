import { precacheAndRoute } from 'workbox-precaching';

/* eslint-disable no-restricted-globals */

// Caching of all resources
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event');
  event.waitUntil(self.clients.claim());
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

