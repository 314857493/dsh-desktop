import assert from 'node:assert/strict'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import {
  ensureMarketplace,
  MARKETPLACE_MARKER,
  MARKETPLACE_SCHEMA_VERSION,
  MARKETPLACE_SEED_OWNERSHIP,
} from './ensure-marketplace.mjs'

const SEED_VERSION = '1.2.3'
const DEFAULT_BUNDLES = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function createFixture(t, { structuredProfileTemplate = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dsh-desktop-marketplace-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const runtime = join(root, 'rt')
  const home = join(root, 'home')
  const profileDir = join(home, 'profiles', 'web')
  const seedPackage = join(runtime, 'marketplace-seed', 'node_modules', 'dshmarket')

  writeJson(join(runtime, 'marketplace-seed', 'manifest.json'), {
    schemaVersion: 1,
    package: 'dshmarket',
    requested: 'latest',
    version: SEED_VERSION,
  })
  writeJson(join(seedPackage, 'package.json'), {
    name: 'dshmarket',
    version: SEED_VERSION,
    dsh: { bundle: { patch: 'cordis.patch.yml' } },
  })
  writeFileSync(join(seedPackage, 'cordis.patch.yml'), '- insert: []\n')
  writeFileSync(join(seedPackage, 'seed.txt'), 'bundled seed\n')

  const appBootDir = join(runtime, 'node_modules', '@deepseek-ai', 'dsh-app-boot')
  writeJson(join(appBootDir, 'package.json'), { type: 'module' })
  mkdirSync(join(appBootDir, 'lib'), { recursive: true })
  const webProfileTemplate = structuredProfileTemplate
    ? `{ bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'], patchReload: 'live' }`
    : `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`
  writeFileSync(join(appBootDir, 'lib', 'index.js'), `
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
export const PROFILE_TEMPLATES = {
  web: ${webProfileTemplate},
}
export function resolveProfileDir(name, home) { return join(home, 'profiles', name) }
export function initProfile(dir, bundles, patchReload) {
  mkdirSync(dir, { recursive: true })
  const manifest = join(dir, 'package.json')
  if (!existsSync(manifest)) writeFileSync(manifest, JSON.stringify({
    name: 'dsh-profile-' + basename(dir),
    private: true,
    dependencies: {},
    dsh: { profile: {
      bundles: [...bundles],
      ...(patchReload === undefined ? {} : { patchReload }),
    } },
  }, null, 2) + '\\n')
  const patch = join(dir, 'cordis.patch.yml')
  if (!existsSync(patch)) writeFileSync(patch, '# user patches\\n[]\\n')
}
export function readProfileManifest(_binName, dir) {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
}
export function writeProfileManifest(dir, profile) {
  writeFileSync(join(dir, 'package.json'), JSON.stringify(profile, null, 2) + '\\n')
}
export function loadOverlayPatches(_binName, file) {
  const lines = readFileSync(file, 'utf8').split(/\\r?\\n/)
    .map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
  if (lines.length === 0 || (lines[0] === '[]' && lines.length !== 1)) {
    throw new Error('invalid top-level patch array')
  }
  if (lines[0] !== '[]' && !lines[0].startsWith('- ')) {
    throw new Error('invalid top-level patch array')
  }
  return []
}
`)

  return { home, profileDir, runtime }
}

function profileManifest(profileDir) {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'))
}

function initializeProfile(profileDir, { dependencies = {}, marketplaceBundle = false } = {}) {
  const bundles = [...DEFAULT_BUNDLES]
  if (marketplaceBundle) bundles.push('dshmarket')
  writeJson(join(profileDir, 'package.json'), {
    name: 'dsh-profile-web',
    private: true,
    dependencies,
    dsh: { profile: { bundles } },
  })
  writeFileSync(join(profileDir, 'cordis.patch.yml'), '[]\n')
}

function writeInstalledMarketplace(profileDir, version) {
  const installed = join(profileDir, 'node_modules', 'dshmarket')
  writeJson(join(installed, 'package.json'), {
    name: 'dshmarket',
    version,
    dsh: { bundle: { patch: 'cordis.patch.yml' } },
  })
  writeFileSync(join(installed, 'cordis.patch.yml'), '- insert: []\n')
  return installed
}

test('fresh profile receives an exact profile-managed marketplace and restart policy', async (t) => {
  const fixture = createFixture(t)
  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'installed')
  const profile = profileManifest(fixture.profileDir)
  assert.equal(profile.dependencies.dshmarket, SEED_VERSION)
  assert.ok(profile.dsh.profile.bundles.includes('dshmarket'))
  assert.equal(
    readFileSync(join(fixture.profileDir, 'node_modules', 'dshmarket', 'seed.txt'), 'utf8'),
    'bundled seed\n',
  )
  const ownership = JSON.parse(readFileSync(
    join(fixture.profileDir, 'node_modules', 'dshmarket', MARKETPLACE_SEED_OWNERSHIP),
    'utf8',
  ))
  assert.equal(ownership.version, SEED_VERSION)
  const patch = readFileSync(join(fixture.profileDir, 'cordis.patch.yml'), 'utf8')
  assert.match(patch, /id: dsh-market/)
  assert.match(patch, /allowRestart: false/)
  const marker = JSON.parse(readFileSync(join(fixture.profileDir, MARKETPLACE_MARKER), 'utf8'))
  assert.equal(marker.schemaVersion, MARKETPLACE_SCHEMA_VERSION)
})

