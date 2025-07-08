const CACHE_NAME = 'sigara-takvimi-v1';
const urlsToCache = [
    'https://123maxim123.github.io/healender.v1/',
    'https://123maxim123.github.io/healender.v1/index.html',
    'https://123maxim123.github.io/healender.v1/style.css',
    'https://123maxim123.github.io/healender.v1/script.js',
    'https://123maxim123.github.io/healender.v1/manifest.json'
];
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});
