// sw.js — Service worker mínimo para que AURA sea instalable como PWA.
// Estrategia simple: cachea los archivos estáticos principales para que
// carguen más rápido en visitas repetidas. No cachea las llamadas a /api/
// (esas siempre deben ir a la red, para no mostrar datos desactualizados).

const CACHE_NAME = 'aura-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/privacidad.html',
  '/terminos.html',
  '/manifest.json',
  '/assets/hero.jpg',
  '/assets/favicon.png',
  '/assets/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Nunca cachear llamadas a la API — siempre datos frescos
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
