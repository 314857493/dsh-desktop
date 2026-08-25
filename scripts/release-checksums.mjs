#!/usr/bin/env node
import { createHash } from 'node:crypto'
import {
  createReadStream,
  existsSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function isPublishedReleaseAsset(name) {
  if (name.startsWith('rw.') && name.endsWith('.dmg')) return false
  return name === 'latest.json' ||
    name.endsWith('-setup.exe') ||
    name.endsWith('-setup.exe.sig') ||
    name.endsWith('.dmg') ||
    name.endsWith('.deb') ||
    name.endsWith('.deb.sig') ||
    name.endsWith('.AppImage') ||
    name.endsWith('.AppImage.sig') ||
    name.endsWith('.app.tar.gz') ||
    name.endsWith('.app.tar.gz.sig')
}

function walkFiles(root) {
  const files = []
  const pending = [root]
  while (pending.length > 0) {
    const dir = pending.pop()
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) pending.push(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  return files
}

export function collectPublishedReleaseAssets(root) {
  const byName = new Map()
  for (const path of walkFiles(root)) {
    const name = basename(path)
    if (!isPublishedReleaseAsset(name)) continue
    if (byName.has(name)) {
      throw new Error(`duplicate published asset name: ${name}`)
    }
    byName.set(name, path)
  }
  return [...byName].sort(([left], [right]) => left.localeCompare(right))
}

export async function sha256(path) {
  return await new Promise((resolveHash, reject) => {
    const hash = createHash('sha256')
    const input = createReadStream(path)
    input.on('data', (chunk) => hash.update(chunk))
    input.on('error', reject)
    input.on('end', () => resolveHash(hash.digest('hex')))
  })
}

export async function writeReleaseChecksums(root, output) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`artifact directory not found: ${root}`)
  }
  const assets = collectPublishedReleaseAssets(root)
  if (assets.length === 0) throw new Error(`no published release assets found below ${root}`)

  const lines = []
  for (const [name, path] of assets) {
    lines.push(`${await sha256(path)}  ${name}`)
  }
  writeFileSync(output, `${lines.join('\n')}\n`)
  return assets.length
}

function option(name) {
  const at = process.argv.indexOf(name)
  return at === -1 ? undefined : process.argv[at + 1]
}

const invokedPath = process.argv[1] === undefined ? '' : fileURLToPath(import.meta.url)
if (invokedPath !== '' && realpathSync(process.argv[1]) === realpathSync(invokedPath)) {
  const root = resolve(option('--root') ?? 'artifacts')
  const output = resolve(option('--output') ?? join(root, 'SHA256SUMS'))
  const count = await writeReleaseChecksums(root, output)
  console.log(`release checksums: ${count} assets -> ${output}`)
}
