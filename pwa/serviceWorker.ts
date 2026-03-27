const CACHE_NAME = "neuralshell-pwa-v1";
const ASSETS = [
  "/pwa/index.html",
  "/pwa/manifest.webmanifest"
];

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

