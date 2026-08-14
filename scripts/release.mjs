#!/usr/bin/env node
/**
 * DSH Desktop — cross-platform one-command release pipeline.
 *
 * Usage:
 *   node scripts/release.mjs                          # fetch remote master, build, package
 *   node scripts/release.mjs --ref v0.1.0             # release a specific tag/branch/commit
 *   node scripts/release.mjs --local                  # use the local checkout instead of fetching
 *   node scripts/release.mjs --repo <本地 DSH 源码路径>
 *   node scripts/release.mjs --remote-url <url>       # custom remote
 *   node scripts/release.mjs --install                # silently install after build
 *   node scripts/release.mjs --skip-boot-test         # skip the runtime smoke test
 *
 * Pipeline (remote mode): fetch -> pnpm install -> pnpm build -> pnpm deploy
 *           -> patch-runtime -> ensure-fallback -> trim-runtime
 *           -> prune-rt (orphan deps, auto reference scan) -> boot-test -> tauri build
 * Artifact: src-tauri/target/release/bundle/nsis/DSH Desktop_*_x64-setup.exe
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Ensure the Rust toolchain is reachable (rustup default location) for tauri build.
const cargoBin = join(homedir(), '.cargo', 'bin')
const cargoExe = join(cargoBin, process.platform === 'win32' ? 'cargo.exe' : 'cargo')
if (existsSync(cargoExe) && !process.env.PATH.split(delimiter).includes(cargoBin)) {
  process.env.PATH = `${cargoBin}${delimiter}${process.env.PATH}`
}

const here = dirname(fileURLToPath(import.meta.url))
const project = join(here, '..')
const rt = join(project, 'rt')
const nodeRuntime = join(project, 'node-runtime')
const backupDir = join(project, 'backup-pre-prune')
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name) => {
  const at = args.indexOf(name)
  return at !== -1 ? args[at + 1] : undefined
}
const REBUILD = flag('--rebuild-repo')
const INSTALL = flag('--install')
const SKIP_BOOT = flag('--skip-boot-test')
const USE_LOCAL = flag('--local') || args.includes('--repo')
const repoArg = value('--repo')
const projectArg = value('--project')
const REMOTE_URL = value('--remote-url') ?? 'https://github.com/deepseek-ai/deepseek-harness.git'
const REF = value('--ref') ?? 'master'
const PROJECT = projectArg ?? project

// ---------- remote source (default) vs local checkout ----------
const cacheDir = join(PROJECT, 'repo-cache', 'deepseek-harness')
let REPO

function git(dir, cmdArgs, opts = {}) {
  const r = spawnSync('git', cmdArgs, { stdio: 'inherit', ...(dir ? { cwd: dir } : {}), ...opts })
  if (r.status !== 0) fail(`git ${cmdArgs.join(' ')} failed (exit ${r.status})`)
}

function fetchRemote() {
  if (!existsSync(cacheDir)) {
    step('0/11 fetch remote DSH source (clone)')
    console.log(`$ git clone --depth 1 ${REMOTE_URL} ${cacheDir}`)
    git(null, ['clone', '--depth', '1', REMOTE_URL, cacheDir])
  } else {
    step('0/11 fetch remote DSH source (update)')
    git(cacheDir, ['fetch', '--depth', '1', 'origin', REF])
  }
  // Detach at the requested ref (branch, tag, or commit sha).
  git(cacheDir, ['checkout', '--detach', 'FETCH_HEAD', '--force'])
  const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: cacheDir, encoding: 'utf8' })
  console.log(`source: ${REMOTE_URL} @ ${REF} (${head.stdout?.trim() ?? '?'})`)
  return cacheDir
}

if (USE_LOCAL) {
  REPO = repoArg ?? process.env.DSH_DESKTOP_REPO ?? ''
  if (!REPO) fail('--local 模式需要指定源码路径：--repo <路径> 或环境变量 DSH_DESKTOP_REPO')
  console.log(`mode: LOCAL checkout ${REPO} (use --remote or drop --local to fetch from the remote)`)
} else {
  REPO = fetchRemote()
}

// ---------- node-runtime: core Node copied from the system install (no download) ----------
function resolveUserNodeDir() {
  // Persistent installs first (fnm node-versions, Program Files) — skip
  // ephemeral PATH shims (fnm multishell) so the result survives shell sessions.
  const candidates = []
  for (const base of [process.env.APPDATA, process.env.LOCALAPPDATA]) {
    if (!base) continue
    const versions = join(base, 'fnm', 'node-versions')
    if (!existsSync(versions)) continue
    for (const entry of readdirSync(versions)) {
      const dir = join(versions, entry, 'installation')
      if (existsSync(join(dir, 'node.exe'))) candidates.push(dir)
    }
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const v = (p) => (basename(dirname(p)).match(/\d+(?:\.\d+)*/g) ?? []).join('.')
      return v(b).localeCompare(v(a), undefined, { numeric: true })
    })
    return candidates[0]
  }
  for (const dir of ['C:\\Program Files\\nodejs', 'C:\\Program Files (x86)\\nodejs']) {
    if (existsSync(join(dir, 'node.exe'))) return dir
  }
  return null
}

