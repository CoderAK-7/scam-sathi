// @ts-nocheck
/**
 * ScamSathi AI PWA Service Worker
 * Provides offline caching, lightning-fast reloads, and Web Share Target handling
 */

var CACHE_NAME = "scamsathi-pwa-v1";
var PRECACHE_ASSETS = [
    "./",
    "./index.html",
    "./app.css",
    "./app.js",
    "./manifest.webmanifest",
    "../core/scamsathi-engine.js",
    "./icons/icon48.png",
    "./icons/icon128.png"
];

// Install: Cache core application shell
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE_ASSETS).catch(function (err) {
                console.warn("[ScamSathi SW] Precache partial error:", err);
            });
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// Activate: Clean up previous caches
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.map(function (k) {
                    if (k !== CACHE_NAME) {
                        return caches.delete(k);
                    }
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Fetch: Stale-while-revalidate for local assets, network-first for others
self.addEventListener("fetch", function (event) {
    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    var url = new URL(event.request.url);

    // Handle Web Share Target requests (e.g. ./index.html?text=...&url=...)
    if (url.searchParams.has("text") || url.searchParams.has("url")) {
        event.respondWith(
            caches.match("./index.html").then(function (response) {
                return response || fetch(event.request);
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
                // Update cache in background
                fetch(event.request).then(function (networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(event.request, networkResponse);
                        });
                    }
                }).catch(function () {});
                return cachedResponse;
            }
            return fetch(event.request).catch(function () {
                // Offline fallback to app shell
                if (event.request.mode === "navigate") {
                    return caches.match("./index.html");
                }
            });
        })
    );
});

