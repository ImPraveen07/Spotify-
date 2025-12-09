// --- PWA CACHE SETTINGS ---
const CACHE_NAME = "totify-cache-v2";
const DYNAMIC_CACHE = "totify-dynamic-v1";

// Static files that must always be cached
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/s192.png",
  "/s512.png",
  "/style.css",
  "/main.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
];

// --- INSTALL SW ---
self.addEventListener("install", event => {
  console.log("[SW] Installing & caching static assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// --- ACTIVATE SW ---
self.addEventListener("activate", event => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// --- FETCH HANDLER ---
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // --- STATIC: Cache First ---
  if (url.origin === location.origin && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then(res => res || fetch(req)));
    return;
  }

  // --- DYNAMIC: Network First ---
  event.respondWith(
    fetch(req)
      .then(networkRes => {
        return caches.open(DYNAMIC_CACHE).then(cache => {
          if (req.method === "GET") {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        });
      })
      .catch(() => {
        // Offline fallback for HTML pages
        if (req.headers.get("accept")?.includes("text/html")) {
          return caches.match("/index.html");
        }
        // fallback for other assets can be added here
      })
  );
});