// Only the files a bundled runtime needs: node.exe, npm/npx/corepack and their
// own node_modules. This avoids dragging in the user's globally installed
// packages (fnm's node_modules can hold hundreds of MB of globals).
const NODE_ESSENTIAL_FILES = [
  'node.exe', 'npm', 'npm.cmd', 'npm.ps1', 'npx', 'npx.cmd', 'npx.ps1',
  'corepack', 'corepack.cmd', 'nodevars.bat', 'install_tools.bat',
  'LICENSE', 'CHANGELOG.md', 'README.md',
]
const NODE_ESSENTIAL_MODULES = ['npm', 'corepack']

function ensureNodeRuntime() {
  if (existsSync(join(nodeRuntime, 'node.exe'))) {
    console.log(`node-runtime already present (${nodeRuntime})`)
    return
  }
  const dir = resolveUserNodeDir()
  if (!dir) {
    fail('未找到系统 Node.js：无法生成 node-runtime。请先安装 Node.js >= 22，或手动把 node 目录放到 node-runtime/')
  }
  rmSync(nodeRuntime, { recursive: true, force: true })
  mkdirSync(nodeRuntime, { recursive: true })
  for (const name of NODE_ESSENTIAL_FILES) {
    const from = join(dir, name)
    if (existsSync(from)) copyFileSync(from, join(nodeRuntime, name))
  }
  mkdirSync(join(nodeRuntime, 'node_modules'), { recursive: true })
  for (const name of NODE_ESSENTIAL_MODULES) {
    const from = join(dir, 'node_modules', name)
    if (existsSync(from)) {
      cpSync(from, join(nodeRuntime, 'node_modules', name), { recursive: true })
    }
  }
  console.log(`node-runtime: core Node copied from ${dir}`)
}

const rtDir = join(PROJECT, 'rt')
const backup = join(PROJECT, 'backup-pre-prune')

function step(name) { console.log(`\n========== ${name} ==========`) }
function fail(msg) { console.error(`FAILED: ${msg}`); process.exit(1) }

