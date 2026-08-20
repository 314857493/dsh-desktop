// End-to-end check of the desktop app's `settings.openDocument` path:
// start the SAME bundled runtime the app ships, with a throwaway DSH_HOME,
// then POST the exact RPC the "打开配置文件" button sends.
// Uses file-descriptor stdio (not pipes) so it also runs under sandboxes.
//
// Usage: TEST_NODE=<node.exe> TEST_BIN=<dsh/lib/bin.js> [TEST_PORT=<port>] \
//        node scripts/test-open-document.mjs

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const NODE = process.env.TEST_NODE
const BIN = process.env.TEST_BIN
if (!NODE || !BIN) {
  console.error('missing TEST_NODE (path to node.exe) or TEST_BIN (path to dsh/lib/bin.js)')
  process.exit(2)
}
const PORT = Number(process.env.TEST_PORT ?? 18765)
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-open-test-'))
const LOG = path.join(HOME, 'server.log')

console.log('node =', NODE)
console.log('bin  =', BIN)
console.log('home =', HOME)

const out = fs.openSync(LOG, 'w')
const child = spawn(NODE, [BIN, 'web', '--host', '127.0.0.1', '--port', String(PORT), '--no-open'], {
  env: { ...process.env, DSH_HOME: HOME, CI: '1' },
  stdio: ['ignore', out, out],
  windowsHide: true,
})

const base = `http://127.0.0.1:${PORT}`
const deadline = Date.now() + 60000

async function waitReady() {
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/session.list`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: 'session.list', payload: {} }),
      })
      if (res.ok) return true
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function main() {
  const ready = await waitReady()
  if (!ready) {
    console.log('SERVER NEVER BECAME READY; log tail:')
    console.log(fs.readFileSync(LOG, 'utf8').split('\n').slice(-30).join('\n'))
    child.kill()
    process.exit(1)
  }
  console.log('server ready on', base)

  const rpcId = randomUUID()
  const res = await fetch(`${base}/api/settings.openDocument`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId, method: 'settings.openDocument', payload: {} }),
  })
  const text = await res.text()
  console.log('HTTP', res.status)
  console.log(text)

  // Report where the settings document lives, for manual inspection.
  const homeList = fs.readdirSync(HOME, { recursive: true })
  const docs = homeList.filter(e => /settings\.(ya?ml|json)$/.test(String(e)))
  console.log('settings docs under home:', docs)

  child.kill()
  setTimeout(() => process.exit(0), 500)
}

main().catch(err => { console.error(err); child.kill(); process.exit(1) })
