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
import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const IS_WIN = process.platform === 'win32'
const NODE_BIN = IS_WIN ? 'node.exe' : 'node'

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
  // Resolve the requested ref to a commit sha up front. Modern git no longer
  // writes .git/FETCH_HEAD for `git clone`/shallow fetches, so FETCH_HEAD must
  // not be relied on. `ls-remote <ref> <ref>^{}` peels annotated tags.
  let sha
  if (/^[0-9a-f]{7,40}$/i.test(REF)) {
    sha = REF // caller passed a commit sha directly
  } else {
    const ls = spawnSync('git', ['ls-remote', REMOTE_URL, REF, `${REF}^{}`], { encoding: 'utf8' })
    if (ls.status !== 0 || !ls.stdout?.trim()) fail(`无法解析远程引用 ${REF}（${REMOTE_URL}）`)
    const lines = ls.stdout.split('\n').filter(Boolean)
    const peeled = lines.find((l) => l.includes('^{}'))
    const plain = lines.find((l) => !l.includes('^{}'))
    sha = (peeled ?? plain)?.split('\t')[0]
    if (!sha) fail(`无法解析远程引用 ${REF}（${REMOTE_URL}）`)
  }

  if (!existsSync(cacheDir)) {
    step('0/11 fetch remote DSH source (clone)')
    console.log(`$ git clone --depth 1 ${REMOTE_URL} ${cacheDir}`)
    git(null, ['clone', '--depth', '1', REMOTE_URL, cacheDir])
  } else {
    step('0/11 fetch remote DSH source (update)')
  }
  // Bring in the exact commit and move the worktree to it (no FETCH_HEAD).
  git(cacheDir, ['fetch', '--depth', '1', 'origin', sha])
  git(cacheDir, ['reset', '--hard', sha])
  console.log(`source: ${REMOTE_URL} @ ${REF} (${sha.slice(0, 7)})`)
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
  if (!IS_WIN) {
    // Unix: the node running this script is a system install; use its real
    // path (resolves through symlinks such as homebrew/volta shims).
    try {
      return dirname(realpathSync(process.execPath))
    } catch {
      return null
    }
  }
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

// Only the files a bundled runtime needs: the node binary, npm/npx/corepack
// and their own node_modules. This avoids dragging in the user's globally
// installed packages (fnm's node_modules can hold hundreds of MB of globals).
const NODE_ESSENTIAL_FILES = IS_WIN
  ? [
      'node.exe', 'npm', 'npm.cmd', 'npm.ps1', 'npx', 'npx.cmd', 'npx.ps1',
      'corepack', 'corepack.cmd', 'nodevars.bat', 'install_tools.bat',
      'LICENSE', 'CHANGELOG.md', 'README.md',
    ]
  : [
      'node', 'npm', 'npx', 'corepack',
      'LICENSE', 'CHANGELOG.md', 'README.md',
    ]
const NODE_ESSENTIAL_MODULES = ['npm', 'corepack']

