'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsOffline(!navigator.onLine);
    const updateConnection = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    const syncQueue = () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
    };
    window.addEventListener('online', syncQueue);

    if (!window.isSecureContext && location.hostname !== 'localhost') {
      console.error('[CafeNav] Service workers require HTTPS on mobile browsers.');
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          console.log(`[CafeNav] Service worker registered${isMobile ? ' on mobile' : ''}.`);
          
          // Force worker update check on every load
          registration.update();

          // Force waiting worker to activate immediately
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Trigger automatic page reload when worker takes over with new assets
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[CafeNav] Service worker registration failed:', error);
        });

      // Clear existing CacheStorage if online to prevent stale UI views
      if (navigator.onLine && 'caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key.includes('cafenav-static')) {
              caches.delete(key);
            }
          });
        });
      }
    } else {
      console.error('[CafeNav] Service workers are not supported by this browser.');
    }

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('online', syncQueue);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed left-3 right-3 top-20 z-[60] rounded-xl border border-amber-500/30 bg-zinc-900/95 px-4 py-3 text-center text-sm text-amber-200 shadow-xl backdrop-blur-md sm:left-auto sm:right-6 sm:max-w-sm">
      You are offline. Cached CafeNav pages are still available.
    </div>
  );
}