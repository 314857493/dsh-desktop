#!/usr/bin/env node
/**
 * DSH Desktop — cross-platform one-command release pipeline.
 *
 * Usage:
 *   node scripts/release.mjs                          # fetch remote master, build, package
 *   node scripts/release.mjs --ref dsh-v0.1.0-rc.8    # release a specific tag/branch/commit
 *   node scripts/release.mjs --local                  # use the local checkout instead of fetching
 *   node scripts/release.mjs --repo <本地 DSH 源码路径>
 *   node scripts/release.mjs --remote-url <url>       # custom remote
 *   node scripts/release.mjs --install                # silently install after build
 *   node scripts/release.mjs --skip-boot-test         # skip the runtime smoke test
 *   node scripts/release.mjs --no-updater              # test package; do not require/sign updater artifacts
 *   node scripts/release.mjs --version 0.1.4          # stamp the bundle version (Tauri + Cargo metadata)
 *   node scripts/release.mjs --prepare-only           # build runtime without signing credentials
 *   node scripts/release.mjs --package-only           # package an already-prepared runtime
 *
 * Pipeline (remote mode): fetch -> pnpm install -> pnpm build -> pnpm deploy
 *           -> patch-runtime -> node/pnpm runtime -> bundled marketplace
 *           -> startup migrations -> trim/prune -> boot-test -> tauri build
 * Artifact: src-tauri/target/release/bundle/nsis/DSH Desktop_*_x64-setup.exe
 */
import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const IS_WIN = process.platform === 'win32'
const NODE_BIN = IS_WIN ? 'node.exe' : 'node'
const TAURI_CLI_VERSION = '2.11.4'

// Ensure the Rust toolchain is reachable (rustup default location) for tauri build.
const cargoBin = join(homedir(), '.cargo', 'bin')
const cargoExe = join(cargoBin, process.platform === 'win32' ? 'cargo.exe' : 'cargo')
if (existsSync(cargoExe) && !process.env.PATH.split(delimiter).includes(cargoBin)) {
  process.env.PATH = `${cargoBin}${delimiter}${process.env.PATH}`
}

const here = dirname(fileURLToPath(import.meta.url))
const project = join(here, '..')
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
const NO_UPDATER = flag('--no-updater')
const PREPARE_ONLY = flag('--prepare-only')
const PACKAGE_ONLY = flag('--package-only')
const USE_LOCAL = flag('--local') || args.includes('--repo')
const repoArg = value('--repo')
const projectArg = value('--project')
const REMOTE_URL = value('--remote-url') ?? 'https://github.com/deepseek-ai/deepseek-harness.git'
const REF = (value('--ref') ?? process.env.DSH_DESKTOP_UPSTREAM_REF ?? '').trim() || 'master'
const PROJECT = projectArg ?? project
const nodeRuntime = join(PROJECT, 'node-runtime')

if (PREPARE_ONLY && PACKAGE_ONLY) {
  fail('--prepare-only 与 --package-only 不能同时使用')
}

// Formal builds must sign updater artifacts. Development machines can still
// exercise the complete runtime + installer pipeline with --no-updater; that
// mode merges a small config override and emits ordinary installers only.
if (!NO_UPDATER && !PREPARE_ONLY) {
  const signingKey = process.env.TAURI_SIGNING_PRIVATE_KEY?.trim()
  if (!signingKey) {
    fail(
      '缺少 TAURI_SIGNING_PRIVATE_KEY：正式打包需要 updater 私钥。' +
      '开发机仅测试安装包时请添加 --no-updater。',
    )
  }

  // GitHub Actions provides the key contents through its encrypted secret,
  // while local developers commonly provide a key-file path. `tauri build`
  // accepts either form, but `tauri signer sign` accepts contents only, so
  // normalize a path once before invoking either command.
  if (!signingKey.includes('\n') && existsSync(signingKey) && statSync(signingKey).isFile()) {
    const contents = readFileSync(signingKey, 'utf8').trim()
    if (!contents) fail(`updater 私钥文件为空: ${signingKey}`)
    process.env.TAURI_SIGNING_PRIVATE_KEY = contents
    console.log(`updater signing key: loaded from ${signingKey}`)
  }
}