/** Run a command; `shell: true` resolves .cmd/.ps1 shims on Windows. */
function run(label, cmd, cmdArgs, opts = {}) {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`)
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true, ...opts })
  if (r.status !== 0) fail(`${label} failed (exit ${r.status})`)
  return r
}
function runNode(label, script, scriptArgs = []) {
  console.log(`$ node ${script} ${scriptArgs.join(' ')}`)
  const r = spawnSync(process.execPath, [script, ...scriptArgs], { stdio: 'inherit' })
  if (r.status !== 0) fail(`${label} failed (exit ${r.status})`)
}

if (!existsSync(join(REPO, 'package.json'))) fail(`DSH repo not found: ${REPO}`)
if (!existsSync(join(PROJECT, 'src-tauri', 'tauri.conf.json'))) fail(`project not found: ${PROJECT}`)

// ---------- 0. install deps + build the DSH source ----------
// Remote clones carry source only (lib/dist are not git-tracked), so they
// must be installed and built before deploy. Local checkouts may already be
// built; pass --rebuild-repo to force.
if (USE_LOCAL) {
  if (REBUILD) {
    step('0/11 rebuild DSH repo (pnpm run build)')
    run('repo build', 'pnpm', ['run', 'build'], { cwd: REPO })
  } else {
    console.log(`skip repo rebuild (using current build artifacts in ${REPO}); add --rebuild-repo for a fully fresh release`)
  }
} else {
  step('1/11 pnpm install (frozen lockfile)')
  run('pnpm install', 'pnpm', ['install', '--frozen-lockfile'], { cwd: REPO })
  step('2/11 build DSH repo (pnpm run build)')
  run('repo build', 'pnpm', ['run', 'build'], { cwd: REPO })
}

// ---------- 1. pnpm deploy -> rt ----------
step('3/11 pnpm deploy -> rt')
if (existsSync(rtDir)) {
  console.log('cleaning old rt...')
  rmSync(rtDir, { recursive: true, force: true })
}
run('pnpm deploy', 'pnpm', ['--filter', '@deepseek-ai/dsh', 'deploy', '--legacy', '--config.node-linker=hoisted', rtDir], { cwd: REPO })

// ---------- 2. patch runtime deps ----------
step('4/11 patch-runtime (restore runtime-needed devDeps)')
runNode('patch-runtime', join(here, 'patch-runtime.mjs'), [rtDir, REPO])

// ---------- 3. ensure-fallback ----------
step('5/11 install ensure-fallback script')
mkdirSync(join(rtDir, 'scripts'), { recursive: true })
copyFileSync(join(here, 'ensure-fallback.mjs'), join(rtDir, 'scripts', 'ensure-fallback.mjs'))

// ---------- 4. trim maps/types/sources ----------
step('6/11 trim-runtime (strip maps/d.ts/sources)')
runNode('trim-runtime', join(here, 'trim-runtime.mjs'), [rtDir])

// ---------- 5. prune orphan deps (back up the previous installer first) ----------
step('7/11 prune-rt (remove runtime-unneeded orphan deps)')
const nsisDir = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle', 'nsis')
const installers = existsSync(nsisDir) ? readdirSync(nsisDir).filter((f) => f.endsWith('-setup.exe')).map((f) => join(nsisDir, f)) : []
if (installers.length > 0) {
  mkdirSync(backup, { recursive: true })
  const bk = join(backup, `setup-${stamp}.exe`)
  copyFileSync(installers[0], bk)
  console.log(`previous installer backed up: ${bk}`)
}
runNode('prune-rt', join(here, 'prune-rt.mjs'), [rtDir, backup])

// ---------- 6. ensure node-runtime (copy core Node from system) ----------
step('8/11 ensure node-runtime (copy core Node from system)')
ensureNodeRuntime()

// ---------- 7. runtime smoke test ----------
if (!SKIP_BOOT) {
  step('9/11 boot-test (runtime smoke test)')
  const nodeExe = join(nodeRuntime, 'node.exe')
  const testHome = join(PROJECT, `.dsh-boot-test-${stamp}`)
  runNode('boot-test', join(here, 'boot-test.mjs'), [nodeExe, rtDir, testHome])
  rmSync(testHome, { recursive: true, force: true })
} else {
  console.log('skipping smoke test (--skip-boot-test)')
}

// ---------- 8. build ----------
step('10/11 tauri build')
const tauriOk = spawnSync('tauri', ['build'], { stdio: 'inherit', shell: true, cwd: PROJECT })
console.log(`[tauri] status=${tauriOk.status} signal=${tauriOk.signal}`)
if (tauriOk.status !== 0) {
  console.log('tauri CLI not on PATH or failed — falling back to npx @tauri-apps/cli')
  const npx = spawnSync('npx', ['--yes', '@tauri-apps/cli', 'build'], { stdio: 'inherit', shell: true, cwd: PROJECT })
  console.log(`[npx] status=${npx.status} signal=${npx.signal}`)
  if (npx.status !== 0) fail(`tauri build failed (exit ${npx.status})`)
}

// ---------- report ----------
const finalNsisDir = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle', 'nsis')
const artifacts = existsSync(finalNsisDir) ? readdirSync(finalNsisDir).filter((f) => f.endsWith('-setup.exe')).map((f) => join(finalNsisDir, f)) : []
if (artifacts.length === 0) fail('installer artifact not found')
const artifact = artifacts.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
const mb = (statSync(artifact).size / 1048576).toFixed(1)
console.log('\n================ RELEASE COMPLETE ================')
console.log(`installer: ${artifact}`)
console.log(`size     : ${mb} MB`)
console.log(`time     : ${new Date().toISOString()}`)

if (INSTALL) {
  if (process.platform !== 'win32') fail('--install is only supported on Windows')
  console.log('\nsilent install...')
  const p = spawnSync(artifact, ['/S'], { stdio: 'inherit', shell: false })
  if (p.status !== 0) fail(`install failed (exit ${p.status})`)
  console.log('installed.')
}

process.exit(0)
