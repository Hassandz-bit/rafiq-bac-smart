const CACHE_NAME = "rafiq-bac-shell-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = ["/", OFFLINE_URL, "/manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match("/")).then(response => response || caches.match(OFFLINE_URL))),
    );
    return;
  }

  const isPublicStaticAsset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/manus-storage/") || url.pathname === "/manifest.webmanifest";
  if (!isPublicStaticAsset) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })),
  );
});

self.addEventListener("push", event => {
  const data = event.data?.json?.() ?? {};
  const title = typeof data.title === "string" ? data.title : "رفيق الباك";
  const options = {
    body: typeof data.body === "string" ? data.body : "لديك تحديث جديد في المنصة.",
    icon: "/manus-storage/rafiq-bac-pwa-icon_5178ecbb.png",
    badge: "/manus-storage/rafiq-bac-pwa-icon_5178ecbb.png",
    tag: typeof data.tag === "string" ? data.tag : "rafiq-bac-update",
    data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
    const current = openClients.find(client => new URL(client.url).pathname === targetUrl);
    return current ? current.focus() : clients.openWindow(targetUrl);
  }));
});
