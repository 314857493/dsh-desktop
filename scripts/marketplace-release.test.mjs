import assert from 'node:assert/strict'
import test from 'node:test'

import {
  configuredMarketplaceRelease,
  MARKETPLACE_INTEGRITY_ENV,
  MARKETPLACE_REGISTRY_ENV,
  MARKETPLACE_VERSION_ENV,
  resolveMarketplaceRelease,
  validateMarketplaceRelease,
} from './marketplace-release.mjs'

const release = {
  name: 'dshmarket',
  version: '9.8.7',
  dist: { integrity: 'sha512-YWJjZA==' },
}

test('marketplace release metadata requires an exact version and sha512 integrity', () => {
  assert.deepEqual(validateMarketplaceRelease(release), {
    version: '9.8.7',
    integrity: 'sha512-YWJjZA==',
  })
  assert.throws(() => validateMarketplaceRelease({ ...release, name: 'other' }), /unexpected marketplace package/)
  assert.throws(() => validateMarketplaceRelease({ ...release, version: 'latest' }), /invalid marketplace version/)
  assert.throws(() => validateMarketplaceRelease({ ...release, dist: { integrity: 'sha1-old' } }), /sha512/)
})

test('marketplace release overrides must provide version and integrity together', () => {
  assert.equal(configuredMarketplaceRelease({}), undefined)
  assert.throws(
    () => configuredMarketplaceRelease({ [MARKETPLACE_VERSION_ENV]: '9.8.7' }),
    /must be set together/,
  )
  assert.deepEqual(configuredMarketplaceRelease({
    [MARKETPLACE_VERSION_ENV]: '9.8.7',
    [MARKETPLACE_INTEGRITY_ENV]: 'sha512-YWJjZA==',
  }), {
    version: '9.8.7',
    integrity: 'sha512-YWJjZA==',
  })
})

test('marketplace latest is resolved once from registry metadata', async () => {
  let requested
  const resolved = await resolveMarketplaceRelease({
    env: { [MARKETPLACE_REGISTRY_ENV]: 'https://registry.example.test/' },
    fetchImpl: async (url) => {
      requested = url
      return { ok: true, json: async () => release }
    },
  })
  assert.equal(requested, 'https://registry.example.test/dshmarket/latest')
  assert.equal(resolved.version, '9.8.7')
  assert.equal(resolved.registry, 'https://registry.example.test')
})

test('marketplace registry failures stop the release', async () => {
  await assert.rejects(
    resolveMarketplaceRelease({
      env: {},
      fetchImpl: async () => ({ ok: false, status: 503 }),
    }),
    /HTTP 503/,
  )
})
