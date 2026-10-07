/**
 * What the playground keeps between visits, and how it is put back.
 *
 * The snapshot is an export of the project folder, the container's working
 * directory: package.json, index.html, vite.config.js, src/ and node_modules/.
 * It is the project folder and not only node_modules because the restore path
 * mounts the snapshot and starts the dev server straight away, without
 * mounting the template first, so the export has to hold the whole project.
 *
 * mount() writes into the working directory when it gets no mountPoint, which
 * is the folder the export was taken from, so the tree lands back in the same
 * place. An earlier build exported "/" (bin, etc, home, tmp, usr) and mounted
 * that into the working directory, which buried package.json two levels down.
 */

/** Largest snapshot worth keeping in IndexedDB. */
export const MAX_SNAPSHOT_BYTES = 200 * 1024 * 1024;
/** After the write, this origin should use at most this share of its quota. */
const MAX_QUOTA_SHARE = 0.5;

/**
 * Left out of the export. Vite writes its dependency cache to
 * node_modules/.vite once the dev server has run, rebuilds it on the next
 * start, and it would only make the snapshot bigger.
 */
const SNAPSHOT_EXCLUDES = ["**/node_modules/.vite/**"];

/** The parts of a WebContainer the snapshot code touches. */
export type SnapshotContainer = {
  readonly workdir: string;
  export(
    path: string,
    options: { format: "binary"; excludes: string[] }
  ): Promise<Uint8Array>;
  mount(snapshot: Uint8Array): Promise<void>;
  fs: { readdir(path: string): Promise<string[]> };
};

/** Export the project folder, without Vite's cache. */
export function exportProjectSnapshot(wc: SnapshotContainer): Promise<Uint8Array> {
  return wc.export(wc.workdir, { format: "binary", excludes: SNAPSHOT_EXCLUDES });
}

/**
 * Mount a stored export back into the working directory and check that the
 * result is a project: package.json and node_modules at the top. Returns
 * false when the mount fails or the shape is wrong, so the caller can drop the
 * snapshot and install from the template instead.
 */
export async function restoreProjectSnapshot(
  wc: SnapshotContainer,
  bytes: Uint8Array
): Promise<boolean> {
  try {
    await wc.mount(bytes);
    const names = await wc.fs.readdir(".");
    return names.includes("package.json") && names.includes("node_modules");
  } catch {
    return false;
  }
}

type BudgetVerdict = { fits: true } | { fits: false; reason: string };

type StorageNumbers = { quota?: number; usage?: number } | null;

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

/**
 * Decide, before anything is written, whether a snapshot of `bytes` may be
 * stored: at most MAX_SNAPSHOT_BYTES, and the origin's usage after the write
 * at most MAX_QUOTA_SHARE of its quota. Without a quota figure only the size
 * cap applies.
 */
export function checkSnapshotBudget(
  bytes: number,
  storage: StorageNumbers
): BudgetVerdict {
  if (bytes > MAX_SNAPSHOT_BYTES) {
    return {
      fits: false,
      reason: `snapshot is ${formatMegabytes(bytes)}, over the ${formatMegabytes(MAX_SNAPSHOT_BYTES)} cap`,
    };
  }
  const quota = storage?.quota ?? 0;
  const usage = storage?.usage ?? 0;
  if (quota > 0 && (usage + bytes) / quota > MAX_QUOTA_SHARE) {
    return {
      fits: false,
      reason: `saving ${formatMegabytes(bytes)} would take this site past ${
        MAX_QUOTA_SHARE * 100
      }% of its storage quota`,
    };
  }
  return { fits: true };
}

/** The browser's storage figures, or null when it does not give them. */
export async function readStorageEstimate(): Promise<StorageNumbers> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}
