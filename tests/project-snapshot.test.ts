import { describe, it, expect } from 'vitest'
import {
  MAX_SNAPSHOT_BYTES,
  checkSnapshotBudget,
  exportProjectSnapshot,
  restoreProjectSnapshot,
  type SnapshotContainer,
} from '../lib/project-snapshot'
import { snapshotBytesFromRecord, toSnapshotRecord } from '../lib/snapshot-cache'

const WORKDIR = '/home/project'
const MB = 1024 * 1024

// A glob as the export's excludes use it: ** spans folders, * stays in one.
function globToRegExp(glob: string): RegExp {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    if (glob.startsWith('**/', i)) {
      re += '(?:.*/)?'
      i += 2
    } else if (glob.startsWith('/**', i)) {
      re += '(?:/.*)?'
      i += 2
    } else if (glob[i] === '*') {
      re += '[^/]*'
    } else {
      re += glob[i].replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${re}$`)
}

/**
 * An in-memory stand-in for a WebContainer: files keyed by absolute path.
 * export(path) serialises everything under `path` relative to it, and
 * mount(bytes) writes those entries into the working directory, which is how
 * the real mount() behaves without a mountPoint.
 */
function fakeContainer(files: Record<string, string> = {}) {
  const fs = new Map(Object.entries(files))
  const container: SnapshotContainer = {
    workdir: WORKDIR,
    async export(path, options) {
      const prefix = path.endsWith('/') ? path : `${path}/`
      const excluded = options.excludes.map(globToRegExp)
      const entries = [...fs]
        .filter(([p]) => p.startsWith(prefix))
        .map(([p, c]) => [p.slice(prefix.length), c] as const)
        .filter(([rel]) => !excluded.some((re) => re.test(rel)))
      return new TextEncoder().encode(JSON.stringify(entries))
    },
    async mount(bytes) {
      const entries = JSON.parse(new TextDecoder().decode(bytes)) as [string, string][]
      for (const [rel, c] of entries) fs.set(`${WORKDIR}/${rel}`, c)
    },
    fs: {
      async readdir(path) {
        const base = path === '.' ? `${WORKDIR}/` : `${WORKDIR}/${path}/`
        const names = new Set<string>()
        for (const p of fs.keys()) {
          if (p.startsWith(base)) names.add(p.slice(base.length).split('/')[0])
        }
        return [...names]
      },
    },
  }
  return { container, fs }
}

// What the container held after a cold install: system folders at the root,
// the project in the working directory, and Vite's cache once dev had run.
const AFTER_INSTALL = {
  '/bin/jsh': 'shell',
  '/usr/lib/node/x.js': 'runtime',
  [`${WORKDIR}/package.json`]: '{"name":"vite-react-starter"}',
  [`${WORKDIR}/index.html`]: '<div id="root"></div>',
  [`${WORKDIR}/src/App.jsx`]: 'export default function App() {}',
  [`${WORKDIR}/node_modules/vite/package.json`]: '{"name":"vite"}',
  [`${WORKDIR}/node_modules/.vite/deps/react.js`]: 'prebundled',
}

describe('project snapshot paths', () => {
  it('exports the project folder and mounts it back in the same place', async () => {
    const first = fakeContainer(AFTER_INSTALL)
    const bytes = await exportProjectSnapshot(first.container)

    const second = fakeContainer()
    expect(await restoreProjectSnapshot(second.container, bytes)).toBe(true)
    expect(second.fs.get(`${WORKDIR}/package.json`)).toBe('{"name":"vite-react-starter"}')
    expect(second.fs.get(`${WORKDIR}/src/App.jsx`)).toBeDefined()
    expect(second.fs.get(`${WORKDIR}/node_modules/vite/package.json`)).toBeDefined()
  })

  it('leaves the system folders and Vite cache out of the export', async () => {
    const first = fakeContainer(AFTER_INSTALL)
    const bytes = await exportProjectSnapshot(first.container)
    const second = fakeContainer()
    await restoreProjectSnapshot(second.container, bytes)

    const restored = [...second.fs.keys()]
    expect(restored.some((p) => p.includes('/node_modules/.vite/'))).toBe(false)
    expect(restored.some((p) => p.includes('/bin/') || p.includes('/usr/'))).toBe(false)
  })

  it('rejects the old layout: an export of / mounted into the project folder', async () => {
    const first = fakeContainer(AFTER_INSTALL)
    const whole = await first.container.export('/', { format: 'binary', excludes: [] })

    const second = fakeContainer()
    expect(await restoreProjectSnapshot(second.container, whole)).toBe(false)
    // This is the broken tree the earlier build booted: the project one level down.
    expect(second.fs.has(`${WORKDIR}/home/project/package.json`)).toBe(true)
    expect(second.fs.has(`${WORKDIR}/package.json`)).toBe(false)
  })

  it('reports a failed mount as an unusable snapshot', async () => {
    const { container } = fakeContainer()
    container.mount = async () => {
      throw new Error('bad snapshot')
    }
    expect(await restoreProjectSnapshot(container, new Uint8Array([1, 2, 3]))).toBe(false)
  })
})

describe('checkSnapshotBudget', () => {
  it('accepts a snapshot under the cap when the quota is unknown', () => {
    expect(checkSnapshotBudget(156 * MB, null)).toEqual({ fits: true })
  })

  it('accepts a snapshot exactly at the cap', () => {
    expect(checkSnapshotBudget(MAX_SNAPSHOT_BYTES, null).fits).toBe(true)
  })

  it('refuses a snapshot over the 200 MB cap', () => {
    const verdict = checkSnapshotBudget(313 * MB, { quota: 10_000 * MB, usage: 0 })
    expect(verdict).toEqual({ fits: false, reason: 'snapshot is 313 MB, over the 200 MB cap' })
  })

  it('refuses a snapshot that would take usage past half the quota', () => {
    const verdict = checkSnapshotBudget(100 * MB, { quota: 300 * MB, usage: 60 * MB })
    expect(verdict.fits).toBe(false)
    if (!verdict.fits) expect(verdict.reason).toContain('50% of its storage quota')
  })

  it('accepts a snapshot that keeps usage at or under half the quota', () => {
    expect(checkSnapshotBudget(100 * MB, { quota: 300 * MB, usage: 50 * MB }).fits).toBe(true)
  })

  it('applies only the cap when the quota is reported as zero', () => {
    expect(checkSnapshotBudget(150 * MB, { quota: 0, usage: 999 * MB }).fits).toBe(true)
  })
})

describe('stored snapshot shape', () => {
  it('reads back the bytes of a current record', () => {
    const bytes = new Uint8Array([1, 2, 3])
    expect(snapshotBytesFromRecord(toSnapshotRecord(bytes))).toBe(bytes)
  })

  it('accepts an ArrayBuffer inside a current record', () => {
    const out = snapshotBytesFromRecord({ root: 'workdir', bytes: new Uint8Array([7, 8]).buffer })
    expect(out).toEqual(new Uint8Array([7, 8]))
  })

  it('rejects the bare export older builds stored', () => {
    expect(snapshotBytesFromRecord(new Uint8Array([1, 2, 3]))).toBeNull()
    expect(snapshotBytesFromRecord(new ArrayBuffer(4))).toBeNull()
  })

  it('rejects records with another root or no bytes', () => {
    expect(snapshotBytesFromRecord({ root: '/', bytes: new Uint8Array(1) })).toBeNull()
    expect(snapshotBytesFromRecord({ root: 'workdir' })).toBeNull()
    expect(snapshotBytesFromRecord(null)).toBeNull()
    expect(snapshotBytesFromRecord('snapshot')).toBeNull()
  })
})
