/* Tiny IndexedDB-backed outbox so a contact message sent while offline isn't
   lost: it's queued locally and replayed when the connection returns (on the
   next `online` event / page load, and via the service worker's Background Sync
   on browsers that support it). Client-only. */

const DB = "kma-outbox";
const STORE = "contact";
const ENDPOINT = "/api/contact-submissions";

export type OutboxItem = { id: number; body: Record<string, unknown> };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueContact(body: Record<string, unknown>): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id: Date.now() + Math.floor(Math.random() * 1000), body });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function all(): Promise<OutboxItem[]> {
  const db = await open();
  const items = await new Promise<OutboxItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxItem[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

async function remove(id: number): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

/** Try to send everything queued. Returns how many were delivered. */
export async function flushOutbox(): Promise<number> {
  let sent = 0;
  let items: OutboxItem[] = [];
  try {
    items = await all();
  } catch {
    return 0;
  }
  for (const item of items) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        await remove(item.id);
        sent += 1;
      }
    } catch {
      /* still offline — leave it queued */
      break;
    }
  }
  return sent;
}

/** Ask the service worker to replay the outbox when back online (where supported). */
export async function registerBackgroundSync(): Promise<void> {
  try {
    const reg = (await navigator.serviceWorker?.ready) as
      | (ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } })
      | undefined;
    await reg?.sync?.register("kma-contact-sync");
  } catch {
    /* Background Sync unsupported — the online/load flush covers it */
  }
}
