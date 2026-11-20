import type { AyahEntry, MushafPageAyah } from '@/lib/quran-data';

const DB_NAME = 'almilla-idb-v1';
const DB_VERSION = 2;
const STORE_SURAHS = 'surahs';
const STORE_PAGES = 'pages';

export interface CachedSurahPayload {
  surahId: number;
  ayahs: AyahEntry[];
  cachedAt: string;
  source: string;
}

export interface CachedPagePayload {
  pageNumber: number;
  ayahs: MushafPageAyah[];
  cachedAt: string;
  source: string;
}

function openMillaDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SURAHS)) {
          db.createObjectStore(STORE_SURAHS, { keyPath: 'surahId' });
        }
        if (!db.objectStoreNames.contains(STORE_PAGES)) {
          db.createObjectStore(STORE_PAGES, { keyPath: 'pageNumber' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getCachedSurah(surahId: number): Promise<CachedSurahPayload | null> {
  try {
    const db = await openMillaDb();
    if (!db) return null;
    return await new Promise<CachedSurahPayload | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_SURAHS, 'readonly');
        const store = tx.objectStore(STORE_SURAHS);
        const req = store.get(surahId);
        req.onsuccess = () => {
          const res = req.result as CachedSurahPayload | undefined;
          resolve(res ?? null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function saveCachedSurah(payload: CachedSurahPayload): Promise<boolean> {
  try {
    const db = await openMillaDb();
    if (!db) return false;
    return await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_SURAHS, 'readwrite');
        const store = tx.objectStore(STORE_SURAHS);
        const req = store.put(payload);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

export async function getCachedMushafPage(
  pageNumber: number,
): Promise<CachedPagePayload | null> {
  try {
    const db = await openMillaDb();
    if (!db) return null;
    return await new Promise<CachedPagePayload | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_PAGES, 'readonly');
        const store = tx.objectStore(STORE_PAGES);
        const req = store.get(pageNumber);
        req.onsuccess = () => {
          const res = req.result as CachedPagePayload | undefined;
          resolve(res ?? null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function saveCachedMushafPage(payload: CachedPagePayload): Promise<boolean> {
  try {
    const db = await openMillaDb();
    if (!db) return false;
    return await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE_PAGES, 'readwrite');
        const store = tx.objectStore(STORE_PAGES);
        const req = store.put(payload);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

export async function listCachedSurahIds(): Promise<number[]> {
  try {
    const db = await openMillaDb();
    if (!db) return [];
    return await new Promise<number[]>((resolve) => {
      try {
        const tx = db.transaction(STORE_SURAHS, 'readonly');
        const store = tx.objectStore(STORE_SURAHS);
        const req = store.getAllKeys();
        req.onsuccess = () => {
          const keys = Array.isArray(req.result)
            ? req.result.filter((k): k is number => typeof k === 'number')
            : [];
          resolve(keys);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}
