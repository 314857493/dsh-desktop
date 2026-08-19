#!/usr/bin/env node
/**
 * Create the Tauri updater metadata consumed by `latest.json`.
 *
 * Each platform build writes one fragment next to its bundle. The release job
 * downloads all build artifacts and merges those fragments into a single
 * static updater manifest, avoiding architecture guesses on the Linux runner.
 *
 * Fragment mode:
 *   node scripts/updater-manifest.mjs \
 *     --fragment <output.json> --bundle-root <bundle/> \
 *     --version 1.2.3 --tag v1.2.3 --repo owner/repo
 *
 * Merge mode:
 *   node scripts/updater-manifest.mjs \
 *     --merge-dir <downloaded-artifacts/> --output <latest.json>
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (name) => {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}
const fail = (message) => {
  console.error(`FAILED: ${message}`)
  process.exit(1)
}

function requireValue(name) {
  const result = value(name)?.trim()
  if (!result) fail(`missing ${name}`)
  return result
}

function updaterPlatform() {
  const os = {
    win32: 'windows',
    darwin: 'darwin',
    linux: 'linux',
  }[process.platform]
  const arch = {
    x64: 'x86_64',
    arm64: 'aarch64',
    ia32: 'i686',
    arm: 'armv7',
  }[process.arch]
  if (!os || !arch) fail(`unsupported updater platform: ${process.platform}/${process.arch}`)
  return `${os}-${arch}`
}

function newestFile(directory, matches) {
  if (!existsSync(directory)) fail(`bundle directory does not exist: ${directory}`)
  const candidates = readdirSync(directory)
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile() && matches(basename(path)))
    .filter((path) => existsSync(`${path}.sig`))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
  if (candidates.length === 0) {
    fail(`no signed updater artifact found in ${directory}`)
  }
  return candidates[0]
}

function findUpdaterArtifacts(bundleRoot) {
  if (process.platform === 'win32') {
    return [{
      installer: 'nsis',
      artifact: newestFile(join(bundleRoot, 'nsis'), (name) => name.endsWith('-setup.exe')),
    }]
  }
  if (process.platform === 'darwin') {
    return [{
      installer: 'app',
      artifact: newestFile(join(bundleRoot, 'macos'), (name) => name.endsWith('.app.tar.gz')),
    }]
  }
  if (process.platform === 'linux') {
    return [
      {
        installer: 'appimage',
        artifact: newestFile(join(bundleRoot, 'appimage'), (name) => name.endsWith('.AppImage')),
      },
      {
        installer: 'deb',
        artifact: newestFile(join(bundleRoot, 'deb'), (name) => name.endsWith('.deb')),
      },
    ]
  }
  fail(`updater artifacts are not supported on ${process.platform}`)
}

function releaseAssetUrl(repo, tag, fileName) {
  // GitHub normalizes whitespace in uploaded release asset names to dots.
  // Build the URL from that public name; otherwise a local bundle such as
  // `DSH Desktop_0.1.7_x64-setup.exe` produces a valid-looking URL that 404s.
  const releaseAssetName = fileName.replace(/\s/g, '.')
  return `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(releaseAssetName)}`
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

function createFragment() {
  const output = resolve(requireValue('--fragment'))
  const bundleRoot = resolve(requireValue('--bundle-root'))
  const version = requireValue('--version').replace(/^v/, '')
  const tag = requireValue('--tag')
  const repo = requireValue('--repo')
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    fail(`invalid updater version: ${version}`)
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) fail(`invalid GitHub repository: ${repo}`)

  const platform = updaterPlatform()
  const artifacts = findUpdaterArtifacts(bundleRoot)
  const platforms = {}
  for (const { installer, artifact } of artifacts) {
    const signature = readFileSync(`${artifact}.sig`, 'utf8').trim()
    if (!signature) fail(`empty updater signature: ${artifact}.sig`)
    const metadata = {
      url: releaseAssetUrl(repo, tag, basename(artifact)),
      signature,
    }
    platforms[`${platform}-${installer}`] = metadata
    // Keep the standard OS-ARCH entry for compatibility. The platform's
    // default installer is the only artifact that owns this unsuffixed key.
    if (
      (process.platform === 'win32' && installer === 'nsis') ||
      (process.platform === 'darwin' && installer === 'app') ||
      (process.platform === 'linux' && installer === 'appimage')
    ) {
      platforms[platform] = metadata
    }
  }
  writeJson(output, {
    version,
    platforms,
  })
  console.log(`updater fragment: ${Object.keys(platforms).join(', ')} -> ${output}`)
}

function findFragments(root) {
  const found = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      if (entry.isFile() && /^updater-fragment-.+\.json$/.test(entry.name)) found.push(path)
    }
  }
  if (!existsSync(root)) fail(`artifact directory does not exist: ${root}`)
  visit(root)
  return found.sort()
}

function mergeFragments() {
  const root = resolve(requireValue('--merge-dir'))
  const output = resolve(requireValue('--output'))
  const paths = findFragments(root)
  if (paths.length === 0) fail(`no updater fragments found under ${root}`)

  const fragments = paths.map((path) => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      fail(`invalid updater fragment ${path}: ${error.message}`)
    }
  })
  const versions = new Set(fragments.map((fragment) => fragment.version))
  if (versions.size !== 1) fail(`updater fragments have different versions: ${[...versions].join(', ')}`)

  const platforms = {}
  for (const fragment of fragments) {
    if (!fragment.platforms || typeof fragment.platforms !== 'object') {
      fail('updater fragment has no platforms object')
    }
    for (const [platform, metadata] of Object.entries(fragment.platforms)) {
      if (!metadata?.url || !metadata?.signature) {
        fail(`incomplete updater fragment for ${platform}`)
      }
      if (platforms[platform]) fail(`duplicate updater platform: ${platform}`)
      platforms[platform] = {
        url: metadata.url,
        signature: metadata.signature,
      }
    }
  }

  const [version] = versions
  writeJson(output, {
    version,
    notes: `DSH Desktop ${version}`,
    pub_date: new Date().toISOString(),
    platforms,
  })
  console.log(`updater manifest: ${Object.keys(platforms).join(', ')} -> ${output}`)
}

if (value('--fragment')) {
  createFragment()
} else if (value('--merge-dir')) {
  mergeFragments()
} else {
  fail('choose fragment mode (--fragment) or merge mode (--merge-dir)')
}