function ensureNodeRuntime() {
  if (existsSync(join(nodeRuntime, NODE_BIN))) {
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
    if (!existsSync(from)) continue
    if (!IS_WIN) {
      // On unix, npm/npx/corepack in the bin dir are often symlinks into
      // ../lib/node_modules; copying the dereferenced file would yield a
      // broken wrapper. The bundled node binary is what matters at runtime,
      // so skip symlinked wrappers.
      try {
        if (!lstatSync(from).isFile()) continue
      } catch {
        continue
      }
    }
    const to = join(nodeRuntime, name)
    copyFileSync(from, to)
    if (!IS_WIN && (name === 'node' || name === 'npm' || name === 'npx' || name === 'corepack')) {
      try { chmodSync(to, 0o755) } catch {}
    }
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
  // confirmModulesPurge=false: pnpm aborts a full node_modules purge without
  // a TTY unless CI=true; the release pipeline is non-interactive by design.
  run('pnpm install', 'pnpm', ['install', '--frozen-lockfile', '--config.confirmModulesPurge=false'], { cwd: REPO })
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
if (IS_WIN) {
  const nsisDir = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle', 'nsis')
  const installers = existsSync(nsisDir) ? readdirSync(nsisDir).filter((f) => f.endsWith('-setup.exe')).map((f) => join(nsisDir, f)) : []
  if (installers.length > 0) {
    mkdirSync(backup, { recursive: true })
    const bk = join(backup, `setup-${stamp}.exe`)
    copyFileSync(installers[0], bk)
    console.log(`previous installer backed up: ${bk}`)
  }
}
runNode('prune-rt', join(here, 'prune-rt.mjs'), [rtDir, backup])

// ---------- 6. ensure node-runtime (copy core Node from system) ----------
step('8/11 ensure node-runtime (copy core Node from system)')
ensureNodeRuntime()

// ---------- 7. runtime smoke test ----------
if (!SKIP_BOOT) {
  step('9/11 boot-test (runtime smoke test)')
  const nodeExe = join(nodeRuntime, NODE_BIN)
  const testHome = join(PROJECT, `.dsh-boot-test-${stamp}`)
  runNode('boot-test', join(here, 'boot-test.mjs'), [nodeExe, rtDir, testHome])
  rmSync(testHome, { recursive: true, force: true })
} else {
  console.log('skipping smoke test (--skip-boot-test)')
}

// ---------- 8. build ----------
step('10/11 tauri build')
const BUNDLES = IS_WIN
  ? ['nsis']
  : process.platform === 'darwin'
    ? ['dmg', 'app']
    : ['deb', 'appimage']
console.log(`bundle targets: ${BUNDLES.join(', ')}`)
const buildArgs = ['build', '--bundles', ...BUNDLES]
if (process.env.TAURI_VERBOSE === '1') buildArgs.push('-v')
const tauriOk = spawnSync('tauri', buildArgs, { stdio: 'inherit', shell: true, cwd: PROJECT })
console.log(`[tauri] status=${tauriOk.status} signal=${tauriOk.signal}`)
if (tauriOk.status !== 0) {
  console.log('tauri CLI not on PATH or failed — falling back to npx @tauri-apps/cli')
  const npx = spawnSync('npx', ['--yes', '@tauri-apps/cli', ...buildArgs], { stdio: 'inherit', shell: true, cwd: PROJECT })
  console.log(`[npx] status=${npx.status} signal=${npx.signal}`)
  if (npx.status !== 0) fail(`tauri build failed (exit ${npx.status})`)
}

// ---------- report ----------
// Locate the produced distributable(s) for this platform.
const bundleRoot = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle')
const artifactGlobs = IS_WIN
  ? ['nsis/*-setup.exe']
  : process.platform === 'darwin'
    ? ['dmg/*.dmg', 'macos/*.app']
    : ['deb/*.deb', 'appimage/*.AppImage']
const artifacts = []
for (const glob of artifactGlobs) {
  const dir = join(bundleRoot, dirname(glob))
  if (!existsSync(dir)) continue
  const suffix = basename(glob).replace('*', '')
  for (const f of readdirSync(dir)) {
    if (f.endsWith(suffix)) artifacts.push(join(dir, f))
  }
}
if (artifacts.length === 0) fail('no bundle artifact found')
artifacts.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
const primary = artifacts[0]
const mb = (statSync(primary).size / 1048576).toFixed(1)
console.log('\n================ RELEASE COMPLETE ================')
console.log(`artifact: ${primary}`)
console.log(`size    : ${mb} MB`)
console.log(`time    : ${new Date().toISOString()}`)

if (INSTALL) {
  if (!IS_WIN) fail('--install is only supported on Windows')
  console.log('\nsilent install...')
  const p = spawnSync(primary, ['/S'], { stdio: 'inherit', shell: false })
  if (p.status !== 0) fail(`install failed (exit ${p.status})`)
  console.log('installed.')
}

process.exit(0)
