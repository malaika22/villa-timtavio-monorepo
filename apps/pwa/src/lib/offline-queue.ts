import type { CreateExperienceRequestDto } from '@repo/api-types';

// A tiny IndexedDB-backed queue for experience requests submitted while offline.
// Entries are drained by useOfflineRequestSync when connectivity returns.

const DB_NAME = 'villa-offline';
const STORE = 'queued-requests';
const DB_VERSION = 1;

export interface QueuedRequest {
  id: string;
  bookingId: string;
  dto: CreateExperienceRequestDto;
  queuedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function runTx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = fn(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function enqueueRequest(item: QueuedRequest): Promise<void> {
  await runTx('readwrite', (store) => store.put(item));
}

export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const items = await runTx<QueuedRequest[]>('readonly', (store) =>
    store.getAll(),
  );
  return items.sort((a, b) => a.queuedAt - b.queuedAt);
}

export async function removeQueuedRequest(id: string): Promise<void> {
  await runTx('readwrite', (store) => store.delete(id));
}

export async function queuedRequestCount(): Promise<number> {
  return runTx<number>('readonly', (store) => store.count());
}
