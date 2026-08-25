#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync, renameSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EXPECTED_DIRECTORIES = ['rt', 'node-runtime']
const here = dirname(fileURLToPath(import.meta.url))

function value(name) {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}

export function validatePreparedRuntime(source) {
  const entries = readdirSync(source).filter(entry => entry !== 'prepared-runtime.tar.gz').sort()
  if (entries.join('\n') !== [...EXPECTED_DIRECTORIES].sort().join('\n')) {
    throw new Error(`unexpected prepared-runtime entries: ${entries.join(', ') || '(none)'}`)
  }
  for (const name of EXPECTED_DIRECTORIES) {
    const path = join(source, name)
    if (!existsSync(path) || !lstatSync(path).isDirectory()) {
      throw new Error(`prepared runtime entry is not a directory: ${path}`)
    }
  }
}

export function movePreparedRuntime(source, destination) {
  source = resolve(source)
  destination = resolve(destination)
  const relativeSource = relative(destination, source)
  if (isAbsolute(relativeSource) || relativeSource.startsWith('..')) {
    throw new Error('prepared runtime source must be inside the destination workspace')
  }
  validatePreparedRuntime(source)
  for (const name of EXPECTED_DIRECTORIES) {
    const target = join(destination, name)
    if (existsSync(target)) throw new Error(`destination already exists: ${target}`)
  }
  for (const name of EXPECTED_DIRECTORIES) renameSync(join(source, name), join(destination, name))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = value('--source') ?? join(here, '..', 'prepared-runtime')
  const destination = value('--destination') ?? join(here, '..')
  movePreparedRuntime(source, destination)
  console.log('prepared-runtime: validated and moved rt, node-runtime')
}
