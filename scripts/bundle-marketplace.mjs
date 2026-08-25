#!/usr/bin/env node
/**
 * Add a community plugin market seed and a private pnpm CLI to a deployed DSH
 * Desktop runtime. The seed is copied into the user's web profile on first
 * launch, where DSH can update or uninstall it like any other plugin.
 *
 * The release pipeline intentionally does this after `pnpm deploy`: changing
 * the upstream checkout would dirty a caller-owned `--local` repository, and
 * installing inside the deployed package cannot resolve its remaining
 * `workspace:` dependency specs. A tiny isolated staging project avoids both.
 *
 * Install scripts are disabled. Both packages are registry releases that ship
 * their runtime artifacts prebuilt; no downloaded code needs to execute while
 * the desktop installer is being assembled.
 *
 * Usage: node bundle-marketplace.mjs <runtimeDir> <nodeRuntimeDir>
 */
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  MARKETPLACE_PACKAGE,
  MARKETPLACE_TAG,
  resolveMarketplaceRelease,
} from './marketplace-release.mjs'

export { MARKETPLACE_PACKAGE }
export const MARKETPLACE_SPEC = MARKETPLACE_TAG
export const MARKETPLACE_SEED_DIR = 'marketplace-seed'
export const PNPM_VERSION = '11.23.0'
export const PNPM_INTEGRITY = 'sha512-8ACC5bKDoZm3Tgedoo0VXACP4jL0TIoG6n3foBTs9xn8Ni95DsxnsoEG3awq+yTEmpoHkVnaVgss59Hpjv0Rrw=='

