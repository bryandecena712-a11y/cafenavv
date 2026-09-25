const VERSION = '2026-09-25-v3';
const SHELL_CACHE = `cafenav-shell-${VERSION}`;
const RUNTIME_CACHE = `cafenav-runtime-${VERSION}`;
const DB_NAME = 'cafenav-offline';
const DB_VERSION = 1;
const RESPONSE_STORE = 'responses';
const QUEUE_STORE = 'queue';
const PRECACHE = [
    '/',
    '/offers',
    '/login',
    '/signup',
    '/suggest',
    '/offline.html',
    '/manifest.json',
    '/images/home-bg.jpg',
    '/images/250cafe-real.jpg'
];

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(RESPONSE_STORE)) {
                database.createObjectStore(RESPONSE_STORE, { keyPath: 'url' });
            }
            if (!database.objectStoreNames.contains(QUEUE_STORE)) {
                database.createObjectStore(QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveResponse(request, response) {
    if (!response || !response.ok) return;
    try {
        const database = await openDatabase();
        const record = {
            url: request.url,
            status: response.status,
            headers: [...response.headers.entries()],
            body: await response.clone().text(),
            savedAt: Date.now()
        };
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(RESPONSE_STORE, 'readwrite');
            transaction.objectStore(RESPONSE_STORE).put(record);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });
        database.close();
    } catch (error) {
        console.warn('[CafeNav] IndexedDB response cache unavailable:', error);
    }
}

async function readResponse(url) {
    try {
        const database = await openDatabase();
        const record = await new Promise((resolve, reject) => {
            const request = database.transaction(RESPONSE_STORE, 'readonly').objectStore(RESPONSE_STORE).get(url);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        database.close();
        return record ? new Response(record.body, { status: record.status, headers: record.headers }) : null;
    } catch (error) {
        console.warn('[CafeNav] IndexedDB response read unavailable:', error);
        return null;
    }
}

function fetchWithTimeout(request, timeout = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function cacheResponse(request, response) {
    if (!response || !response.ok) return;
    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
    saveResponse(request, response.clone()).catch(() => {});
}

async function queueRequest(request) {
    const database = await openDatabase();
    const body = await request.clone().text();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(QUEUE_STORE, 'readwrite');
        transaction.objectStore(QUEUE_STORE).add({
            url: request.url,
            method: request.method,
            headers: [...request.headers.entries()],
            body,
            createdAt: Date.now()
        });
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

async function syncQueue() {
    const database = await openDatabase();
    const requests = await new Promise((resolve, reject) => {
        const request = database.transaction(QUEUE_STORE, 'readonly').objectStore(QUEUE_STORE).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    for (const queued of requests) {
        try {
            const response = await fetch(queued.url, {
                method: queued.method,
                headers: Object.fromEntries(queued.headers),
                body: queued.body
            });
            if (!response.ok) break;
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

async function cacheShell() {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(
        PRECACHE.map(async(url) => {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (response.ok) await cache.put(url, response);
            } catch {}
        })
    );
}

self.addEventListener('install', (event) => {
    event.waitUntil(cacheShell());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data && event.data.type === 'SYNC_OFFLINE_QUEUE') event.waitUntil(syncQueue());
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'cafenav-sync') event.waitUntil(syncQueue());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    const isWrite = request.method !== 'GET';
    const isMutation = isWrite && (url.origin === self.location.origin || url.hostname.includes('supabase'));

    if (isMutation) {
        event.respondWith(
            fetch(request).catch(async() => {
                try {
                    await queueRequest(request);
                } catch (error) {
                    console.warn('[CafeNav] Offline queue unavailable:', error);
                }
                try {
                    await self.registration.sync.register('cafenav-sync');
                } catch {}
                return new Response(JSON.stringify({ queued: true }), {
                    status: 202,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    if (request.method !== 'GET') return;
    const isNavigation = request.mode === 'navigate';
    const isApi = url.pathname.startsWith('/api/') || url.hostname.includes('supabase');

    // NETWORK-FIRST FOR NAVIGATIONS (Always fetches live updates from Vercel)
    if (isNavigation) {
        event.respondWith(
            (async() => {
                try {
                    const response = await fetchWithTimeout(request, 4000);
                    cacheResponse(request, response);
                    return response;
                } catch {
                    const cached = (await caches.match(request)) || (await caches.match('/')) || (await readResponse(request.url));
                    if (cached) return cached;
                    return (await caches.match('/offline.html')) || new Response('<h1>CafeNav is offline</h1>', { headers: { 'Content-Type': 'text/html' } });
                }
            })()
        );
        return;
    }

    // NETWORK-FIRST FOR API, STALE-WHILE-REVALIDATE FOR OTHERS
    event.respondWith(
        (async() => {
            try {
                const response = await fetchWithTimeout(request, isApi ? 5000 : 8000);
                cacheResponse(request, response);
                return response;
            } catch {
                const cached = (await caches.match(request)) || (await readResponse(request.url));
                if (cached) return cached;
                if (isApi) return new Response(JSON.stringify({ offline: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                return (await caches.match('/offline.html')) || new Response('', { status: 503 });
            }
        })()
    );
});