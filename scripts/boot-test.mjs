// Boot-test a DSH runtime: spawns `node <runtime>/lib/bin.js web --port 0`
// with the desktop-owned prompt overlay, adding `--no-open` when supported,
// waits for the readiness line or a crash, prints the first N lines.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { authenticatedWebFetch } from './boot-test-auth.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const node = process.argv[2] ?? process.execPath
const runtime = process.argv[3] ?? join(here, '..', 'rt')
const home = process.argv[4] ?? join(here, '..', '.dsh-boot-test')
const timeoutMs = Number(process.argv[5] ?? 60000)

// Exercise the same host-plane prompt plugin the native shell embeds. The
// overlay contains an absolute file URL because profile patches resolve
// relative names from the profile directory, and Windows ESM imports reject
// raw drive-letter paths.
mkdirSync(home, { recursive: true })
const desktopContextPlugin = join(here, '..', 'src-tauri', 'resources', 'dsh-desktop-context.mjs')
const desktopContextOverlay = join(home, 'dsh-desktop-context.patch.json')
writeFileSync(desktopContextOverlay, JSON.stringify([{
  insert: [{ id: 'dsh-desktop-context', name: pathToFileURL(desktopContextPlugin).href }],
}], null, 2))

// Exercise the same first-run migration as the native shell. This catches a
// missing/trimmed marketplace package before an installer is published.
const bundledMarketplaceMigration = join(runtime, 'scripts', 'ensure-marketplace.mjs')
const sourceMarketplaceMigration = join(here, 'ensure-marketplace.mjs')
const marketplaceMigration = existsSync(bundledMarketplaceMigration)
  ? bundledMarketplaceMigration
  : existsSync(join(runtime, 'marketplace-seed', 'node_modules', 'dshmarket', 'package.json'))
    ? sourceMarketplaceMigration
    : bundledMarketplaceMigration
if (existsSync(marketplaceMigration)) {
  const prepared = spawnSync(node, [marketplaceMigration, runtime], {
    cwd: runtime,
    env: { ...process.env, DSH_HOME: home },
    stdio: 'inherit',
  })
  if (prepared.status !== 0) {
    console.error(`marketplace preparation failed (exit ${prepared.status ?? 1})`)
    process.exit(1)
  }
}

const startup = join(runtime, 'node_modules', '@deepseek-ai', 'dsh-web-app', 'lib', 'startup.js')
const supportsNoOpen = existsSync(startup) && readFileSync(startup, 'utf8').includes('--no-open')
const serverArgs = [
  runtime + '/lib/bin.js',
  'web',
  '--patch', desktopContextOverlay,
  '--host', '127.0.0.1',
  '--port', '0',
]
if (supportsNoOpen) serverArgs.push('--no-open')

const child = spawn(node, serverArgs, {
  cwd: runtime,
  env: { ...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let out = ''
const seen = new Set()
let finishing = false
const timer = setTimeout(() => {
  console.log(`\n[TIMEOUT after ${timeoutMs}ms — no ready line]`)
  console.log('--- last output ---')
  console.log(out.slice(-4000))
  child.kill('SIGTERM')
  process.exit(2)
}, timeoutMs)

async function finishReady(line) {
  if (finishing) return
  finishing = true
  clearTimeout(timer)
  console.log('\n[READY] ' + line.trim())
  if (existsSync(marketplaceMigration)) {
    const url = line.slice(line.indexOf('http')).trim()
    try {
      const response = await authenticatedWebFetch(url, '/dsh-market/status', {
        signal: AbortSignal.timeout(Math.min(timeoutMs, 10000)),
      })
      const status = await response.json()
      if (
        !response.ok ||
        status.version === undefined ||
        status.pnpm !== true ||
        status.restart !== false ||
        !Object.prototype.hasOwnProperty.call(status.installed ?? {}, 'dshmarket')
      ) {
        throw new Error(`unexpected status ${response.status}: ${JSON.stringify(status).slice(0, 500)}`)
      }
      console.log(`[MARKETPLACE] dshmarket@${status.version}; profile-managed; private pnpm ready`)
    } catch (error) {
      console.error(`[MARKETPLACE ERROR] ${error instanceof Error ? error.message : String(error)}`)
      child.kill('SIGTERM')
      setTimeout(() => process.exit(1), 500)
      return
    }
  }
  child.kill('SIGTERM')
  setTimeout(() => process.exit(0), 1500)
}

function onData(chunk, label) {
  const text = chunk.toString()
  out += `${label} ${text}`
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    if (!seen.has(line)) {
      seen.add(line)
      console.log(`[${label}] ${line}`)
      if (line.includes('dsh web: http')) {
        void finishReady(line)
      }
    }
  }
}

child.stdout.on('data', (c) => onData(c, 'out'))
child.stderr.on('data', (c) => onData(c, 'err'))
child.on('error', (error) => {
  clearTimeout(timer)
  console.error(`\n[SPAWN ERROR] ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM') {
    console.log(`\n[EXITED code=${code} signal=${signal}]`)
    console.log('--- last output ---')
    console.log(out.slice(-4000))
    process.exit(1)
  }
})
