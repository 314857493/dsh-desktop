// Boot-test a DSH runtime: spawns `node <runtime>/lib/bin.js web --port 0`,
// waits for the readiness line or a crash, prints the first N lines.
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const node = process.argv[2] ?? process.execPath
const runtime = process.argv[3] ?? join(here, '..', 'rt')
const home = process.argv[4] ?? join(here, '..', '.dsh-boot-test')
const timeoutMs = Number(process.argv[5] ?? 60000)

const child = spawn(node, [runtime + '/lib/bin.js', 'web', '--host', '127.0.0.1', '--port', '0'], {
  cwd: runtime,
  env: { ...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let out = ''
const seen = new Set()
const timer = setTimeout(() => {
  console.log(`\n[TIMEOUT after ${timeoutMs}ms — no ready line]`)
  console.log('--- last output ---')
  console.log(out.slice(-4000))
  child.kill('SIGTERM')
  process.exit(2)
}, timeoutMs)

function onData(chunk, label) {
  const text = chunk.toString()
  out += `${label} ${text}`
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    if (!seen.has(line)) {
      seen.add(line)
      console.log(`[${label}] ${line}`)
      if (line.includes('dsh web: http')) {
        clearTimeout(timer)
        console.log('\n[READY] ' + line.trim())
        child.kill('SIGTERM')
        setTimeout(() => process.exit(0), 1500)
      }
    }
  }
}

child.stdout.on('data', (c) => onData(c, 'out'))
child.stderr.on('data', (c) => onData(c, 'err'))
child.on('exit', (code, signal) => {
  if (code !== 0 && signal !== 'SIGTERM') {
    console.log(`\n[EXITED code=${code} signal=${signal}]`)
    console.log('--- last output ---')
    console.log(out.slice(-4000))
    process.exit(1)
  }
})
