// Sue Reading Club Auto Recorder - Service Worker

const CACHE_NAME = 'sue-auto-recorder-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/slideshow/slideshow.html',
    '/css/main.css',
    '/css/mobile.css',
    '/css/recorder.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/slideshow-controller.js',
    '/js/auto-recorder.js',
    '/js/app.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
