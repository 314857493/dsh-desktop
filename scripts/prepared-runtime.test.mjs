import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { movePreparedRuntime, validatePreparedRuntime } from './prepared-runtime.mjs'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-prepared-runtime-'))
  const source = join(root, 'prepared-runtime')
  mkdirSync(join(source, 'rt'), { recursive: true })
  mkdirSync(join(source, 'node-runtime'), { recursive: true })
  writeFileSync(join(source, 'prepared-runtime.tar.gz'), 'archive')
  return { root, source }
}

test('prepared runtime accepts only the two expected directories', () => {
  const { root, source } = fixture()
  try {
    validatePreparedRuntime(source)
    mkdirSync(join(source, 'unexpected'))
    assert.throws(() => validatePreparedRuntime(source), /unexpected prepared-runtime entries/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('prepared runtime moves validated directories without replacing destinations', () => {
  const { root, source } = fixture()
  try {
    mkdirSync(join(root, 'rt'))
    assert.throws(() => movePreparedRuntime(source, root), /destination already exists/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('prepared runtime source must stay inside the destination workspace', () => {
  const { root, source } = fixture()
  try {
    assert.throws(() => movePreparedRuntime(source, join(root, 'nested')), /must be inside/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
