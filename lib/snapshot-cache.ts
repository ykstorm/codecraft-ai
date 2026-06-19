/**
 * IndexedDB-backed WebContainer snapshot cache.
 *
 * After the first successful `npm install`, the playground exports the
 * WebContainer filesystem (`wc.export('/', { format: 'binary' })` → Uint8Array,
 * which includes node_modules) and stores it here keyed by template slug. On a
 * return visit we mount that snapshot instead of re-running install, which drops
 * the second-visit boot from ~30-40s to <20s.
 *
 * A tiny hand-rolled IndexedDB wrapper avoids pulling in an extra dependency.
 */

const DB_NAME = "codecraft-wc";
const STORE = "snapshots";
const DB_VERSION = 1;

/** Bump when the snapshot binary format / template shape changes so stale
 *  snapshots from older deploys are ignored instead of mounted. */
const SNAPSHOT_VERSION = "v1";

function keyFor(slug: string): string {
  return `${SNAPSHOT_VERSION}:${slug}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

/** Load a cached snapshot for a template slug, or null if none / on any error. */
export async function loadSnapshot(slug: string): Promise<Uint8Array | null> {
  try {
    const db = await openDb();
    return await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(keyFor(slug));
      req.onsuccess = () => {
        const val = req.result;
        db.close();
        if (val instanceof Uint8Array) resolve(val);
        else if (val instanceof ArrayBuffer) resolve(new Uint8Array(val));
        else resolve(null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/** Persist a snapshot for a template slug. Best-effort — failures are swallowed. */
export async function saveSnapshot(slug: string, data: Uint8Array): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      // Store a plain ArrayBuffer copy — structured clone of the exact backing
      // buffer is the most portable thing to round-trip through IndexedDB.
      const copy = data.slice();
      tx.objectStore(STORE).put(copy, keyFor(slug));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    /* best-effort cache write; ignore quota / private-mode errors */
  }
}

/** Drop a cached snapshot (used by the playground "reset" action). */
export async function clearSnapshot(slug: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(keyFor(slug));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    /* ignore */
  }
}