test('fresh profile accepts structured runtime templates and preserves their reload policy', async (t) => {
  const fixture = createFixture(t, { structuredProfileTemplate: true })
  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'installed')
  const profile = profileManifest(fixture.profileDir)
  assert.deepEqual(profile.dsh.profile.bundles, [...DEFAULT_BUNDLES, 'dshmarket'])
  assert.equal(profile.dsh.profile.patchReload, 'live')
})

test('a marketplace removed after schema 2 is not installed again', async (t) => {
  const fixture = createFixture(t)
  await ensureMarketplace(fixture.runtime, fixture.home)
  const profile = profileManifest(fixture.profileDir)
  delete profile.dependencies.dshmarket
  profile.dsh.profile.bundles = profile.dsh.profile.bundles.filter((name) => name !== 'dshmarket')
  writeJson(join(fixture.profileDir, 'package.json'), profile)

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'previouslyRemoved')
  const after = profileManifest(fixture.profileDir)
  assert.equal(after.dependencies.dshmarket, undefined)
  assert.ok(!after.dsh.profile.bundles.includes('dshmarket'))
  assert.ok(!existsSync(join(fixture.profileDir, 'node_modules', 'dshmarket')))
  assert.equal(readFileSync(join(fixture.profileDir, 'cordis.patch.yml'), 'utf8'), '[]\n')
})

test('schema 1 runtime-mounted marketplace migrates into the profile', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, { marketplaceBundle: true })
  writeJson(join(fixture.profileDir, MARKETPLACE_MARKER), {
    schemaVersion: 1,
    package: 'dshmarket',
    version: '1.0.0',
  })

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'migrated')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, SEED_VERSION)
  assert.ok(existsSync(join(fixture.profileDir, 'node_modules', 'dshmarket', 'package.json')))
})

test('schema 1 marker preserves an earlier uninstall', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir)
  writeJson(join(fixture.profileDir, MARKETPLACE_MARKER), {
    schemaVersion: 1,
    package: 'dshmarket',
    version: '1.0.0',
  })

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'previouslyRemoved')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, undefined)
  assert.ok(!profileManifest(fixture.profileDir).dsh.profile.bundles.includes('dshmarket'))
})

test('an existing profile-managed marketplace version is never overwritten', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '9.9.9-beta.1' },
    marketplaceBundle: true,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '9.9.9-beta.1')
  writeFileSync(join(installed, 'user-version.txt'), 'keep me\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'alreadyInstalled')
  assert.equal(result.version, '9.9.9-beta.1')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, '9.9.9-beta.1')
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'keep me\n')
})