function fail(message) {
  throw new Error(`bundle-marketplace: ${message}`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function packagePath(root, name) {
  return join(root, ...name.split('/'))
}

/** Copy one staged package, following pnpm's top-level symlink to real files. */
function copyPackage(sourceModules, targetModules, name) {
  const source = packagePath(sourceModules, name)
  if (!existsSync(join(source, 'package.json'))) {
    fail(`staged package is missing: ${name}`)
  }
  const target = packagePath(targetModules, name)
  mkdirSync(dirname(target), { recursive: true })
  rmSync(target, { recursive: true, force: true })
  cpSync(realpathSync(source), target, { recursive: true, dereference: true })
  return target
}

/**
 * Vendor a dependency closure below its owner. Keeping market dependencies
 * nested prevents a future DSH dependency with an incompatible version from
 * being overwritten at the runtime root.
 */
function copyNestedClosure(sourceModules, ownerDir, roots) {
  const targetModules = join(ownerDir, 'node_modules')
  const pending = [...roots]
  const copied = new Set()
  while (pending.length > 0) {
    const name = pending.shift()
    if (copied.has(name)) continue
    const target = copyPackage(sourceModules, targetModules, name)
    copied.add(name)
    const manifest = readJson(join(target, 'package.json'))
    for (const dependency of Object.keys({
      ...(manifest.dependencies ?? {}),
      ...(manifest.optionalDependencies ?? {}),
    })) {
      if (!copied.has(dependency)) pending.push(dependency)
    }
  }
  return [...copied]
}

function installStage(stage, marketplaceRelease) {
  writeFileSync(join(stage, 'package.json'), `${JSON.stringify({
    private: true,
    dependencies: {
      [MARKETPLACE_PACKAGE]: marketplaceRelease.version,
      pnpm: PNPM_VERSION,
    },
  }, null, 2)}\n`)

  const result = spawnSync('pnpm', [
    'install',
    '--dir', stage,
    '--prod',
    '--ignore-scripts',
    `--registry=${marketplaceRelease.registry}`,
    '--config.auto-install-peers=false',
    '--config.node-linker=hoisted',
    '--config.minimum-release-age=0',
  ], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error !== undefined) fail(`could not start pnpm: ${result.error.message}`)
  if (result.status !== 0) fail(`staging install failed (exit ${result.status ?? 1})`)

  const lockfile = readFileSync(join(stage, 'pnpm-lock.yaml'), 'utf8')
  if (!lockfileHasExpectedIntegrities(lockfile, marketplaceRelease.integrity)) {
    fail('integrity mismatch for resolved marketplace or pinned pnpm package')
  }
}

export function lockfileHasExpectedIntegrities(lockfile, marketplaceIntegrity) {
  return lockfile.includes(`integrity: ${marketplaceIntegrity}`) &&
    lockfile.includes(`integrity: ${PNPM_INTEGRITY}`)
}

function removeLegacyInstalledMarketplace(runtimeDir) {
  rmSync(join(runtimeDir, 'node_modules', MARKETPLACE_PACKAGE), {
    recursive: true,
    force: true,
  })

  const runtimeManifestPath = join(runtimeDir, 'package.json')
  const runtimeManifest = readJson(runtimeManifestPath)
  if (runtimeManifest.dependencies?.[MARKETPLACE_PACKAGE] !== undefined) {
    delete runtimeManifest.dependencies[MARKETPLACE_PACKAGE]
    writeFileSync(runtimeManifestPath, `${JSON.stringify(runtimeManifest, null, 2)}\n`)
  }
}

function installMarketplace(stageModules, runtimeDir, marketplaceRelease) {
  removeLegacyInstalledMarketplace(runtimeDir)

  const seedDir = join(runtimeDir, MARKETPLACE_SEED_DIR)
  rmSync(seedDir, { recursive: true, force: true })
  const seedModules = join(seedDir, 'node_modules')
  const marketDir = copyPackage(stageModules, seedModules, MARKETPLACE_PACKAGE)
  const manifest = readJson(join(marketDir, 'package.json'))
  const resolvedVersion = manifest.version
  if (typeof resolvedVersion !== 'string' || resolvedVersion.trim() === '') {
    fail(`resolved ${MARKETPLACE_PACKAGE} package has no version`)
  }
  if (resolvedVersion !== marketplaceRelease.version) {
    fail(`resolved ${MARKETPLACE_PACKAGE}@${resolvedVersion}, expected ${marketplaceRelease.version}`)
  }
  const nested = copyNestedClosure(
    stageModules,
    marketDir,
    Object.keys({
      ...(manifest.dependencies ?? {}),
      ...(manifest.optionalDependencies ?? {}),
    }),
  )

  writeFileSync(join(seedDir, 'manifest.json'), `${JSON.stringify({
    schemaVersion: 1,
    package: MARKETPLACE_PACKAGE,
    requested: MARKETPLACE_SPEC,
    version: resolvedVersion,
    integrity: marketplaceRelease.integrity,
    registry: marketplaceRelease.registry,
  }, null, 2)}\n`)
  return { marketDir, nested, resolvedVersion }
}

function installPnpm(stageModules, nodeRuntimeDir) {
  const modules = join(nodeRuntimeDir, 'node_modules')
  copyPackage(stageModules, modules, 'pnpm')

  if (process.platform === 'win32') {
    writeFileSync(
      join(nodeRuntimeDir, 'pnpm.cmd'),
      '@ECHO OFF\r\n"%~dp0node.exe" "%~dp0node_modules\\pnpm\\bin\\pnpm.mjs" %*\r\n',
    )
    writeFileSync(
      join(nodeRuntimeDir, 'pnpx.cmd'),
      '@ECHO OFF\r\n"%~dp0node.exe" "%~dp0node_modules\\pnpm\\bin\\pnpx.mjs" %*\r\n',
    )
    return
  }

  for (const [command, entry] of [['pnpm', 'pnpm.mjs'], ['pnpx', 'pnpx.mjs']]) {
    const path = join(nodeRuntimeDir, command)
    writeFileSync(
      path,
      `#!/bin/sh\nexec "$(dirname "$0")/node" "$(dirname "$0")/node_modules/pnpm/bin/${entry}" "$@"\n`,
    )
    chmodSync(path, 0o755)
  }
}

export async function bundleMarketplace(runtimeDir, nodeRuntimeDir) {
  if (!existsSync(join(runtimeDir, 'package.json'))) {
    fail(`DSH runtime is missing: ${runtimeDir}`)
  }
  if (!existsSync(join(nodeRuntimeDir, process.platform === 'win32' ? 'node.exe' : 'node'))) {
    fail(`Node runtime is missing: ${nodeRuntimeDir}`)
  }

  const stage = mkdtempSync(join(tmpdir(), 'dsh-desktop-marketplace-'))
  try {
    const marketplaceRelease = await resolveMarketplaceRelease()
    installStage(stage, marketplaceRelease)
    const stageModules = join(stage, 'node_modules')
    const market = installMarketplace(stageModules, runtimeDir, marketplaceRelease)
    installPnpm(stageModules, nodeRuntimeDir)
    console.log(
      `bundle-marketplace: ${MARKETPLACE_PACKAGE}@${market.resolvedVersion} ` +
      `(resolved once from ${MARKETPLACE_SPEC}); ` +
      `pnpm@${PNPM_VERSION}; nested deps: ${market.nested.join(', ') || '(none)'}`,
    )
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

const invokedPath = process.argv[1] === undefined ? '' : fileURLToPath(import.meta.url)
if (invokedPath !== '' && realpathSync(process.argv[1]) === realpathSync(invokedPath)) {
  const here = dirname(fileURLToPath(import.meta.url))
  const project = join(here, '..')
  await bundleMarketplace(
    process.argv[2] ?? join(project, 'rt'),
    process.argv[3] ?? join(project, 'node-runtime'),
  )
}
