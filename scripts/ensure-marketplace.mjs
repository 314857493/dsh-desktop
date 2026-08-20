#!/usr/bin/env node
/**
 * First-run migration for the marketplace bundled by DSH Desktop.
 *
 * The marker lives inside the web profile. Once it exists, a missing market
 * bundle is treated as the user's uninstall choice and is never added back.
 * Deleting/resetting the whole profile also deletes the marker, so a newly
 * initialized profile receives the desktop defaults again.
 *
 * Usage: node ensure-marketplace.mjs <runtimeDir>
 * DSH_HOME selects the profile root.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const MARKETPLACE_PACKAGE = 'dshmarket'
export const MARKETPLACE_MARKER = '.dsh-desktop-marketplace.json'

function runtimeHome() {
  const configured = (process.env.DSH_HOME ?? '').trim()
  return configured === '' ? join(homedir(), '.dsh') : configured
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`)
  renameSync(temporary, path)
}

export async function ensureMarketplace(runtimeDir, dshHome = runtimeHome()) {
  const marketManifestPath = join(runtimeDir, 'node_modules', MARKETPLACE_PACKAGE, 'package.json')
  if (!existsSync(marketManifestPath)) {
    throw new Error(`bundled ${MARKETPLACE_PACKAGE} package is missing`)
  }
  const marketManifest = JSON.parse(readFileSync(marketManifestPath, 'utf8'))

  // Import from the selected runtime instead of this script's source tree, so
  // the migration works both after packaging and in isolated smoke tests.
  const appBootUrl = pathToFileURL(
    join(runtimeDir, 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js'),
  ).href
  const {
    PROFILE_TEMPLATES,
    initProfile,
    readProfileManifest,
    resolveProfileDir,
    writeProfileManifest,
  } = await import(appBootUrl)

  // resolveProfileDir reads DSH_HOME itself, while the optional argument makes
  // this function easy to exercise without mutating a developer's real home.
  const previousHome = process.env.DSH_HOME
  process.env.DSH_HOME = dshHome
  let profileDir
  try {
    profileDir = resolveProfileDir('web')
  } finally {
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
  }

  const profileManifestPath = join(profileDir, 'package.json')
  if (!existsSync(profileManifestPath)) {
    initProfile(profileDir, PROFILE_TEMPLATES.web)
  }

  const markerPath = join(profileDir, MARKETPLACE_MARKER)
  if (existsSync(markerPath)) {
    return { status: 'previouslyHandled', profileDir, version: marketManifest.version }
  }

  const profile = readProfileManifest('dsh-desktop', profileDir)
  profile.dsh ??= {}
  profile.dsh.profile ??= {}
  profile.dsh.profile.bundles ??= []
  const bundles = profile.dsh.profile.bundles
  const added = !bundles.includes(MARKETPLACE_PACKAGE)
  if (added) {
    bundles.push(MARKETPLACE_PACKAGE)
    writeProfileManifest(profileDir, profile)
  }

  writeJsonAtomic(markerPath, {
    schemaVersion: 1,
    package: MARKETPLACE_PACKAGE,
    version: marketManifest.version,
  })
  return { status: added ? 'installed' : 'alreadyInstalled', profileDir, version: marketManifest.version }
}

if (process.argv[1]?.endsWith('ensure-marketplace.mjs')) {
  const result = await ensureMarketplace(process.argv[2] ?? join(dirname(process.argv[1]), '..'))
  console.log(`ensure-marketplace: ${result.status} (${MARKETPLACE_PACKAGE}@${result.version})`)
}
