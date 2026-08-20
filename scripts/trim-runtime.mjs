// Trim a deployed DSH runtime for distribution:
// - removes *.map (sourcemaps), *.d.ts (type defs) and *.ts (sources) under
//   node_modules — none are needed at runtime, and they are the deepest/longest
//   paths that break NSIS (long-path) bundling.
// Usage: node trim-runtime.mjs <runtimeDir>
import {
  readdirSync, rmSync, statSync, chmodSync, realpathSync,
  readlinkSync, lstatSync, unlinkSync, existsSync,
} from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'

const root = process.argv[2] ?? '.'
const targets = [
  join(root, 'node_modules'),
  join(root, 'marketplace-seed', 'node_modules'),
]

let removed = 0
let saved = 0
const visited = new Set() // realpath -> true (guards junction cycles)

function walk(dir) {
  let real
  try { real = realpathSync(dir) } catch { return }
  if (visited.has(real)) return
  visited.add(real)

  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (e.name === '.bin' || e.name === '.git') continue
    const p = join(dir, e.name)
    if (e.isDirectory() || e.isSymbolicLink()) {
      walk(p)
      continue
    }
    const ext = extname(e.name).toLowerCase()
    if (ext === '.map' || ext === '.d.ts' || e.name.endsWith('.d.ts') || ext === '.ts') {
      try {
        saved += statSync(p).size
        try { chmodSync(p, 0o666) } catch { /* not writable; try delete anyway */ }
        rmSync(p, { force: true })
        removed++
      } catch { /* ignore */ }
    }
  }
}

for (const target of targets) {
  if (statSync(target, { throwIfNoEntry: false })) walk(target)
}
console.log(
  `trim-runtime: removed ${removed} files, freed ${(saved / 1e6).toFixed(0)} MB ` +
  `under ${targets.filter((target) => existsSync(target)).join(', ')}`,
)

// Phase 2: remove dangling junctions/symlinks (their targets are gone), which
// would otherwise break resource bundling (tauri-build) and are invisible to
// Node's resolution anyway. Detection uses realpathSync (throws on a dangling
// link) because Windows junction targets read back with a `\??\` prefix that
// plain path checks cannot resolve.
const dangling = []
function sweep(dir) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { sweep(p); continue }
    if (e.isSymbolicLink()) {
      try {
        realpathSync(p)
      } catch {
        try { unlinkSync(p); dangling.push(p) } catch { /* ignore */ }
      }
    }
  }
}
for (const target of targets) sweep(target)
console.log(`trim-runtime: removed ${dangling.length} dangling links`)
if (dangling.length > 0) console.log(dangling.slice(0, 10).join('\n'))
