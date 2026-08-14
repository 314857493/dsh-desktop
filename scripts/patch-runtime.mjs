// Patch a pnpm-deployed DSH runtime: DSH imports some packages at runtime that
// are declared as devDependencies of workspace packages, so `pnpm deploy`
// prunes them and the runtime fails to boot. This script scans every built JS
// file (and cordis patch yml) under the deployed app + all @deepseek-ai
// packages, finds import specifiers that do NOT resolve inside the deploy,
// copies the missing packages (recursively) from the working repo into the
// deploy's hoisted `.pnpm/node_modules`, and repeats until a fixpoint.
//
// Usage: node patch-runtime.mjs <deployRoot> <repoRoot>
import { readFileSync, readdirSync, statSync, cpSync, existsSync, mkdirSync, realpathSync } from 'node:fs'
import { join, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { builtinModules } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = process.argv[2] ?? join(here, '..', 'rt')
const REPO = process.argv[3] ?? process.env.DSH_DESKTOP_REPO ?? ''
// Copy missing packages into the top-level node_modules: the final stop of
// Node's upward resolution walk, which works for both the isolated (.pnpm)
// and hoisted (flat) deploy layouts.
const HOIST = join(ROOT, 'node_modules')

const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)])

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'tests' || e.name === 'test' || e.name === 'dist') continue
    const p = join(dir, e.name)
    // Junctions/symlinks report isSymbolicLink()=true with isDirectory()=false,
    // so recurse into them explicitly (readdirSync follows the target).
    if (e.isDirectory() || e.isSymbolicLink()) walk(p, out)
    else if (e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.cjs') || e.name.endsWith('.yml') || e.name.endsWith('.yaml')) out.push(p)
  }
  return out
}

const SPEC_RE = [
  /from\s+["']([^"']+)["']/g,
  /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  /require\s*\(\s*["']([^"']+)["']\s*\)/g,
  /^plugin:\s*["']?([^\s"']+)/gm,
]

function specsOf(file) {
  let text
  try { text = readFileSync(file, 'utf8') } catch { return [] }
  const specs = new Set()
  for (const re of SPEC_RE) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      const spec = m[1]
      // Cordis service names, slot names and template refs are not packages.
      if (spec.includes('$') || spec.includes('.')) continue
      specs.add(spec)
    }
  }
  return [...specs]
}

function isBuiltin(spec) {
  return spec.startsWith('node:') || builtins.has(spec.split('/')[0]) || spec.startsWith('#')
}

function isRelative(spec) {
  return spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('file:') || spec.startsWith('data:')
}

// Standard Node-style upward resolution against the deploy root, resolved from
// the REAL path (junctions are transparent to Node at runtime). If the package
// root of a subpath spec exists, the spec is considered resolvable (subpath
// details such as exports maps are resolved by Node itself at runtime).
function resolvesInDeploy(spec, fromFile) {
  if (isBuiltin(spec) || isRelative(spec)) return true
  const pkgRoot = spec.startsWith('@')
    ? spec.split('/').slice(0, 2).join('/')
    : spec.split('/')[0]
  let dir
  try { dir = dirname(realpathSync(fromFile)) } catch { dir = dirname(fromFile) }
  for (;;) {
    const base = join(dir, 'node_modules', ...spec.split('/'))
    for (const candidate of [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, join(base, 'index.js')]) {
      if (existsSync(candidate)) return true
    }
    if (existsSync(join(dir, 'node_modules', ...pkgRoot.split('/')))) return true
    const parent = dirname(dir)
    if (parent === dir) return false
    dir = parent
  }
}

// ---------------------------------------------------------------------------
// Copying from the repo
// ---------------------------------------------------------------------------

function locateInRepo(spec) {
  const candidates = [
    join(REPO, 'node_modules', '.pnpm', 'node_modules', ...spec.split('/')),
    join(REPO, 'node_modules', ...spec.split('/')),
  ]
  for (const c of candidates) {
    if (existsSync(c)) {
      try { return realpathSync(c) } catch { return c }
    }
  }
  return undefined
}

const seen = new Set()
const copied = []

function copyPackage(spec) {
  // Subpath spec ('@scope/pkg/sub') -> copy the package root.
  const pkgSpec = spec.startsWith('@')
    ? spec.split('/').slice(0, 2).join('/')
    : spec.split('/')[0]
  if (seen.has(pkgSpec)) return
  seen.add(pkgSpec)
  const src = locateInRepo(pkgSpec)
  if (!src) {
    console.error(`MISSING IN REPO: ${pkgSpec}`)
    return
  }
  const dest = join(HOIST, ...pkgSpec.split('/'))
  mkdirSync(dirname(dest), { recursive: true })
  if (existsSync(dest)) { console.log(`already present: ${pkgSpec}`); return }
  cpSync(src, dest, {
    recursive: true,
    filter: (p) => {
      const base = p.split(sep).pop()
      return base !== 'node_modules' && base !== '.git'
    },
  })
  copied.push(pkgSpec)
  console.log(`copied: ${pkgSpec} <- ${src}`)
}

// ---------------------------------------------------------------------------
// Fixpoint loop
// ---------------------------------------------------------------------------

let round = 0
for (;;) {
  round += 1
  if (round > 25) { console.error('fixpoint not reached after 25 rounds'); break }

  const scanDirs = [
    join(ROOT, 'lib'),
    join(ROOT, 'config'),
    join(ROOT, 'node_modules', '@deepseek-ai'),
    join(ROOT, 'node_modules', '.pnpm', 'node_modules', '@deepseek-ai'),
  ]
  const files = scanDirs.flatMap((d) => (existsSync(d) ? walk(d) : []))
  const missing = new Map() // spec -> example file

  for (const file of files) {
    for (const spec of specsOf(file)) {
      if (isBuiltin(spec) || isRelative(spec)) continue
      if (!resolvesInDeploy(spec, file) && !existsSync(join(HOIST, ...spec.split('/')))) {
        if (!missing.has(spec)) missing.set(spec, file)
      }
    }
  }

  if (missing.size === 0) {
    console.log(`fixpoint reached after round ${round}. copied ${copied.length} packages:`)
    for (const c of copied) console.log(`  ${c}`)
    break
  }

  console.log(`round ${round}: ${missing.size} missing specifiers`)
  for (const [spec, file] of missing) console.log(`  ${spec}   (from ${file.replace(ROOT, '<deploy>')})`)
  for (const spec of missing.keys()) copyPackage(spec)
}
