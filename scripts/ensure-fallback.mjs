// Ensure the flat module fallback `$DSH_HOME/profiles/node_modules` links every
// @deepseek-ai package shipped inside this runtime, so the Cordis loader can
// import bundle packages from the profile directory even though a pnpm-deployed
// layout lacks the per-package node_modules links the repo layout has.
//
// healProfilesModuleFallback (dsh-app-boot) runs during boot and only ADDITIVELY
// maintains its own closure links, so the extra links created here survive.
//
// Usage: node ensure-fallback.mjs <runtimeDir>
// DSH_HOME env decides the harness home (defaults to the OS home's ~/.dsh).
import { existsSync, mkdirSync, readdirSync, readlinkSync, lstatSync, symlinkSync, unlinkSync, realpathSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'

const runtimeRaw = process.argv[2] ?? '.'
// Strip any `\\?\` / `\??\` extended-length prefix (NSIS/tauri can hand us one).
const runtime = runtimeRaw.replace(/^(\\\\\?\\|\?\?\\|\?\?\\\\)/, '')
const dshHome = (process.env.DSH_HOME ?? '').trim() || join(homedir(), '.dsh')
const profilesNm = join(dshHome, 'profiles', 'node_modules')

function packageDirs() {
  const found = new Map() // packageName -> real dir
  const addScope = (scopeDir) => {
    if (!existsSync(scopeDir)) return
    for (const entry of readdirSync(scopeDir, { withFileTypes: true })) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
      const dir = join(scopeDir, entry.name)
      let real
      try { real = realpathSync(dir) } catch { continue }
      if (existsSync(join(real, 'package.json'))) found.set(`@deepseek-ai/${entry.name}`, real)
    }
  }
  // Top-level junctions (the app's direct @deepseek-ai deps).
  addScope(join(runtime, 'node_modules', '@deepseek-ai'))
  // Hoisted store copies (transitive @deepseek-ai deps).
  addScope(join(runtime, 'node_modules', '.pnpm', 'node_modules', '@deepseek-ai'))
  return found
}

function ensureJunction(link, target) {
  mkdirSync(dirname(link), { recursive: true })
  let stat
  try { stat = lstatSync(link) } catch { stat = undefined }
  if (stat !== undefined) {
    if (!stat.isSymbolicLink()) {
      // A real directory here would shadow resolution; report it loudly.
      console.error(`ensure-fallback: ${link} exists and is not a symlink; remove it`)
      return
    }
    try { if (realpathSync(link) === realpathSync(target)) return } catch { /* re-link below */ }
    try { unlinkSync(link) } catch { /* ignore */ }
  }
  try {
    symlinkSync(target, link, 'junction')
  } catch (error) {
    console.error(`ensure-fallback: failed to link ${link} -> ${target}: ${String(error)}`)
  }
}

const packages = packageDirs()
let created = 0
for (const [name, dir] of packages) {
  ensureJunction(join(profilesNm, ...name.split('/')), dir)
  created++
}
console.log(`ensure-fallback: linked ${created} packages under ${profilesNm}`)
