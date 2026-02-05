/// <reference lib="webworker" />

const CACHE_NAME = "thulla-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    "/",
    "/offline",
    "/manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

// Audio files to cache on first use
const AUDIO_CACHE = "thulla-audio-v1";

// Install event - precache critical assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            // Cache all precache assets
            await cache.addAll(PRECACHE_ASSETS);
            // Force waiting service worker to become active
            await self.skipWaiting();
        })()
    );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            // Delete old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE)
                    .map((name) => caches.delete(name))
            );
            // Take control of all clients
            await self.clients.claim();
        })()
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API and Supabase requests
    if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) {
        return;
    }

    // Handle audio files - cache on first use
    if (url.pathname.startsWith("/audio/")) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(AUDIO_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;

                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                } catch {
                    // Return empty audio if offline
                    return new Response(null, { status: 404 });
                }
            })()
        );
        return;
    }

    // Handle navigation requests
    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    // Try network first for navigation
                    const response = await fetch(request);
                    return response;
                } catch {
                    // If offline, show offline page
                    const cache = await caches.open(CACHE_NAME);
                    const cached = await cache.match(OFFLINE_URL);
                    return cached || new Response("Offline", { status: 503 });
                }
            })()
        );
        return;
    }

    // Handle static assets - cache first, network fallback
    if (
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/_next/static/")
    ) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match(request);
                if (cached) return cached;

                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                } catch {
                    return new Response(null, { status: 404 });
                }
            })()
        );
        return;
    }

    // Default: network first with cache fallback
    event.respondWith(
        (async () => {
            try {
                const response = await fetch(request);
                return response;
            } catch {
                const cache = await caches.open(CACHE_NAME);
                const cached = await cache.match(request);
                return cached || new Response(null, { status: 404 });
            }
        })()
    );
});

// Handle push notifications (future use)
self.addEventListener("push", (event) => {
    if (!event.data) return;

    const data = event.data.json();

    event.waitUntil(
        self.registration.showNotification(data.title || "Thulla", {
            body: data.body || "You have a notification",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-96x96.png",
            tag: data.tag || "thulla-notification",
            data: data.url || "/",
        })
    );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data || "/")
    );
});
