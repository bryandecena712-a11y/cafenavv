'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const updateConnection = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    const syncQueue = () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'SYNC_OFFLINE_QUEUE' });
    };
    window.addEventListener('online', syncQueue);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => {
        registration.update();
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }).catch((error) => {
        console.error('Service worker registration failed:', error);
      });
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