import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path'

const IS_WIN = process.platform === 'win32'
const NODE_BIN = IS_WIN ? 'node.exe' : 'node'
const ESSENTIAL_FILES = IS_WIN
  ? ['npm', 'npm.cmd', 'npm.ps1', 'npx', 'npx.cmd', 'npx.ps1',
      'corepack', 'corepack.cmd', 'nodevars.bat', 'install_tools.bat',
      'LICENSE', 'CHANGELOG.md', 'README.md']
  : ['npm', 'npx', 'corepack', 'LICENSE', 'CHANGELOG.md', 'README.md']

// Native dependencies are built with the active Node. Never select a different
// installation from fnm/Program Files, or reuse an older staged runtime.
export function prepareNodeRuntime(destination, execPath = process.execPath) {
  const executable = realpathSync(execPath)
  const source = dirname(executable)
  const target = realpathSync(dirname(destination))
  const resolvedDestination = join(target, basename(destination))
  const sourceWithinDestination = relative(resolvedDestination, executable)
  if (!isAbsolute(sourceWithinDestination) && sourceWithinDestination !== '..' && !sourceWithinDestination.startsWith(`..${sep}`)) {
    throw new Error('Node runtime destination must not contain the active Node executable')
  }
  if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) {
    throw new Error('Node runtime destination must not be a symbolic link')
  }
  rmSync(destination, { recursive: true, force: true })
  mkdirSync(destination, { recursive: true })
  copyFileSync(executable, join(destination, NODE_BIN))
  if (!IS_WIN) chmodSync(join(destination, NODE_BIN), 0o755)

  // Include only package-manager support files, never unrelated global packages.
  for (const name of ESSENTIAL_FILES) {
    const from = join(source, name)
    if (!existsSync(from)) continue
    // Unix wrappers often link outside bin/ and would break when dereferenced.
    if (!IS_WIN && !lstatSync(from).isFile()) continue
    copyFileSync(from, join(destination, name))
    if (!IS_WIN && ['npm', 'npx', 'corepack'].includes(name)) {
      chmodSync(join(destination, name), 0o755)
    }
  }
  mkdirSync(join(destination, 'node_modules'), { recursive: true })
  for (const name of ['npm', 'corepack']) {
    const from = join(source, 'node_modules', name)
    if (existsSync(from)) cpSync(from, join(destination, 'node_modules', name), { recursive: true })
  }
  console.log(`node-runtime: copied active Node from ${executable}`)
}
