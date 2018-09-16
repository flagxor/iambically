'use strict';


var CACHE_NAME = 'iambic-cache-5';

var urlsToCache = [
  '/',
  '/static/brush.js',
  '/static/corewords.js',
  '/static/datastore.js',
  '/static/drawing.js',
  '/static/entry.js',
  '/static/format.js',
  '/static/http.js',
  '/static/iambically.css',
  '/static/iambically.js',
  '/static/location.js',
  '/static/manifest.json',
  '/static/panels.js',
  '/static/promiseforth.js',
  '/static/sleep.js',
  '/static/surface.js',
  '/static/sweep.js',
  '/static/sync.js',
  '/static/favicon16.png',
  '/static/favicon32.png',
  '/static/favicon57.png',
  '/static/favicon128.png',
  '/static/favicon160.png',
  '/static/favicon192.png',
  '/static/favicon256.png',
  '/static/favicon512.png',
  '/static/favicon1024.png',
];

var urlsWithCredentials = [
  'login',
  'logout',
  'auth',
  'commit',
  'fetch',
];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    if (response) {
      console.log('Cached: ' + event.request.url);
      return response;
    }
    var parts = event.request.url.split('/');
    var lastPart = parts[parts.length - 1];
    if (urlsWithCredentials.indexOf(lastPart) >= 0) {
      console.log('Authenticated: ' + event.request.url);
      return fetch(event.request, { credentials: 'include' });
    } else {
      console.log('Unauthenticated: ' + event.request.url);
      return fetch(event.request);
    }
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.map(function(cacheName) {
      if (cacheName != CACHE_NAME) {
        return caches.delete(cacheName);
      }
    }));
  }));
});
