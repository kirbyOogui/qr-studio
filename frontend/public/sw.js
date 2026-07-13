// QR Studio Service Worker
// Stateless要件により、ユーザーが入力したURLやQR画像・ロゴはキャッシュ対象外とする。
// キャッシュするのは静的アセット(アプリシェル)のみで、オフライン起動を可能にする。
const CACHE_NAME = "qr-studio-shell-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];
// キャッシュ優先にすると、アプリシェル("/"とmanifest)を一度キャッシュした端末は
// 新しいデプロイ後もずっと古い内容を見続けてしまう(installイベントはsw.js自体の
// バイト差分がない限り再実行されないため)。この2つだけは常にネットワークを優先し、
// オフライン時のみキャッシュにフォールバックする。
const NETWORK_FIRST_PATHS = new Set(["/", "/manifest.webmanifest"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // 品質チェックAPI(バックエンド)への通信は常にネットワークから取得し、キャッシュしない。
  if (url.pathname.startsWith("/api/")) return;

  if (NETWORK_FIRST_PATHS.has(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && request.destination !== "") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached ?? caches.match("/"));
    }),
  );
});
