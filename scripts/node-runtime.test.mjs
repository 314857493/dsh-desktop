import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { prepareNodeRuntime } from './node-runtime.mjs'

const NODE_BIN = process.platform === 'win32' ? 'node.exe' : 'node'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-node-runtime-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = join(root, 'active node')
  const destination = join(root, 'node-runtime')
  mkdirSync(source)
  copyFileSync(process.execPath, join(source, NODE_BIN))
  return { root, source, destination }
}

test('bundled Node runs with the build Node version, ABI and architecture', (t) => {
  const { source, destination } = fixture(t)
  prepareNodeRuntime(destination, join(source, NODE_BIN))
  const result = spawnSync(join(destination, NODE_BIN), ['-p',
    'JSON.stringify([process.version, process.versions.modules, process.arch])'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  assert.deepEqual(JSON.parse(result.stdout), [process.version, process.versions.modules, process.arch])
})

test('preparation replaces an old runtime and its package manager files', (t) => {
  const { source, destination } = fixture(t)
  mkdirSync(join(destination, 'node_modules', 'npm'), { recursive: true })
  writeFileSync(join(destination, NODE_BIN), 'old Node with incompatible ABI')
  writeFileSync(join(destination, 'node_modules', 'npm', 'obsolete.js'), 'old npm')
  for (const name of ['npm', 'corepack', 'unrelated-global']) {
    mkdirSync(join(source, 'node_modules', name), { recursive: true })
    writeFileSync(join(source, 'node_modules', name, 'package.json'), JSON.stringify({ name }))
  }
  prepareNodeRuntime(destination, join(source, NODE_BIN))
  assert.deepEqual(readFileSync(join(destination, NODE_BIN)), readFileSync(join(source, NODE_BIN)))
  assert.equal(existsSync(join(destination, 'node_modules', 'npm', 'obsolete.js')), false)
  assert.equal(existsSync(join(destination, 'node_modules', 'npm', 'package.json')), true)
  assert.equal(existsSync(join(destination, 'node_modules', 'corepack', 'package.json')), true)
  assert.equal(existsSync(join(destination, 'node_modules', 'unrelated-global')), false)
})

test('active Node is resolved through a directory shim', (t) => {
  const { root, source, destination } = fixture(t)
  const shim = join(root, 'shim')
  symlinkSync(source, shim, process.platform === 'win32' ? 'junction' : 'dir')
  prepareNodeRuntime(destination, join(shim, NODE_BIN))
  assert.deepEqual(readFileSync(join(destination, NODE_BIN)), readFileSync(join(source, NODE_BIN)))
})

test('preparation cannot delete the active Node installation', (t) => {
  const { source } = fixture(t)
  assert.throws(() => prepareNodeRuntime(source, join(source, NODE_BIN)), /must not contain/)
  assert.equal(existsSync(join(source, NODE_BIN)), true)
})

test('preparation rejects a runtime directory linked to another installation', (t) => {
  const { root, source, destination } = fixture(t)
  const other = join(root, 'other-node')
  mkdirSync(other)
  writeFileSync(join(other, NODE_BIN), 'other Node')
  symlinkSync(other, destination, process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => prepareNodeRuntime(destination, join(source, NODE_BIN)), /symbolic link/)
  assert.equal(readFileSync(join(other, NODE_BIN), 'utf8'), 'other Node')
})
