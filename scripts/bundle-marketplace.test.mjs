import assert from 'node:assert/strict'
import test from 'node:test'
import {
  lockfileHasExpectedIntegrities,
  MARKETPLACE_SPEC,
  PNPM_INTEGRITY,
} from './bundle-marketplace.mjs'

test('marketplace seed follows the latest release channel', () => {
  assert.equal(MARKETPLACE_SPEC, 'latest')
})

test('staging lockfile must contain resolved marketplace and pinned pnpm integrities', () => {
  const marketplaceIntegrity = 'sha512-YWJjZA=='
  assert.equal(
    lockfileHasExpectedIntegrities(`
resolution: {integrity: ${marketplaceIntegrity}}
resolution: {integrity: ${PNPM_INTEGRITY}}
`, marketplaceIntegrity),
    true,
  )
  assert.equal(
    lockfileHasExpectedIntegrities(`resolution: {integrity: ${marketplaceIntegrity}}`, marketplaceIntegrity),
    false,
  )
})
