const DATABASE_NAME = 'cafenav-app';
const DATABASE_VERSION = 1;
const STORE_NAME = 'state';
const CAFE_KEY = 'cafes';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB could not open'));
  });
}

export async function saveCachedCafes(cafes: unknown[]) {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(cafes, CAFE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  } catch {
    try {
      localStorage.setItem('cafenav_cached_cafes', JSON.stringify(cafes));
    } catch {}
  }
}

export async function loadCachedCafes<T>(): Promise<T[] | null> {
  try {
    const database = await openDatabase();
    const cafes = await new Promise<T[] | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(CAFE_KEY);
      request.onsuccess = () => resolve(request.result as T[] | undefined);
      request.onerror = () => reject(request.error);
    });
    database.close();
    if (Array.isArray(cafes)) return cafes;
  } catch {}

  try {
    const stored = localStorage.getItem('cafenav_cached_cafes');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveDirectoryPreferences(preferences: { searchQuery: string; priceFilter: string; vibeFilter: string }) {
  try {
    localStorage.setItem('cafenav_directory_preferences', JSON.stringify(preferences));
  } catch {}
}

export function loadDirectoryPreferences() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('cafenav_directory_preferences');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
