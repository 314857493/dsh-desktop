import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  applyReleaseMetadata,
  compareSemver,
  nextPatchVersion,
  selectNextRelease,
} from './release-metadata.mjs'

const scriptsDir = dirname(fileURLToPath(import.meta.url))

test('semantic version ordering handles upstream release candidates', () => {
  assert.ok(compareSemver('dsh-v0.1.0-rc.8', 'dsh-v0.1.0-rc.7') > 0)
  assert.ok(compareSemver('dsh-v0.1.0', 'dsh-v0.1.0-rc.8') > 0)
  assert.equal(nextPatchVersion('v0.1.8'), '0.1.9')
})

test('selectNextRelease processes one unseen release at a time', () => {
  const releases = [
    { tag_name: 'dsh-v0.1.0-rc.10', draft: false },
    { tag_name: 'dsh-v0.1.0-rc.8', draft: false },
    { tag_name: 'dsh-v0.1.0-rc.9', draft: false },
  ]
  assert.equal(selectNextRelease(releases, 'dsh-v0.1.0-rc.7').tag_name, 'dsh-v0.1.0-rc.8')
  assert.equal(selectNextRelease(releases, 'dsh-v0.1.0-rc.8').tag_name, 'dsh-v0.1.0-rc.9')
  assert.equal(selectNextRelease(releases, null).tag_name, 'dsh-v0.1.0-rc.10')
})

test('applyReleaseMetadata synchronizes versions and promotes Unreleased notes', () => {
  const project = mkdtempSync(join(tmpdir(), 'dsh-release-metadata-'))
  try {
    mkdirSync(join(project, 'src-tauri'), { recursive: true })
    writeFileSync(join(project, 'src-tauri', 'tauri.conf.json'), '{\n  "version": "0.1.8"\n}\n')
    writeFileSync(join(project, 'src-tauri', 'Cargo.toml'), '[package]\nname = "dsh-desktop"\nversion = "0.1.8"\n')
    writeFileSync(join(project, 'src-tauri', 'Cargo.lock'), '[[package]]\r\nname = "dsh-desktop"\r\nversion = "0.1.8"\r\n')
    writeFileSync(
      join(project, 'CHANGELOG.md'),
      '# Changelog\n\n## [Unreleased]\n\n### 桌面端\n\n- 自动发布。\n\n## [0.1.8]\n\n- 旧版本。\n\n[Unreleased]: https://example.test/compare/v0.1.8...HEAD\n',
    )
    applyReleaseMetadata(project, {
      date: '2026-08-20',
      desktop: {
        repository: 'owner/dsh-desktop',
        previousVersion: '0.1.8',
        version: '0.1.9',
        tag: 'v0.1.9',
      },
      upstream: {
        repository: 'deepseek-ai/deepseek-harness',
        previousTag: 'dsh-v0.1.0-rc.8',
        tag: 'dsh-v0.1.0-rc.9',
        commit: '1234567890abcdef1234567890abcdef12345678',
        releaseUrl: 'https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.9',
        publishedAt: '2026-08-20T00:00:00Z',
        body: '[中文] | [English]\n<h3 id="cn">新增功能</h3>\n\n- [说明](docs/feature.md)\n\n---\n\n### New features\n',
      },
    })

    assert.match(readFileSync(join(project, 'src-tauri', 'tauri.conf.json'), 'utf8'), /"0\.1\.9"/)
    assert.match(readFileSync(join(project, 'src-tauri', 'Cargo.toml'), 'utf8'), /version = "0\.1\.9"/)
    assert.match(readFileSync(join(project, 'src-tauri', 'Cargo.lock'), 'utf8'), /version = "0\.1\.9"/)
    const changelog = readFileSync(join(project, 'CHANGELOG.md'), 'utf8')
    assert.match(changelog, /## \[Unreleased\]\n\n## \[0\.1\.9\] - 2026-08-20/)
    assert.match(changelog, /## \[0\.1\.9\] - 2026-08-20\n\n### 桌面端\n\n- 自动发布。\n\n### 内置 DeepSeek Harness/)
    assert.match(changelog, /dsh-v0\.1\.0-rc\.8.*dsh-v0\.1\.0-rc\.9/)
    assert.match(changelog, /#### 新增功能/)
    assert.match(changelog, /github\.com\/deepseek-ai\/deepseek-harness\/blob\/dsh-v0\.1\.0-rc\.9\/docs\/feature\.md/)
    assert.match(changelog, /\[Unreleased\]: .*compare\/v0\.1\.9\.\.\.HEAD/)
    assert.match(changelog, /\[0\.1\.9\]: .*compare\/v0\.1\.8\.\.\.v0\.1\.9/)
    const state = JSON.parse(readFileSync(join(project, '.dsh-upstream.json'), 'utf8'))
    assert.equal(state.tag, 'dsh-v0.1.0-rc.9')
    assert.equal(state.managed, true)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})

test('release pipeline reads CI metadata from the environment before packaging', () => {
  const project = mkdtempSync(join(tmpdir(), 'dsh-release-stamp-'))
  try {
    mkdirSync(join(project, 'src-tauri'), { recursive: true })
    writeFileSync(join(project, 'src-tauri', 'tauri.conf.json'), '{\n  "version": "0.1.8"\n}\n')
    writeFileSync(join(project, 'src-tauri', 'Cargo.toml'), '[package]\nname = "dsh-desktop"\nversion = "0.1.8"\n')
    writeFileSync(join(project, 'src-tauri', 'Cargo.lock'), '[[package]]\r\nname = "dsh-desktop"\r\nversion = "0.1.8"\r\n')
    const result = spawnSync(process.execPath, [
      join(scriptsDir, 'release.mjs'),
      '--project', project,
      '--no-updater',
      '--remote-url', join(project, 'missing-upstream'),
    ], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DSH_DESKTOP_UPSTREAM_REF: 'dsh-v0.1.0-rc.8',
        DSH_DESKTOP_VERSION: 'v0.1.9',
      },
    })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, /无法解析远程引用 dsh-v0\.1\.0-rc\.8/)
    assert.equal(JSON.parse(readFileSync(join(project, 'src-tauri', 'tauri.conf.json'))).version, '0.1.9')
    assert.match(readFileSync(join(project, 'src-tauri', 'Cargo.toml'), 'utf8'), /^version = "0\.1\.9"$/m)
    assert.match(readFileSync(join(project, 'src-tauri', 'Cargo.lock'), 'utf8'), /version = "0\.1\.9"/)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
})
