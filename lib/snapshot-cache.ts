/**
 * IndexedDB-backed WebContainer snapshot store.
 *
 * After the first successful `npm install`, the playground exports the project
 * folder (see lib/project-snapshot.ts) and stores it here, keyed by template.
 * On a return visit it mounts that export instead of running install again.
 *
 * Each value is a record that says what was exported. Older builds stored a
 * bare export of the container's whole filesystem; those values have no
 * `root` field, so loadSnapshot drops them instead of mounting them.
 *
 * A tiny hand-rolled IndexedDB wrapper avoids pulling in an extra dependency.
 */

const DB_NAME = "codecraft-wc";
const STORE = "snapshots";
const DB_VERSION = 1;

/** Part of every key. The record shape below, not this prefix, tells a
 *  current snapshot from an older one, so an old value under the same key is
 *  found and cleared instead of sitting in the store for good. */
const SNAPSHOT_VERSION = "v1";

/** Marks an export of the project folder. */
const SNAPSHOT_ROOT = "workdir";

type SnapshotRecord = { root: typeof SNAPSHOT_ROOT; bytes: Uint8Array };

type LoadedSnapshot = {
  /** the export to mount, or null for a cold boot */
  bytes: Uint8Array | null;
  /** true when a stored value had the wrong shape and was deleted */
  cleared: boolean;
};

function keyFor(slug: string): string {
  return `${SNAPSHOT_VERSION}:${slug}`;
}

export function toSnapshotRecord(bytes: Uint8Array): SnapshotRecord {
  return { root: SNAPSHOT_ROOT, bytes };
}

/** The export inside a stored value, or null when the value is not a record
 *  of the current shape. */
export function snapshotBytesFromRecord(value: unknown): Uint8Array | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as { root?: unknown; bytes?: unknown };
  if (record.root !== SNAPSHOT_ROOT) return null;
  if (record.bytes instanceof Uint8Array) return record.bytes;
  if (record.bytes instanceof ArrayBuffer) return new Uint8Array(record.bytes);
  return null;
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

async function readValue(slug: string): Promise<unknown> {
  const db = await openDb();
  return new Promise<unknown>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(keyFor(slug));
    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

/**
 * Load the stored snapshot for a template. A value of the wrong shape is
 * deleted and reported as `cleared`; no value, or any IndexedDB error, gives a
 * cold boot.
 */
export async function loadSnapshot(slug: string): Promise<LoadedSnapshot> {
  let value: unknown;
  try {
    value = await readValue(slug);
  } catch {
    return { bytes: null, cleared: false };
  }
  if (value === undefined) return { bytes: null, cleared: false };
  const bytes = snapshotBytesFromRecord(value);
  if (bytes) return { bytes, cleared: false };
  await clearSnapshot(slug);
  return { bytes: null, cleared: true };
}

/**
 * Store a snapshot for a template. Returns true when the write committed and
 * false when it failed (quota, private mode, no IndexedDB); it never throws.
 */
export async function saveSnapshot(slug: string, data: Uint8Array): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      // Store a copy: mount() transfers the buffer it is given, and a copy
      // keeps the stored bytes independent of the caller's array.
      tx.objectStore(STORE).put(toSnapshotRecord(data.slice()), keyFor(slug));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error ?? new Error("IndexedDB write aborted"));
      };
    });
    return true;
  } catch {
    return false;
  }
}

/** Drop the stored snapshot for a template (reset, or a value of the wrong
 *  shape). Resolves even when IndexedDB fails. */
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
