// Minimal service worker: makes Shigo installable. Network only, no offline cache yet, so money states are never stale.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
