// Minimal service worker so Shigo can be installed. No fetch handler: requests go straight to the network, so money states are never stale.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
