// Prune rt/node_modules automatically on every release:
//   1. Compute the runtime dependency closure (declared deps from rt/package.json).
//   2. Reference-scan ALL closure code for undeclared/dynamic imports of
//      orphan packages (catches runtime-needed packages DSH never declares).
//   3. Keep: closure + referenced orphans + their transitive deps (e.g. tsx -> esbuild).
//   4. Move everything else to the trash dir (recoverable).
import { readFileSync, readdirSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = process.argv[2] ?? join(here, '..', 'rt')
const trash = process.argv[3] ?? join(here, '..', 'backup-pre-prune', 'removed-packages')
const nm = join(root, 'node_modules')

function readPkg(pkgDir) {
  try { return JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) } catch { return null }
}

// ---- installed map -------------------------------------------------------
const installed = new Map()
for (const entry of readdirSync(nm)) {
  if (entry.startsWith('@')) {
    const scopeDir = join(nm, entry)
    if (!existsSync(scopeDir)) continue
    for (const name of readdirSync(scopeDir)) {
      const pkgDir = join(scopeDir, name)
      const pkg = readPkg(pkgDir)
      if (pkg) installed.set(`${entry}/${name}`, { pkgDir, pkg })
    }
  } else {
    const pkgDir = join(nm, entry)
    const pkg = readPkg(pkgDir)
    if (pkg) installed.set(entry, { pkgDir, pkg })
  }
}

// ---- dependency closure from rt/package.json -----------------------------
const rootPkg = readPkg(root)
const queue = [...Object.keys(rootPkg.dependencies ?? {})]
const closure = new Set()
while (queue.length) {
  const name = queue.pop()
  if (closure.has(name)) continue
  const info = installed.get(name)
  if (!info) continue
  closure.add(name)
  const deps = { ...(info.pkg.dependencies ?? {}), ...(info.pkg.peerDependencies ?? {}), ...(info.pkg.optionalDependencies ?? {}) }
  for (const dep of Object.keys(deps)) {
    if (!closure.has(dep) && !queue.includes(dep)) queue.push(dep)
  }
}

// ---- orphans (installed, not in closure) ---------------------------------
const orphans = []
for (const [name, info] of installed) {
  if (!closure.has(name)) orphans.push({ name, info })
}

// ---- reference scan: any orphan imported by closure code? -----------------
// Only import contexts count (from "x", import("x"), require("x"),
// import.meta.resolve("x")) — bare quoted strings (grammar names, comments)
// are false positives.
const refNames = new Set(orphans.map((o) => o.name))
const sorted = [...refNames].sort((a, b) => b.length - a.length)
// Group 2 = the resolved module name (strip any subpath from the match).
const re = new RegExp(
  `(?:from\\s+|import\\s*\\(|require\\s*\\(|import\\.meta\\.resolve\\s*\\(|import\\s+)(['"])(?:(${sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?:/|['"]))`,
  'g',
)

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue
      yield* walk(p)
    } else if (e.isFile() && (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs'))) {
      yield p
    }
  }
}

const referenced = new Set()
for (const name of closure) {
  const info = installed.get(name)
  if (!info) continue
  for (const file of walk(info.pkgDir)) {
    let text
    try { text = readFileSync(file, 'utf8') } catch { continue }
    for (const m of text.matchAll(re)) {
      const full = m[2]
      if (refNames.has(full)) referenced.add(full)
    }
  }
}
for (const base of [join(root, 'lib'), join(root, 'scripts')]) {
  if (!existsSync(base)) continue
  for (const file of walk(base)) {
    let text
    try { text = readFileSync(file, 'utf8') } catch { continue }
    for (const m of text.matchAll(re)) {
      const full = m[2]
      if (refNames.has(full)) referenced.add(full)
    }
  }
}

// ---- keep set: referenced orphans + their transitive deps -----------------
const keep = new Set(referenced)
const pending = [...referenced]
while (pending.length) {
  const name = pending.pop()
  if (!refNames.has(name)) continue // not an orphan -> already covered by closure
  const info = installed.get(name)
  if (!info) continue
  const deps = { ...(info.pkg.dependencies ?? {}), ...(info.pkg.optionalDependencies ?? {}) }
  for (const dep of Object.keys(deps)) {
    if (!keep.has(dep)) {
      keep.add(dep)
      pending.push(dep)
    }
  }
}

// ---- move unneeded orphans -----------------------------------------------
function dirSize(dir) {
  let total = 0
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) total += dirSize(p)
      else if (e.isFile()) total += statSync(p).size
    }
  } catch {}
  return total
}

mkdirSync(trash, { recursive: true })
let removedMB = 0
let removedCount = 0
const kept = []
for (const { name, info } of orphans) {
  if (keep.has(name)) { kept.push(name); continue }
  const size = dirSize(info.pkgDir)
  const dest = join(trash, name.replace('/', '__'))
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true })
  renameSync(info.pkgDir, dest)
  removedCount++
  removedMB += size / 1048576
}

console.log(`closure: ${closure.size} packages; orphans: ${orphans.length}`)
console.log(`kept (referenced by runtime code): ${[...referenced].join(', ')}`)
console.log(`removed ${removedCount} packages, ${removedMB.toFixed(1)} MB -> ${trash}`)
