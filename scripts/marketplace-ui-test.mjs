#!/usr/bin/env node
// Exercise the packaged marketplace's client, including recovery after an
// interrupted profile update. Playwright lives in disposable CI tooling, not
// in the shipped runtime. Usage: node marketplace-ui-test.mjs <node> <rt> <playwright/index.mjs>
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, delimiter } from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { ensureMarketplace } from './ensure-marketplace.mjs'

const [node, runtimeArg, playwrightPath] = process.argv.slice(2)
if (!node || !runtimeArg || !playwrightPath) {
  throw new Error('usage: marketplace-ui-test.mjs <node> <runtime> <playwright/index.mjs>')
}
const runtime = resolve(runtimeArg)
const nodeExecutable = resolve(node)
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href)
const home = mkdtempSync(join(tmpdir(), 'dsh-marketplace-ui-'))
let server
let browser
let startup = ''
const redact = (text) => text.replace(/token=[^\s]+/g, 'token=[redacted]')
try {
  const initial = await ensureMarketplace(runtime, home)
  const packageDir = join(initial.profileDir, 'node_modules', 'dshmarket')
  const manifest = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  const clientExport = manifest.exports?.['./client']
  const client = typeof clientExport === 'string' ? clientExport : clientExport?.default
  assert.equal(typeof client, 'string', 'marketplace must export a client bundle')
  // A damaged old desktop copy still has its independent ownership record.
  // It must upgrade even when package.json can no longer identify its version.
  const profileManifestPath = join(initial.profileDir, 'package.json')
  const oldProfile = JSON.parse(readFileSync(profileManifestPath, 'utf8'))
  oldProfile.dependencies.dshmarket = '1.0.0'
  writeFileSync(profileManifestPath, JSON.stringify(oldProfile))
  writeFileSync(join(packageDir, '.dsh-desktop-seed.json'), JSON.stringify({
    schemaVersion: 1, package: 'dshmarket', version: '1.0.0',
  }))
  rmSync(join(packageDir, 'package.json'))
  assert.equal((await ensureMarketplace(runtime, home)).status, 'updated')
  assert.equal(JSON.parse(readFileSync(profileManifestPath, 'utf8')).dependencies.dshmarket, initial.version)
  // Keep the backend and manifest intact: this is the case an HTTP-only smoke
  // test misses. The same preparation the desktop uses must restore the UI.
  rmSync(join(packageDir, client))
  assert.equal((await ensureMarketplace(runtime, home)).status, 'repaired')

  // A client file alone is insufficient. Older/incomplete package metadata
  // can omit its declaration, leaving the host alive but no client row.
  const damagedManifest = structuredClone(manifest)
  delete damagedManifest.dsh.client
  delete damagedManifest.exports['./client']
  writeFileSync(join(packageDir, 'package.json'), JSON.stringify(damagedManifest))
  assert.equal((await ensureMarketplace(runtime, home)).status, 'repaired')
  const restored = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  assert.deepEqual(restored.dsh.client, manifest.dsh.client)
  assert.deepEqual(restored.exports['./client'], clientExport)

  // A patch path can exist while composing no marketplace entry at all.
  writeFileSync(join(packageDir, manifest.dsh.bundle.patch), '')
  assert.equal((await ensureMarketplace(runtime, home)).status, 'repaired')

  const ready = new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('DSH startup timed out')), 60000)
    server = spawn(nodeExecutable, [join(runtime, 'lib', 'bin.js'), 'web', '--no-open', '--host', '127.0.0.1', '--port', '0'], {
      cwd: runtime,
      env: {
        ...process.env,
        DSH_HOME: home,
        DSH_TELEMETRY_DISABLED: '1',
        PATH: `${dirname(nodeExecutable)}${delimiter}${process.env.PATH ?? ''}`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    server.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
      startup += chunk.toString()
      const url = stdout.match(/dsh web:\s+(http:\/\/[^\r\n]+)/)?.[1]
      if (url) { clearTimeout(timer); resolveReady(url.trim()) }
    })
    server.stderr.on('data', (chunk) => { startup += chunk.toString() })
    server.once('error', (error) => { clearTimeout(timer); reject(error) })
    server.once('exit', (code) => { clearTimeout(timer); reject(new Error(`DSH exited before UI test (code ${code})`)) })
  })
  const url = await ready
  browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ locale: 'zh-CN' })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  // This fresh, keyless profile must complete both first-run steps. Their
  // settings data loads asynchronously; a short optional wait can miss them
  // and leave the blocking modal over Settings on a slower CI runner.
  await page.getByRole('button', { name: /^(继续|Continue)$/ }).click({ timeout: 60000 })
  await page.getByRole('button', { name: /^(稍后配置|Configure later)$/ }).click({ timeout: 60000 })
  await page.getByRole('button', { name: /^(设置|Settings)$/ }).click()
  await page.getByRole('button', { name: /^(插件市场|Plugin Market)$/ }).click({ timeout: 20000 })
  await page.getByRole('heading', { name: /^(插件市场|Plugin Market)$/ }).waitFor()
  // The Discover tab belongs to the mounted market panel. Do not depend on the remote
  // registry being online or install a plugin just to verify the entry.
  await page.getByRole('button', { name: /^(发现|Discover)$/ }).waitFor({ timeout: 20000 })
  assert.deepEqual(errors, [], 'marketplace page must render without uncaught client errors')
  console.log(`[MARKETPLACE UI] dshmarket@${initial.version}: damaged old seed upgraded; missing client, missing declaration, and empty patch repaired; settings entry and panel rendered`)
} catch (error) {
  console.error(redact(startup.slice(-4000)))
  throw new Error(redact(String(error)))
} finally {
  await browser?.close()
  if (server && server.exitCode === null) {
    const exited = new Promise((resolveExit) => server.once('exit', resolveExit))
    server.kill('SIGTERM')
    await exited
  }
  rmSync(home, { recursive: true, force: true })
}
