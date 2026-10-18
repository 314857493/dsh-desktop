import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { internalizeExternalRuntimeLinks } from './runtime-links.mjs'

const here = dirname(fileURLToPath(import.meta.url))

test('detached workspace imports are restored without copying source development dependencies', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'dsh-patch-runtime-'))
  const runtime = join(fixture, 'rt')
  const repo = join(fixture, 'source')
  const write = (path, text) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  try {
    const sourcePackage = join(repo, 'packages', 'consumer')
    write(join(sourcePackage, 'lib', 'index.js'), 'import "unused";\nexport { value } from "runtime-dep";\nconst label = {\n name: "not-a-plugin"\n};\n')
    write(join(sourcePackage, 'config', 'cordis.patch.yml'), 'name: yaml-plugin\n')
    write(join(sourcePackage, 'node_modules', 'development-only', 'index.js'), 'throw new Error("not shipped")')
    for (const name of ['runtime-dep', 'transitive-dep', 'yaml-plugin', 'not-a-plugin']) {
      write(join(repo, 'node_modules', name, 'package.json'), JSON.stringify({ name, main: 'index.js' }))
      write(join(repo, 'node_modules', name, 'index.js'), name === 'runtime-dep'
        ? 'module.exports = require("transitive-dep")'
        : 'module.exports = { value: 42 }')
    }
    const link = join(runtime, 'node_modules', '@deepseek-ai', 'consumer')
    mkdirSync(dirname(link), { recursive: true })
    symlinkSync(sourcePackage, link, process.platform === 'win32' ? 'junction' : 'dir')
    write(join(runtime, 'package.json'), '{}')
    internalizeExternalRuntimeLinks(runtime)
    const result = spawnSync(process.execPath, [join(here, 'patch-runtime.mjs'), runtime, repo], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    for (const name of ['runtime-dep', 'transitive-dep', 'yaml-plugin']) {
      assert.ok(existsSync(join(runtime, 'node_modules', name, 'index.js')), `${name} must be deployed`)
    }
    assert.equal(existsSync(join(runtime, 'node_modules', 'not-a-plugin')), false)
    assert.equal(existsSync(join(link, 'node_modules')), false)
    assert.equal(result.stdout.includes('round 25:'), false)
    rmSync(repo, { recursive: true, force: true })
    assert.match(readFileSync(join(runtime, 'node_modules', 'runtime-dep', 'index.js'), 'utf8'), /transitive-dep/)
    const loaded = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(require("runtime-dep").value))'], { cwd: runtime, encoding: 'utf8' })
    assert.equal(loaded.status, 0, loaded.stderr)
    assert.equal(loaded.stdout, '42')
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
