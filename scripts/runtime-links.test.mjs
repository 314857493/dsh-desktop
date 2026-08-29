import assert from 'node:assert/strict'
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { internalizeExternalRuntimeLinks, validateRuntimeLinks } from './runtime-links.mjs'

const directoryLinkType = process.platform === 'win32' ? 'junction' : 'dir'

test('prepared runtime materializes links into the source checkout', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'dsh-runtime-links-'))
  try {
    const runtime = join(fixture, 'rt')
    const externalPackage = join(fixture, 'source', 'vendor', 'schemastery')
    const externalDependency = join(fixture, 'source', 'vendor', 'cosmokit')
    const packageLink = join(runtime, 'node_modules', '@deepseek-ai', 'schemastery')
    const externalNestedLink = join(externalPackage, 'node_modules', '@deepseek-ai', 'cosmokit')
    const nestedLink = join(packageLink, 'node_modules', '@deepseek-ai', 'cosmokit')
    const internalTarget = join(runtime, 'store', 'internal-package')
    const internalLink = join(runtime, 'node_modules', 'internal-package')

    mkdirSync(join(externalPackage, 'lib'), { recursive: true })
    writeFileSync(join(externalPackage, 'package.json'), '{"name":"@deepseek-ai/schemastery"}')
    writeFileSync(join(externalPackage, 'lib', 'index.js'), 'export const schema = true\n')
    mkdirSync(externalDependency, { recursive: true })
    writeFileSync(join(externalDependency, 'package.json'), '{"name":"@deepseek-ai/cosmokit"}')
    mkdirSync(join(externalNestedLink, '..'), { recursive: true })
    symlinkSync(externalDependency, externalNestedLink, directoryLinkType)
    mkdirSync(join(packageLink, '..'), { recursive: true })
    symlinkSync(externalPackage, packageLink, directoryLinkType)

    mkdirSync(internalTarget, { recursive: true })
    writeFileSync(join(internalTarget, 'package.json'), '{"name":"internal-package"}')
    symlinkSync(internalTarget, internalLink, directoryLinkType)

    const materialized = internalizeExternalRuntimeLinks(runtime)

    assert.ok(materialized.includes(join('node_modules', '@deepseek-ai', 'schemastery')))
    assert.equal(lstatSync(packageLink).isSymbolicLink(), false)
    assert.equal(readFileSync(join(packageLink, 'lib', 'index.js'), 'utf8'), 'export const schema = true\n')
    assert.equal(lstatSync(nestedLink).isSymbolicLink(), false)
    assert.equal(lstatSync(internalLink).isSymbolicLink(), true)
    validateRuntimeLinks(runtime)
  } finally {
    rmSync(fixture, { recursive: true, force: true })
  }
})
