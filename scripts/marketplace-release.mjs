#!/usr/bin/env node

import { appendFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const MARKETPLACE_PACKAGE = 'dshmarket'
export const MARKETPLACE_TAG = 'latest'
export const MARKETPLACE_VERSION_ENV = 'DSH_DESKTOP_MARKETPLACE_VERSION'
export const MARKETPLACE_INTEGRITY_ENV = 'DSH_DESKTOP_MARKETPLACE_INTEGRITY'
export const MARKETPLACE_REGISTRY_ENV = 'DSH_DESKTOP_MARKETPLACE_REGISTRY'
export const DEFAULT_MARKETPLACE_REGISTRY = 'https://registry.npmjs.org'

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const INTEGRITY_PATTERN = /^sha512-[A-Za-z0-9+/]+={0,2}$/

function option(name) {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}

export function validateMarketplaceRelease(metadata) {
  if (metadata?.name !== MARKETPLACE_PACKAGE) {
    throw new Error(`unexpected marketplace package: ${metadata?.name ?? '(missing)'}`)
  }
  const version = typeof metadata.version === 'string' ? metadata.version.trim() : ''
  const integrity = typeof metadata.dist?.integrity === 'string' ? metadata.dist.integrity.trim() : ''
  if (!VERSION_PATTERN.test(version)) throw new Error(`invalid marketplace version: ${version || '(missing)'}`)
  if (!INTEGRITY_PATTERN.test(integrity)) throw new Error('invalid marketplace sha512 integrity')
  return { version, integrity }
}

export function configuredMarketplaceRelease(env = process.env) {
  const version = env[MARKETPLACE_VERSION_ENV]?.trim() ?? ''
  const integrity = env[MARKETPLACE_INTEGRITY_ENV]?.trim() ?? ''
  if (version === '' && integrity === '') return undefined
  if (version === '' || integrity === '') {
    throw new Error(`${MARKETPLACE_VERSION_ENV} and ${MARKETPLACE_INTEGRITY_ENV} must be set together`)
  }
  return validateMarketplaceRelease({
    name: MARKETPLACE_PACKAGE,
    version,
    dist: { integrity },
  })
}

export async function resolveMarketplaceRelease({ env = process.env, fetchImpl = fetch } = {}) {
  const registry = (env[MARKETPLACE_REGISTRY_ENV] ?? DEFAULT_MARKETPLACE_REGISTRY).replace(/\/+$/, '')
  const configured = configuredMarketplaceRelease(env)
  if (configured !== undefined) return { ...configured, registry }

  const url = `${registry}/${MARKETPLACE_PACKAGE}/${MARKETPLACE_TAG}`
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`marketplace metadata request failed: HTTP ${response.status}`)
  return { ...validateMarketplaceRelease(await response.json()), registry }
}

const invokedPath = process.argv[1] === undefined ? '' : fileURLToPath(import.meta.url)
if (invokedPath !== '' && realpathSync(process.argv[1]) === realpathSync(invokedPath)) {
  const release = await resolveMarketplaceRelease()
  const githubOutput = option('--github-output')
  if (githubOutput !== undefined) {
    appendFileSync(githubOutput, `marketplace_version=${release.version}\n`)
    appendFileSync(githubOutput, `marketplace_integrity=${release.integrity}\n`)
    appendFileSync(githubOutput, `marketplace_registry=${release.registry}\n`)
  }
  console.log(
    `marketplace release: ${MARKETPLACE_PACKAGE}@${release.version} ` +
    `(${release.integrity}, ${release.registry})`,
  )
}
