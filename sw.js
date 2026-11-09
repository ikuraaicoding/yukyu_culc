// 有給効率指数: Service Worker
// ページと画像をスマホの中に保存して、電波がなくても開けるようにする。外部への通信はしない。
// 更新したときは、下の VERSION を変えると、古い保存が消えて新しくなる。
const VERSION = "v1";
const CACHE = "yukyu-index-" + VERSION;
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "logo.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("yukyu-index-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 通信できるときは最新を取りにいき(更新がすぐ反映される)、通信できないときは保存してあるものを使う
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;   // 他のサイトへのリクエストには触らない
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
