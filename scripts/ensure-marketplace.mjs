#!/usr/bin/env node
/**
 * Install the marketplace seed into DSH Desktop's web profile.
 *
 * The runtime copy is only an offline seed. The active package belongs to the
 * profile, so DSH and dshmarket can update or uninstall it normally. A schema
 * marker prevents a later desktop launch from undoing an explicit uninstall.
 *
 * Usage: node ensure-marketplace.mjs <runtimeDir>
 * DSH_HOME selects the profile root.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const MARKETPLACE_PACKAGE = 'dshmarket'
export const MARKETPLACE_MARKER = '.dsh-desktop-marketplace.json'
export const MARKETPLACE_SCHEMA_VERSION = 2
export const MARKETPLACE_SEED_DIR = 'marketplace-seed'
export const MARKETPLACE_SEED_OWNERSHIP = '.dsh-desktop-seed.json'

const MANAGED_POLICY_START = '# >>> DSH Desktop managed marketplace policy'
const MANAGED_POLICY_END = '# <<< DSH Desktop managed marketplace policy'
const MANAGED_POLICY = `${MANAGED_POLICY_START}
- id: dsh-market
  config:
    allowRestart: false
${MANAGED_POLICY_END}`

function runtimeHome() {
  const configured = (process.env.DSH_HOME ?? '').trim()
  return configured === '' ? join(homedir(), '.dsh') : configured
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`)
  renameSync(temporary, path)
}

function readMarker(path) {
  if (!existsSync(path)) return undefined
  try {
    const marker = readJson(path)
    if (typeof marker === 'object' && marker !== null) return marker
  } catch {
    // A marker is bookkeeping, not a reason to make the whole profile
    // unbootable. Still treat its presence as "previously handled" so a
    // damaged marker cannot silently reverse an explicit uninstall.
  }
  console.warn(`ensure-marketplace: ignoring invalid marker ${path}`)
  return { schemaVersion: MARKETPLACE_SCHEMA_VERSION }
}

function parseVersion(value) {
  const match = /^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value)
  if (match === null) return undefined
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4],
  }
}

function compareVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1
  }
  if (left.prerelease === right.prerelease) return 0
  if (left.prerelease === undefined) return 1
  if (right.prerelease === undefined) return -1
  const leftIdentifiers = left.prerelease.split('.')
  const rightIdentifiers = right.prerelease.split('.')
  const length = Math.max(leftIdentifiers.length, rightIdentifiers.length)
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = leftIdentifiers[index]
    const rightIdentifier = rightIdentifiers[index]
    if (leftIdentifier === rightIdentifier) continue
    if (leftIdentifier === undefined) return -1
    if (rightIdentifier === undefined) return 1

    const leftIsNumeric = /^\d+$/.test(leftIdentifier)
    const rightIsNumeric = /^\d+$/.test(rightIdentifier)
    if (leftIsNumeric && rightIsNumeric) {
      const leftNumber = BigInt(leftIdentifier)
      const rightNumber = BigInt(rightIdentifier)
      if (leftNumber !== rightNumber) return leftNumber < rightNumber ? -1 : 1
      continue
    }
    if (leftIsNumeric) return -1
    if (rightIsNumeric) return 1
    return leftIdentifier < rightIdentifier ? -1 : 1
  }
  return 0
}

// Return true/false only for the common exact, caret, and tilde registry
// specs we can judge without consulting the network. Unknown specs remain
// undefined; they must never authorize replacing a user-selected package.
function simpleSpecAllowsVersion(spec, version) {
  if (typeof spec !== 'string') return undefined
  let candidate = spec.trim()
  const aliasPrefix = `npm:${MARKETPLACE_PACKAGE}@`
  if (candidate.startsWith(aliasPrefix)) candidate = candidate.slice(aliasPrefix.length)
  const match = /^(?<operator>[~^]?)(?<version>v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.exec(candidate)
  const installed = parseVersion(version)
  const lower = match?.groups?.version === undefined
    ? undefined
    : parseVersion(match.groups.version)
  if (installed === undefined || lower === undefined) return undefined

  const comparison = compareVersions(installed, lower)
  if (match.groups.operator === '') return comparison === 0
  // npm ranges exclude prereleases unless a comparator in the same set also
  // names a prerelease with the exact same major/minor/patch tuple. Without
  // this guard, for example, ^1.2.3 would incorrectly authorize 1.3.0-beta.1.
  if (installed.prerelease !== undefined && (
    lower.prerelease === undefined ||
    installed.major !== lower.major ||
    installed.minor !== lower.minor ||
    installed.patch !== lower.patch
  )) return false
  if (comparison < 0) return false
  if (match.groups.operator === '~') {
    return installed.major === lower.major && installed.minor === lower.minor
  }
  if (lower.major > 0) return installed.major === lower.major
  if (lower.minor > 0) {
    return installed.major === 0 && installed.minor === lower.minor
  }
  return installed.major === 0 && installed.minor === 0 && installed.patch === lower.patch
}

function seedMatchesSpec(seed, spec) {
  const simple = simpleSpecAllowsVersion(spec, seed.version)
  if (simple !== undefined) return simple
  if (typeof spec !== 'string') return false
  const candidate = spec.trim()
  if (candidate === '*') return parseVersion(seed.version)?.prerelease === undefined
  return candidate === seed.requested
}

function seedIsNewerThanInstalled(seed, installedPackage) {
  const bundled = parseVersion(seed.version)
  const installed = parseVersion(installedPackage?.version)
  return bundled !== undefined && installed !== undefined &&
    compareVersions(bundled, installed) > 0
}

function isOwnedSeedPackage(profileDir, installedPackage) {
  if (installedPackage === undefined) return false
  const ownershipPath = join(
    profileDir,
    'node_modules',
    MARKETPLACE_PACKAGE,
    MARKETPLACE_SEED_OWNERSHIP,
  )
  if (!existsSync(ownershipPath)) return false
  try {
    const ownership = readJson(ownershipPath)
    return ownership?.schemaVersion === 1 &&
      ownership?.package === MARKETPLACE_PACKAGE &&
      typeof ownership?.version === 'string' &&
      installedPackage.version === ownership.version
  } catch {
    return false
  }
}

function isUsableBundlePackage(packageDir, manifest) {
  const patch = manifest?.dsh?.bundle?.patch
  return manifest?.name === MARKETPLACE_PACKAGE &&
    typeof manifest?.version === 'string' &&
    manifest.version !== '' &&
    typeof patch === 'string' &&
    patch !== '' &&
    existsSync(join(packageDir, patch))
}

function copySeedPackage(seedPackageDir, profileDir, seedVersion) {
  const profileModules = join(profileDir, 'node_modules')
  const target = join(profileModules, MARKETPLACE_PACKAGE)
  const temporary = join(profileModules, `.${MARKETPLACE_PACKAGE}.tmp-${process.pid}`)
  mkdirSync(profileModules, { recursive: true })
  rmSync(temporary, { recursive: true, force: true })
  try {
    cpSync(seedPackageDir, temporary, { recursive: true, dereference: true })
    rmSync(target, { recursive: true, force: true })
    renameSync(temporary, target)
    writeJsonAtomic(join(target, MARKETPLACE_SEED_OWNERSHIP), {
      schemaVersion: 1,
      package: MARKETPLACE_PACKAGE,
      version: seedVersion,
    })
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}

function removeOwnedSeedResidue(profileDir) {
  const target = join(profileDir, 'node_modules', MARKETPLACE_PACKAGE)
  const ownershipPath = join(target, MARKETPLACE_SEED_OWNERSHIP)
  const packageManifestPath = join(target, 'package.json')
  if (!existsSync(ownershipPath)) return false

  let ownership
  try {
    ownership = readJson(ownershipPath)
  } catch {
    return false
  }
  if (
    ownership?.schemaVersion !== 1 ||
    ownership?.package !== MARKETPLACE_PACKAGE ||
    typeof ownership?.version !== 'string'
  ) {
    return false
  }
  if (existsSync(packageManifestPath)) {
    let manifest
    try {
      manifest = readJson(packageManifestPath)
    } catch {
      return false
    }
    if (manifest?.name !== MARKETPLACE_PACKAGE || manifest?.version !== ownership.version) return false
  }
  rmSync(target, { recursive: true, force: true })
  return true
}

function withoutManagedPolicy(content) {
  const start = content.indexOf(MANAGED_POLICY_START)
  if (start === -1) return content
  const end = content.indexOf(MANAGED_POLICY_END, start)
  if (end === -1) return content
  const after = end + MANAGED_POLICY_END.length
  return `${content.slice(0, start)}${content.slice(after).replace(/^\r?\n/, '')}`
}

function meaningfulLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
}

function renderManagedPolicy(content, enabled) {
  let base = withoutManagedPolicy(content).trimEnd()
  const meaningful = meaningfulLines(base)

  if (!enabled) {
    return meaningful.length === 0 ? '[]\n' : `${base}\n`
  }

  // The initialized profile contains an empty top-level array. Remove only
  // that placeholder before appending the managed array entry.
  if (meaningful.length === 1 && meaningful[0] === '[]') {
    base = base
      .split(/\r?\n/)
      .filter((line) => line.trim() !== '[]')
      .join('\n')
      .trimEnd()
  }
  return `${base === '' ? '' : `${base}\n`}${MANAGED_POLICY}\n`
}

function writePolicyAtomic(profileDir, enabled, loadOverlayPatches) {
  const patchPath = join(profileDir, 'cordis.patch.yml')
  const current = existsSync(patchPath) ? readFileSync(patchPath, 'utf8') : '[]\n'
  const candidate = renderManagedPolicy(current, enabled)
  if (candidate === current) return false

  const temporary = `${patchPath}.tmp-${process.pid}.yml`
  writeFileSync(temporary, candidate)
  try {
    loadOverlayPatches('dsh-desktop', temporary)
    renameSync(temporary, patchPath)
  } finally {
    rmSync(temporary, { force: true })
  }
  return true
}

export async function ensureMarketplace(runtimeDir, dshHome = runtimeHome()) {
  const seedDir = join(runtimeDir, MARKETPLACE_SEED_DIR)
  const seedManifestPath = join(seedDir, 'manifest.json')
  const seedPackageDir = join(seedDir, 'node_modules', MARKETPLACE_PACKAGE)
  const seedPackageManifestPath = join(seedPackageDir, 'package.json')
  if (!existsSync(seedManifestPath) || !existsSync(seedPackageManifestPath)) {
    throw new Error(`bundled ${MARKETPLACE_PACKAGE} seed is missing`)
  }
  const seed = readJson(seedManifestPath)
  const marketManifest = readJson(seedPackageManifestPath)
  if (
    seed.package !== MARKETPLACE_PACKAGE ||
    typeof seed.version !== 'string' ||
    seed.version === '' ||
    !isUsableBundlePackage(seedPackageDir, marketManifest) ||
    marketManifest.version !== seed.version
  ) {
    throw new Error(`bundled ${MARKETPLACE_PACKAGE} seed manifest is inconsistent`)
  }

  // Import from the selected runtime instead of this script's source tree, so
  // the migration works both after packaging and in isolated smoke tests.
  const appBootUrl = pathToFileURL(
    join(runtimeDir, 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js'),
  ).href
  const {
    PROFILE_TEMPLATES,
    initProfile,
    loadOverlayPatches,
    readProfileManifest,
    resolveProfileDir,
    writeProfileManifest,
  } = await import(appBootUrl)

  const profileDir = resolveProfileDir('web', dshHome)
  const profileManifestPath = join(profileDir, 'package.json')
  if (!existsSync(profileManifestPath)) {
    const template = PROFILE_TEMPLATES.web
    const bundles = Array.isArray(template) ? template : template?.bundles
    if (!Array.isArray(bundles) || !bundles.every((bundle) => typeof bundle === 'string')) {
      throw new Error('runtime web profile template has no valid bundle list')
    }
    // DSH <= 0.1.1 exports profile templates as bundle arrays. Newer
    // runtimes also carry the patch-reload policy beside the bundle list.
    // initProfile keeps the same positional bundle argument in both APIs;
    // pass the optional policy through so the generated profile matches the
    // selected runtime instead of coupling this migration to either shape.
    initProfile(profileDir, bundles, Array.isArray(template) ? undefined : template.patchReload)
  }

  const markerPath = join(profileDir, MARKETPLACE_MARKER)
  const marker = readMarker(markerPath)
  const markerSchema = Number(marker?.schemaVersion ?? 0)
  const profile = readProfileManifest('dsh-desktop', profileDir)
  profile.dependencies ??= {}
  profile.dsh ??= {}
  profile.dsh.profile ??= {}
  profile.dsh.profile.bundles ??= []
  const bundles = profile.dsh.profile.bundles
  const hasBundle = bundles.includes(MARKETPLACE_PACKAGE)
  const hasDependency = Object.prototype.hasOwnProperty.call(
    profile.dependencies,
    MARKETPLACE_PACKAGE,
  )
  const activeManifestPath = join(profileDir, 'node_modules', MARKETPLACE_PACKAGE, 'package.json')
  const dependencySpec = profile.dependencies[MARKETPLACE_PACKAGE]
  let installedPackage
  if (existsSync(activeManifestPath)) {
    try {
      const candidate = readJson(activeManifestPath)
      if (isUsableBundlePackage(dirname(activeManifestPath), candidate)) {
        installedPackage = candidate
      }
    } catch {
      // An invalid package is treated like a missing one below. The seed can
      // repair its own exact version; a user-selected version is quarantined.
    }
  }
  const seedMatchesDependency = seedMatchesSpec(seed, dependencySpec)
  const installedIsOwnedSeed = isOwnedSeedPackage(profileDir, installedPackage)
  // installSeed writes an exact dependency. If both that exact spec and the
  // ownership record still point at an older bundled copy, no user-managed
  // selection has replaced it: refresh it with the seed shipped alongside
  // the new core runtime. Comparing ownership only with the *current* seed
  // made every old desktop seed look user-managed after an app update, which
  // could leave an incompatible plugin in the boot-critical bundle list.
  const installedIsStaleSeed = installedIsOwnedSeed &&
    installedPackage.version !== seed.version &&
    dependencySpec === installedPackage.version
  // A package-manager update replaces the marketplace directory and drops
  // the desktop ownership marker. The dependency range still records what
  // the user authorized, though: when the bundled seed is newer and remains
  // inside that range, refreshing and pinning it is the same resolution the
  // declared spec permits. Pinning also prevents a later pnpm command from
  // replaying an older lockfile resolution. Exact versions, newer installed
  // versions, and git/file/unknown selections remain untouched.
  const installedAllowsNewerSeed = installedPackage !== undefined &&
    seedMatchesDependency &&
    seedIsNewerThanInstalled(seed, installedPackage)
  // The previous range-refresh migration copied the current seed and wrote an
  // ownership marker but preserved the old dependency range. Recognize that
  // completed physical state so this migration can finish pinning the profile
  // without copying over the package a second time.
  const installedSeedNeedsPin = installedIsOwnedSeed &&
    installedPackage.version === seed.version &&
    seedMatchesDependency &&
    dependencySpec !== seed.version
  const installedPackageUsable = installedPackage !== undefined && (
    !installedIsOwnedSeed || seedMatchesDependency
  )

  let status = 'unchanged'
  let bundleEnabled = hasBundle
  let profileChanged = false
  let suspension = marker?.suspended?.reason === 'missing-package'
    ? marker.suspended
    : undefined

  const pinInstalledSeed = (nextStatus) => {
    // Pin the profile to the desktop-owned copy. Keeping an older range here
    // lets an otherwise unrelated pnpm command replay its stale lockfile
    // resolution and silently replace the compatible seed with the old
    // marketplace version again.
    profile.dependencies[MARKETPLACE_PACKAGE] = seed.version
    if (!hasBundle) bundles.push(MARKETPLACE_PACKAGE)
    profileChanged = true
    bundleEnabled = true
    suspension = undefined
    status = nextStatus
  }

  const installSeed = (nextStatus) => {
    copySeedPackage(seedPackageDir, profileDir, seed.version)
    pinInstalledSeed(nextStatus)
  }

  if (suspension !== undefined && hasDependency && !hasBundle) {
    if (installedSeedNeedsPin) {
      pinInstalledSeed('repaired')
    } else if (installedAllowsNewerSeed) {
      installSeed('updated')
    } else if (installedPackageUsable) {
      bundles.push(MARKETPLACE_PACKAGE)
      profileChanged = true
      bundleEnabled = true
      suspension = undefined
      status = 'repaired'
    } else {
      status = 'suspended'
    }
  } else if (!hasBundle && !hasDependency && markerSchema === 0) {
    installSeed('installed')
  } else if (hasBundle && !hasDependency) {
    if (installedPackage !== undefined) {
      // A package can survive an interrupted manifest write or pnpm command.
      // Re-register what is physically present instead of replacing it with
      // the build-time seed and potentially downgrading a user update.
      profile.dependencies[MARKETPLACE_PACKAGE] = installedPackage.version
      profileChanged = true
      suspension = undefined
      status = 'repaired'
    } else {
      installSeed(markerSchema === 1 ? 'migrated' : 'repaired')
    }
  } else if (hasBundle && hasDependency && installedIsStaleSeed) {
    installSeed('updated')
  } else if (hasBundle && hasDependency && installedAllowsNewerSeed) {
    installSeed('updated')
  } else if (hasBundle && hasDependency && installedSeedNeedsPin) {
    pinInstalledSeed('repaired')
  } else if (hasBundle && hasDependency && !installedPackageUsable) {
    if (installedPackage === undefined && seedMatchesDependency) {
      installSeed('repaired')
    } else {
      // The seed cannot safely stand in for a missing beta, git, file, alias,
      // or older registry selection. Preserve that spec, quarantine only the
      // unresolved bundle so core DSH can boot, and restore it automatically
      // once the user/package manager rematerializes the package.
      profile.dsh.profile.bundles = bundles.filter((name) => name !== MARKETPLACE_PACKAGE)
      profileChanged = true
      bundleEnabled = false
      suspension = {
        reason: 'missing-package',
        dependencySpec: String(dependencySpec),
      }
      status = 'suspended'
      console.warn(
        `ensure-marketplace: ${MARKETPLACE_PACKAGE}@${String(dependencySpec)} is unavailable; ` +
        'its bundle was suspended without changing the dependency or installed files',
      )
    }
  } else if (hasDependency && hasBundle) {
    status = 'alreadyInstalled'
    suspension = undefined
  } else if (!hasBundle) {
    status = 'previouslyRemoved'
    if (!hasDependency) {
      suspension = undefined
      removeOwnedSeedResidue(profileDir)
    }
  }

  if (profileChanged) writeProfileManifest(profileDir, profile)
  writePolicyAtomic(profileDir, bundleEnabled, loadOverlayPatches)
  writeJsonAtomic(markerPath, {
    schemaVersion: MARKETPLACE_SCHEMA_VERSION,
    package: MARKETPLACE_PACKAGE,
    seededVersion: seed.version,
    ...(suspension === undefined ? {} : { suspended: suspension }),
  })
  const activeVersion = bundleEnabled && existsSync(activeManifestPath)
    ? readJson(activeManifestPath).version
    : profile.dependencies[MARKETPLACE_PACKAGE] ?? seed.version
  return { status, profileDir, version: activeVersion }
}

if (process.argv[1]?.endsWith('ensure-marketplace.mjs')) {
  const result = await ensureMarketplace(process.argv[2] ?? join(dirname(process.argv[1]), '..'))
  console.log(`ensure-marketplace: ${result.status} (${MARKETPLACE_PACKAGE}@${result.version})`)
}
