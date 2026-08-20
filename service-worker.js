// 龙族世界模拟器 Service Worker
const CACHE_NAME = 'dragon-world-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/state.js',
  './js/parser.js',
  './js/storage.js',
  './js/ai.js',
  './js/app.js',
  './manifest.json'
];

// 安装：缓存静态文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

//  fetch：缓存优先，网络回退
self.addEventListener('fetch', (event) => {
  // 不缓存API请求
  if (event.request.url.includes('api.deepseek.com') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // 缓存命中，返回缓存
        }
        return fetch(event.request).then((response) => {
          // 缓存新的静态文件
          if (event.request.url.includes('.css') || event.request.url.includes('.js') || 
              event.request.url.includes('.html') || event.request.url.includes('.json') ||
              event.request.url.includes('.png') || event.request.url.includes('.jpg')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // 离线时返回首页
        return caches.match('./index.html');
      })
  );
});