// ---------- bundle version stamping ----------
// --version overrides the version embedded in the artifacts (the name shown
// in installers and the app metadata). Tauri reads the version from
// tauri.conf.json; Cargo.toml and Cargo.lock are synced to keep the crate
// metadata consistent in clean and cached builds.
// CI passes metadata through environment variables so the same invocation
// works under Bash and PowerShell. Explicit CLI options still take precedence.
const VERSION_ARG = (value('--version') ?? process.env.DSH_DESKTOP_VERSION ?? '').trim()
if (VERSION_ARG !== '') {
  const clean = VERSION_ARG.replace(/^v/, '')
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(clean)) {
    fail(`--version 需要 semver（如 0.1.4 或 v0.1.4），收到 "${VERSION_ARG}"`)
  }
  const confPath = join(PROJECT, 'src-tauri', 'tauri.conf.json')
  const cargoPath = join(PROJECT, 'src-tauri', 'Cargo.toml')
  const cargoLockPath = join(PROJECT, 'src-tauri', 'Cargo.lock')
  for (const [path, pattern, replacement] of [
    [confPath, /"version"\s*:\s*"[^"]*"/, `"version": "${clean}"`],
    [cargoPath, /^version\s*=\s*"[^"]*"/m, `version = "${clean}"`],
    [
      cargoLockPath,
      /(\[\[package\]\]\r?\nname = "dsh-desktop"\r?\nversion = ")[^"]*(")/,
      `$1${clean}$2`,
    ],
  ]) {
    const text = readFileSync(path, 'utf8')
    if (!pattern.test(text)) fail(`未找到 version 字段: ${path}`)
    writeFileSync(path, text.replace(pattern, replacement))
  }
  console.log(`version synced: ${clean} (Tauri config + Cargo manifest/lock)`)
}

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
    step('0/12 fetch remote DSH source (clone)')
    console.log(`$ git clone --depth 1 ${REMOTE_URL} ${cacheDir}`)
    git(null, ['clone', '--depth', '1', REMOTE_URL, cacheDir])
  } else {
    step('0/12 fetch remote DSH source (update)')
  }
  // Bring in the exact commit and move the worktree to it (no FETCH_HEAD).
  git(cacheDir, ['fetch', '--depth', '1', 'origin', sha])
  git(cacheDir, ['reset', '--hard', sha])
  console.log(`source: ${REMOTE_URL} @ ${REF} (${sha.slice(0, 7)})`)
  return cacheDir
}

