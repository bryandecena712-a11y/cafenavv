const VERSION = 'v3';
const SHELL_CACHE = `cafenav-shell-${VERSION}`;
const DATA_CACHE = `cafenav-data-${VERSION}`;
const DB_NAME = 'cafenav-offline';
const DB_VERSION = 2;
const QUEUE_STORE = 'requests';
const API_STORE = 'responses';
const APP_SHELL = ['/offline.html', '/images/home-bg.jpg', '/images/250cafe-real.jpg'];

function openQueue() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(QUEUE_STORE)) {
                database.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains(API_STORE)) {
                database.createObjectStore(API_STORE, { keyPath: 'url' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function cacheApiResponse(request, response) {
    if (!response.ok) return;
    const database = await openQueue();
    const record = {
        url: request.url,
        status: response.status,
        headers: [...response.headers.entries()],
        body: await response.clone().text(),
    };
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(API_STORE, 'readwrite');
        transaction.objectStore(API_STORE).put(record);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

async function getCachedApiResponse(url) {
    const database = await openQueue();
    const record = await new Promise((resolve, reject) => {
        const transaction = database.transaction(API_STORE, 'readonly');
        const request = transaction.objectStore(API_STORE).get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    database.close();
    return record ? new Response(record.body, { status: record.status, headers: record.headers }) : null;
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
    event.waitUntil(caches.open(SHELL_CACHE).then(async(cache) => {
        await Promise.all(APP_SHELL.map(async(asset) => {
            try {
                const response = await fetch(asset);
                if (response.ok) await cache.put(asset, response);
            } catch {}
        }));
    }));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => ![SHELL_CACHE, DATA_CACHE].includes(key)).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'cafenav-sync') event.waitUntil(replayQueue());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_OFFLINE_QUEUE') event.waitUntil(replayQueue());
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

    const isApiRequest = requestUrl.pathname.startsWith('/api/');
    const isNavigation = event.request.mode === 'navigate' || requestUrl.pathname === '/';
    const isStaticAsset = /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(requestUrl.pathname);

    if (isStaticAsset) {
        event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
            if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, response.clone()));
            return response;
        })));
        return;
    }

    event.respondWith(
        fetch(event.request).then(async(response) => {
            if (response.ok) {
                const copy = response.clone();
                if (isApiRequest) {
                    await cacheApiResponse(event.request, copy);
                    await caches.open(DATA_CACHE).then((cache) => cache.put(event.request, response.clone()));
                } else if (isNavigation) {
                    await caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, response.clone()));
                }
            }
            return response;
        }).catch(async() => {
            if (isApiRequest) return (await getCachedApiResponse(event.request.url)) || caches.match(event.request);
            return (await caches.match(event.request)) || (await caches.match('/')) || caches.match('/offline.html');
        })
    );
});