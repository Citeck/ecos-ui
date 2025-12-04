/* eslint-disable no-restricted-globals */

/**
 * Important! For any change to custom-sw.js (this file) needs to change the CACHE_NAME version
 **/
const CACHE_NAME = 'app-cache-v2.2';

self.addEventListener('install', () => {
  console.info('[Service Worker] Install Event');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.info('[Service Worker] Activate Event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.info('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(event.data || {});
    });
  });
});