if (PACKAGE_ONLY) {
  // Packaging consumes only the prepared rt/ and node-runtime/ directories.
  // Do not fetch, inspect, or execute upstream source in the signing phase.
  REPO = cacheDir
  console.log('mode: PACKAGE ONLY (using prepared runtime; upstream source is not executed)')
} else if (USE_LOCAL) {
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
const bundleRoot = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle')

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

/** Run the pinned Tauri CLI, using a matching global binary or an npx fallback. */
function runTauri(label, tauriArgs) {
  // Windows needs a shell to resolve npm's `.cmd` shims. On Unix, using a
  // shell would re-parse individual arguments and split bundle paths that
  // contain spaces (for example `DSH Desktop_0.1.6_amd64.deb`).
  const probe = spawnSync('tauri', ['--version'], { encoding: 'utf8', shell: IS_WIN, cwd: PROJECT })
  const directVersion = probe.status === 0
    ? probe.stdout?.trim().match(/\d+\.\d+\.\d+/)?.[0]
    : undefined
  if (directVersion === TAURI_CLI_VERSION) {
    const direct = spawnSync('tauri', tauriArgs, { stdio: 'inherit', shell: IS_WIN, cwd: PROJECT })
    console.log(`[tauri@${directVersion}] status=${direct.status} signal=${direct.signal}`)
    if (direct.status === 0) return
  } else if (directVersion !== undefined) {
    console.log(`tauri CLI ${directVersion} does not match pinned ${TAURI_CLI_VERSION}`)
  }

  console.log(`using npx @tauri-apps/cli@${TAURI_CLI_VERSION}`)
  const fallback = spawnSync(
    'npx',
    ['--yes', `@tauri-apps/cli@${TAURI_CLI_VERSION}`, ...tauriArgs],
    { stdio: 'inherit', shell: IS_WIN, cwd: PROJECT },
  )
  console.log(`[npx] status=${fallback.status} signal=${fallback.signal}`)
  if (fallback.status !== 0) fail(`${label} failed (exit ${fallback.status})`)
}

if (!existsSync(join(PROJECT, 'src-tauri', 'tauri.conf.json'))) fail(`project not found: ${PROJECT}`)
if (PACKAGE_ONLY) {
  if (!existsSync(join(rtDir, 'package.json'))) fail(`prepared DSH runtime not found: ${rtDir}`)
  if (!existsSync(join(nodeRuntime, NODE_BIN))) fail(`prepared Node runtime not found: ${nodeRuntime}`)
} else if (!existsSync(join(REPO, 'package.json'))) {
  fail(`DSH repo not found: ${REPO}`)
}

// ---------- 0. install deps + build the DSH source ----------
// Remote clones carry source only (lib/dist are not git-tracked), so they
// must be installed and built before deploy. Local checkouts may already be
// built; pass --rebuild-repo to force.
if (!PACKAGE_ONLY) {
  if (USE_LOCAL) {
    if (REBUILD) {
      step('0/13 rebuild DSH repo (pnpm run build)')
      run('repo build', 'pnpm', ['run', 'build'], { cwd: REPO })
    } else {
      console.log(`skip repo rebuild (using current build artifacts in ${REPO}); add --rebuild-repo for a fully fresh release`)
    }
  } else {
    step('1/13 pnpm install (frozen lockfile)')
    // confirmModulesPurge=false: pnpm aborts a full node_modules purge without
    // a TTY unless CI=true; the release pipeline is non-interactive by design.
    run('pnpm install', 'pnpm', ['install', '--frozen-lockfile', '--config.confirmModulesPurge=false'], { cwd: REPO })
    step('2/13 build DSH repo (pnpm run build)')
    run('repo build', 'pnpm', ['run', 'build'], { cwd: REPO })
  }

  // ---------- 1. pnpm deploy -> rt ----------
  step('3/13 pnpm deploy -> rt')
  if (existsSync(rtDir)) {
    console.log('cleaning old rt...')
    rmSync(rtDir, { recursive: true, force: true })
  }
  run('pnpm deploy', 'pnpm', ['--filter', '@deepseek-ai/dsh', 'deploy', '--legacy', '--config.node-linker=hoisted', rtDir], { cwd: REPO })

  // ---------- 2. patch runtime deps ----------
  step('4/13 patch-runtime (restore runtime-needed devDeps)')
  runNode('patch-runtime', join(here, 'patch-runtime.mjs'), [rtDir, REPO])

  // ---------- 3. ensure node + private package manager runtime ----------
  step('5/13 ensure node-runtime (copy core Node from system)')
  ensureNodeRuntime()

  // ---------- 4. marketplace ----------
  step('6/13 bundle plugin marketplace and private pnpm')
  runNode('bundle-marketplace', join(here, 'bundle-marketplace.mjs'), [rtDir, nodeRuntime])

  // ---------- 5. startup migrations ----------
  step('7/13 install runtime preparation scripts')
  mkdirSync(join(rtDir, 'scripts'), { recursive: true })
  copyFileSync(join(here, 'ensure-fallback.mjs'), join(rtDir, 'scripts', 'ensure-fallback.mjs'))
  copyFileSync(join(here, 'ensure-marketplace.mjs'), join(rtDir, 'scripts', 'ensure-marketplace.mjs'))

  // ---------- 6. trim maps/types/sources ----------
  step('8/13 trim-runtime (strip maps/d.ts/sources)')
  runNode('trim-runtime', join(here, 'trim-runtime.mjs'), [rtDir])

  // ---------- 7. prune orphan deps (back up the previous installer first) ----------
  step('9/13 prune-rt (remove runtime-unneeded orphan deps)')
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

  // ---------- 8. runtime smoke test ----------
  if (!SKIP_BOOT) {
    step('10/13 boot-test (runtime + marketplace smoke test)')
    const nodeExe = join(nodeRuntime, NODE_BIN)
    const testHome = join(PROJECT, `.dsh-boot-test-${stamp}`)
    runNode('boot-test', join(here, 'boot-test.mjs'), [nodeExe, rtDir, testHome])
    rmSync(testHome, { recursive: true, force: true })
  } else {
    console.log('skipping smoke test (--skip-boot-test)')
  }
}

if (PREPARE_ONLY) {
  console.log('\n================ RUNTIME PREPARED ================')
  console.log(`runtime : ${rtDir}`)
  console.log(`node    : ${nodeRuntime}`)
  process.exit(0)
}

// ---------- 9. build ----------
step('11/13 tauri build')
if (existsSync(bundleRoot)) {
  console.log(`cleaning stale bundle output: ${bundleRoot}`)
  rmSync(bundleRoot, { recursive: true, force: true })
}
if (process.platform === 'darwin') {
  // GitHub Actions exposes missing secrets as present-but-empty environment
  // variables. Tauri treats an empty APPLE_CERTIFICATE as configured and
  // attempts to import an empty p12, so remove blank optional values first.
  for (const name of [
    'APPLE_SIGNING_IDENTITY',
    'APPLE_CERTIFICATE',
    'APPLE_CERTIFICATE_PASSWORD',
    'APPLE_ID',
    'APPLE_PASSWORD',
    'APPLE_TEAM_ID',
  ]) {
    if (!process.env[name]?.trim()) delete process.env[name]
  }

  // A bare Apple Silicon executable only has the linker-generated signature.
  // Without a signing identity Tauri does not sign the completed .app bundle,
  // so Gatekeeper reports browser-downloaded DMGs as damaged. A configured
  // Developer ID identity still takes precedence; otherwise produce a complete
  // ad-hoc signature that users can explicitly allow in Privacy & Security.
  if (!process.env.APPLE_SIGNING_IDENTITY) {
    process.env.APPLE_SIGNING_IDENTITY = '-'
    console.log('macOS signing identity: ad hoc (set APPLE_SIGNING_IDENTITY for Developer ID)')
  }

  // Some cross-platform terminals export C.UTF-8, which macOS does not ship.
  // create-dmg invokes Perl while preparing the volume icon; Perl aborts on
  // that locale and leaves the read-write image mounted.  The portable C
  // locale is sufficient for the bundler and is guaranteed to exist.
  process.env.LC_ALL = 'C'
  process.env.LANG = 'C'
  delete process.env.LC_CTYPE
  // Tauri's CI mode passes --skip-jenkins to create-dmg. This avoids Finder
  // Apple-event automation, which is commonly denied for terminals and CI
  // runners; the Applications link and volume icon are still included.
  process.env.CI ||= 'true'
}
const BUNDLES = IS_WIN
  ? ['nsis']
  : process.platform === 'darwin'
    ? ['dmg', 'app']
    : ['deb', 'appimage']
console.log(`bundle targets: ${BUNDLES.join(', ')}`)
const buildArgs = ['build', '--bundles', ...BUNDLES]
if (NO_UPDATER) {
  buildArgs.push('--config', 'src-tauri/tauri.no-updater.conf.json')
  console.log('updater artifacts: disabled (--no-updater)')
}
if (process.env.TAURI_VERBOSE === '1') buildArgs.push('-v')
runTauri('tauri build', buildArgs)

// Current Tauri versions emit updater signatures for both AppImage and Debian
// bundles. Validate the Debian signature explicitly because the updater
// manifest exposes a separate `linux-<arch>-deb` target.
if (process.platform === 'linux' && !NO_UPDATER) {
  step('12/13 verify Debian updater signature')
  const debDir = join(PROJECT, 'src-tauri', 'target', 'release', 'bundle', 'deb')
  const debs = existsSync(debDir)
    ? readdirSync(debDir).filter((file) => file.endsWith('.deb')).map((file) => join(debDir, file))
    : []
  if (debs.length === 0) fail('Debian bundle not found for updater verification')
  for (const deb of debs) {
    if (!existsSync(`${deb}.sig`)) fail(`Debian updater signature not generated: ${deb}.sig`)
    console.log(`Debian updater signature: ${deb}.sig`)
  }
}

// ---------- report ----------
// Locate the produced distributable(s) for this platform.
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

if (process.platform === 'darwin') {
  const appBundle = artifacts.find((artifact) => artifact.endsWith('.app'))
  if (!appBundle) fail('macOS app bundle not found for signature verification')
  console.log(`verifying macOS app signature: ${appBundle}`)
  const verified = spawnSync(
    'codesign',
    ['--verify', '--deep', '--strict', '--verbose=2', appBundle],
    { stdio: 'inherit', shell: false },
  )
  if (verified.status !== 0) fail(`macOS app signature verification failed (exit ${verified.status})`)
}

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