test('an older registry version is refreshed when its declared range allows the seed', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '^1.0.0' },
    marketplaceBundle: true,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '1.0.0')
  writeFileSync(join(installed, 'obsolete.txt'), 'old registry package\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'updated')
  assert.equal(result.version, SEED_VERSION)
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, '^1.0.0')
  assert.ok(!existsSync(join(installed, 'obsolete.txt')))
  assert.equal(readFileSync(join(installed, 'seed.txt'), 'utf8'), 'bundled seed\n')
})

test('an exact older registry version is preserved as an explicit user selection', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '1.0.0' },
    marketplaceBundle: true,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '1.0.0')
  writeFileSync(join(installed, 'user-version.txt'), 'keep exact version\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'alreadyInstalled')
  assert.equal(result.version, '1.0.0')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, '1.0.0')
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'keep exact version\n')
})

test('an older desktop-owned seed is refreshed after the bundled runtime updates', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '1.0.0' },
    marketplaceBundle: true,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '1.0.0')
  writeJson(join(installed, MARKETPLACE_SEED_OWNERSHIP), {
    schemaVersion: 1,
    package: 'dshmarket',
    version: '1.0.0',
  })
  writeFileSync(join(installed, 'obsolete.txt'), 'old desktop seed\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'updated')
  assert.equal(result.version, SEED_VERSION)
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, SEED_VERSION)
  assert.ok(!existsSync(join(installed, 'obsolete.txt')))
  assert.equal(readFileSync(join(installed, 'seed.txt'), 'utf8'), 'bundled seed\n')
  const ownership = JSON.parse(readFileSync(
    join(installed, MARKETPLACE_SEED_OWNERSHIP),
    'utf8',
  ))
  assert.equal(ownership.version, SEED_VERSION)
})

test('a newer user-selected range package is never downgraded to the bundled seed', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '^1.0.0' },
    marketplaceBundle: true,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '1.3.0')
  writeJson(join(installed, MARKETPLACE_SEED_OWNERSHIP), {
    schemaVersion: 1,
    package: 'dshmarket',
    version: '1.3.0',
  })
  writeFileSync(join(installed, 'user-version.txt'), 'keep me\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)

  assert.equal(result.status, 'alreadyInstalled')
  assert.equal(result.version, '1.3.0')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, '^1.0.0')
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'keep me\n')
})

test('an active package with a missing dependency entry is re-registered without overwrite', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, { marketplaceBundle: true })
  writeJson(join(fixture.profileDir, MARKETPLACE_MARKER), {
    schemaVersion: MARKETPLACE_SCHEMA_VERSION,
    package: 'dshmarket',
    seededVersion: SEED_VERSION,
  })
  const installed = writeInstalledMarketplace(fixture.profileDir, '9.9.9-beta.1')
  writeFileSync(join(installed, 'user-version.txt'), 'keep me\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'repaired')
  assert.equal(result.version, '9.9.9-beta.1')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, '9.9.9-beta.1')
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'keep me\n')
})

test('a missing package at the seeded version is repaired without changing its spec', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: SEED_VERSION },
    marketplaceBundle: true,
  })

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'repaired')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, SEED_VERSION)
  assert.ok(existsSync(join(fixture.profileDir, 'node_modules', 'dshmarket', 'package.json')))
})

