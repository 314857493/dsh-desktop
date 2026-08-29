#!/usr/bin/env node

// Make a prepared runtime self-contained before it is archived. pnpm deploy
// can leave workspace packages as symlinks/junctions into the source checkout;
// those links work during the smoke test but become dangling after only `rt`
// is uploaded to the packaging jobs.
import {
  cpSync,
  lstatSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
} from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

function isInside(root, candidate) {
  const path = relative(root, candidate)
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`))
}

function runtimeLinks(root) {
  const links = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isSymbolicLink()) links.push(path)
      else if (entry.isDirectory()) walk(path)
    }
  }
  walk(root)
  return links
}

export function validateRuntimeLinks(root) {
  root = resolve(root)
  const canonicalRoot = realpathSync(root)
  const invalid = []
  for (const link of runtimeLinks(root)) {
    let target
    try {
      target = realpathSync(link)
    } catch {
      invalid.push(`${relative(root, link)} -> dangling`)
      continue
    }
    if (!isInside(canonicalRoot, target)) {
      invalid.push(`${relative(root, link)} -> ${target}`)
    }
  }
  if (invalid.length > 0) {
    throw new Error(`prepared runtime contains non-portable links:\n${invalid.join('\n')}`)
  }
}

export function internalizeExternalRuntimeLinks(root) {
  root = resolve(root)
  const canonicalRoot = realpathSync(root)
  const materialized = []

  // Materializing one workspace package can expose nested dependency links
  // that were not reachable while the parent itself was a link. Repeat until
  // every reachable link is either internal or has been copied into `rt`.
  for (;;) {
    let changed = false
    for (const link of runtimeLinks(root)) {
      let target
      try {
        target = realpathSync(link)
      } catch {
        continue
      }
      if (isInside(canonicalRoot, target)) continue

      const temporary = `${link}.dsh-desktop-materializing`
      rmSync(temporary, { recursive: true, force: true })
      cpSync(target, temporary, {
        recursive: statSync(target).isDirectory(),
        dereference: true,
        errorOnExist: true,
        force: false,
      })
      unlinkSync(link)
      renameSync(temporary, link)
      materialized.push(relative(root, link))
      changed = true
    }
    if (!changed) break
  }

  validateRuntimeLinks(root)
  return materialized
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'rt')
  const materialized = internalizeExternalRuntimeLinks(root)
  console.log(`runtime-links: materialized ${materialized.length} external links`)
  if (materialized.length > 0) console.log(materialized.join('\n'))
  console.log('runtime-links: all remaining links resolve inside the prepared runtime')
}
