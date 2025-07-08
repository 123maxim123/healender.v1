const CACHE_NAME = 'healender-v2.1';
const urlsToCache = [
    'https://brkgndl.github.io/healender/',
    'https://brkgndl.github.io/healender/index.html',
    'https://brkgndl.github.io/healender/style.css',
    'https://brkgndl.github.io/healender/script.js',
    'https://brkgndl.github.io/healender/manifest.json'
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