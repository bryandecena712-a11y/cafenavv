const CACHE_NAME = 'cafenav-shell-v2';
const DB_NAME = 'cafenav-offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'requests';
const APP_SHELL = ['/', '/offline.html', '/images/home-bg.jpg'];

function openQueue() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => request.result.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function enqueue(request) {
    const database = await openQueue();
    const body = await request.clone().text();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE, 'readwrite');
        transaction.objectStore(QUEUE_STORE).add({
            url: request.url,
            method: request.method,
            headers: [...request.headers.entries()],
            body,
            createdAt: Date.now(),
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

async function replayQueue() {
    const database = await openQueue();
    const queuedRequests = await new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE, 'readonly');
        const request = transaction.objectStore(QUEUE_STORE).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    for (const queued of queuedRequests) {
        try {
            const response = await fetch(queued.url, {
                method: queued.method,
                headers: Object.fromEntries(queued.headers),
                body: queued.body,
            });
            if (!response.ok) continue;
            await new Promise((resolve, reject) => {
                const transaction = database.transaction(QUEUE_STORE, 'readwrite');
                transaction.objectStore(QUEUE_STORE).delete(queued.id);
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error);
            });
        } catch {
            break;
        }
    }
    database.close();
}

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'cafenav-sync') event.waitUntil(replayQueue());
});

self.addEventListener('message', (event) => {
    if (event.data ? .type === 'SYNC_OFFLINE_QUEUE') event.waitUntil(replayQueue());
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method !== 'GET') {
        if (requestUrl.origin === self.location.origin && /^\/api\/(bookmarks|reviews)/.test(requestUrl.pathname)) {
            event.respondWith(
                fetch(event.request).catch(async() => {
                    await enqueue(event.request);
                    try { await self.registration.sync.register('cafenav-sync'); } catch {}
                    return new Response(JSON.stringify({ queued: true }), {
                        status: 202,
                        headers: { 'Content-Type': 'application/json' },
                    });
                })
            );
        }
        return;
    }

    if (requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
        .then((response) => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/offline.html')))
    );
});