test('a missing user-selected version is suspended and restored without seed downgrade', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '9.9.9-beta.1' },
    marketplaceBundle: true,
  })

  const suspended = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(suspended.status, 'suspended')
  let profile = profileManifest(fixture.profileDir)
  assert.equal(profile.dependencies.dshmarket, '9.9.9-beta.1')
  assert.ok(!profile.dsh.profile.bundles.includes('dshmarket'))
  assert.equal(readFileSync(join(fixture.profileDir, 'cordis.patch.yml'), 'utf8'), '[]\n')
  let marker = JSON.parse(readFileSync(join(fixture.profileDir, MARKETPLACE_MARKER), 'utf8'))
  assert.equal(marker.suspended.reason, 'missing-package')
  assert.equal(marker.suspended.dependencySpec, '9.9.9-beta.1')

  const installed = writeInstalledMarketplace(fixture.profileDir, '9.9.9-beta.1')
  writeFileSync(join(installed, 'user-version.txt'), 'restored package\n')

  const restored = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(restored.status, 'repaired')
  assert.equal(restored.version, '9.9.9-beta.1')
  profile = profileManifest(fixture.profileDir)
  assert.equal(profile.dependencies.dshmarket, '9.9.9-beta.1')
  assert.ok(profile.dsh.profile.bundles.includes('dshmarket'))
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'restored package\n')
  marker = JSON.parse(readFileSync(join(fixture.profileDir, MARKETPLACE_MARKER), 'utf8'))
  assert.equal(marker.suspended, undefined)
})

test('an incomplete user-selected bundle is suspended without overwriting its files', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir, {
    dependencies: { dshmarket: '9.9.9-beta.1' },
    marketplaceBundle: true,
  })
  const installed = join(fixture.profileDir, 'node_modules', 'dshmarket')
  writeJson(join(installed, 'package.json'), {
    name: 'dshmarket',
    version: '9.9.9-beta.1',
    dsh: { bundle: { patch: 'missing.patch.yml' } },
  })
  writeFileSync(join(installed, 'user-version.txt'), 'keep incomplete package\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'suspended')
  const profile = profileManifest(fixture.profileDir)
  assert.equal(profile.dependencies.dshmarket, '9.9.9-beta.1')
  assert.ok(!profile.dsh.profile.bundles.includes('dshmarket'))
  assert.equal(readFileSync(join(installed, 'user-version.txt'), 'utf8'), 'keep incomplete package\n')
})

test('a stale desktop seed cannot satisfy a different user-selected version', async (t) => {
  const fixture = createFixture(t)
  await ensureMarketplace(fixture.runtime, fixture.home)
  const profile = profileManifest(fixture.profileDir)
  profile.dependencies.dshmarket = '^9.9.9'
  writeJson(join(fixture.profileDir, 'package.json'), profile)

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'suspended')
  const after = profileManifest(fixture.profileDir)
  assert.equal(after.dependencies.dshmarket, '^9.9.9')
  assert.ok(!after.dsh.profile.bundles.includes('dshmarket'))
  assert.ok(existsSync(join(fixture.profileDir, 'node_modules', 'dshmarket', 'seed.txt')))
})

test('a stale desktop seed cannot stand in for a user-selected source checkout', async (t) => {
  const fixture = createFixture(t)
  await ensureMarketplace(fixture.runtime, fixture.home)
  const profile = profileManifest(fixture.profileDir)
  profile.dependencies.dshmarket = 'github:dsh-market/dsh-market#beta'
  writeJson(join(fixture.profileDir, 'package.json'), profile)

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'suspended')
  const after = profileManifest(fixture.profileDir)
  assert.equal(after.dependencies.dshmarket, 'github:dsh-market/dsh-market#beta')
  assert.ok(!after.dsh.profile.bundles.includes('dshmarket'))
  assert.ok(existsSync(join(fixture.profileDir, 'node_modules', 'dshmarket', 'seed.txt')))
})

test('an invalid marker preserves a previously removed marketplace', async (t) => {
  const fixture = createFixture(t)
  initializeProfile(fixture.profileDir)
  writeFileSync(join(fixture.profileDir, MARKETPLACE_MARKER), '{invalid json\n')

  const result = await ensureMarketplace(fixture.runtime, fixture.home)
  assert.equal(result.status, 'previouslyRemoved')
  assert.equal(profileManifest(fixture.profileDir).dependencies.dshmarket, undefined)
  assert.ok(!profileManifest(fixture.profileDir).dsh.profile.bundles.includes('dshmarket'))
})
