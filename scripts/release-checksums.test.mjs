import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  collectPublishedReleaseAssets,
  isPublishedReleaseAsset,
  writeReleaseChecksums,
} from './release-checksums.mjs'

test('release checksum filter matches only uploaded asset shapes', () => {
  assert.equal(isPublishedReleaseAsset('DSH.Desktop_1.0.0_x64-setup.exe'), true)
  assert.equal(isPublishedReleaseAsset('DSH.Desktop_1.0.0_amd64.AppImage.sig'), true)
  assert.equal(isPublishedReleaseAsset('latest.json'), true)
  assert.equal(isPublishedReleaseAsset('rw.25373.DSH Desktop_0.1.0_aarch64.dmg'), false)
  assert.equal(isPublishedReleaseAsset('updater-fragment-Linux.json'), false)
  assert.equal(isPublishedReleaseAsset('internal-debug.log'), false)
})

test('checksums use release basenames and ignore internal bundle files', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-checksums-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'nested'), { recursive: true })
  writeFileSync(join(root, 'nested', 'DSH.Desktop_1.0.0_amd64.deb'), 'deb')
  writeFileSync(join(root, 'latest.json'), '{}')
  writeFileSync(join(root, 'nested', 'ignored.txt'), 'ignore me')

  const output = join(root, 'SHA256SUMS')
  assert.equal(await writeReleaseChecksums(root, output), 2)
  const lines = readFileSync(output, 'utf8').trim().split('\n')
  assert.equal(lines.length, 2)
  assert(lines.some((line) => line.endsWith('  DSH.Desktop_1.0.0_amd64.deb')))
  assert(lines.some((line) => line.endsWith('  latest.json')))
  assert(lines.every((line) => !line.includes('nested/')))
})

test('duplicate uploaded basenames are rejected', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-checksums-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'one'))
  mkdirSync(join(root, 'two'))
  writeFileSync(join(root, 'one', 'latest.json'), '{}')
  writeFileSync(join(root, 'two', 'latest.json'), '{}')
  assert.throws(() => collectPublishedReleaseAssets(root), /duplicate published asset name/)
})
