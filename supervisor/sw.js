/* supervisor/sw.js
   Service Worker para PWA (Supervisor)
*/
const CACHE_NAME = "mexibus-supervisor-v1";

const CORE_ASSETS = [
  "./",
  "./dashboard.html",
  "./login.html",
  "./css/style.css",
  "./js/config.js",
  "./js/utils.js",
  "./js/app.js",
  "./js/vistas.js",
  "./js/unidades.js",
  "./js/simulacion.js",
  "./js/sim_dock.js",
  "./js/incidencias.js",
  "./js/login.js",
  "./js/operadores.js",
  "./js/conductores.js",
  "./manifest.webmanifest",
  "./pwa/offline.html",
  "./pwa/icons/icon-192.png",
  "./pwa/icons/icon-512.png",
  "./pwa/icons/icon-192-maskable.png",
  "./pwa/icons/icon-512-maskable.png"
];

// Instalación: precache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

// Fetch: cache-first para mismos recursos (estáticos), network-first para HTML
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejamos same-origin
  if (url.origin !== self.location.origin) return;

  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html");

  if (isHTML) {
    // Network-first para HTML (para ver cambios al refrescar)
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("./pwa/offline.html");
      }
    })());
    return;
  }

  // Cache-first para estáticos
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const resp = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, resp.clone());
      return resp;
    } catch (e) {
      return caches.match("./pwa/offline.html");
    }
  })());
});
