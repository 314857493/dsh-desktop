#!/usr/bin/env node
/**
 * Resolve and apply DSH Desktop release metadata.
 *
 * Prepare mode is used by GitHub Actions before the platform build matrix. It
 * discovers the next DeepSeek Harness release, chooses a monotonically
 * increasing desktop version, and writes the notes shared by the GitHub
 * Release and Tauri updater manifest.
 *
 * Apply mode runs only after all platform builds pass. It promotes the
 * Unreleased changelog section, synchronizes checked-in versions, and records
 * the exact upstream tag/commit so scheduled runs are idempotent.
 */
import { spawnSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const defaultProject = resolve(here, '..')
const args = process.argv.slice(2)
const command = args[0]

const value = (name) => {
  const at = args.indexOf(name)
  return at === -1 ? undefined : args[at + 1]
}
const fail = (message) => {
  throw new Error(message)
}

const SEMVER_RE = /^(?:dsh-)?v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export function parseSemver(input) {
  const match = String(input ?? '').trim().match(SEMVER_RE)
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  }
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) return 0
  if (left.length === 0) return 1
  if (right.length === 0) return -1
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    if (left[index] === undefined) return -1
    if (right[index] === undefined) return 1
    const leftNumeric = /^\d+$/.test(left[index])
    const rightNumeric = /^\d+$/.test(right[index])
    if (leftNumeric && rightNumeric) {
      const difference = Number(left[index]) - Number(right[index])
      if (difference !== 0) return difference
      continue
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    const difference = left[index].localeCompare(right[index])
    if (difference !== 0) return difference
  }
  return 0
}

export function compareSemver(leftValue, rightValue) {
  const left = parseSemver(leftValue)
  const right = parseSemver(rightValue)
  if (!left || !right) fail(`cannot compare non-semver values: ${leftValue}, ${rightValue}`)
  for (const key of ['major', 'minor', 'patch']) {
    const difference = left[key] - right[key]
    if (difference !== 0) return difference
  }
  return comparePrerelease(left.prerelease, right.prerelease)
}

export function nextPatchVersion(input) {
  const version = parseSemver(input)
  if (!version) fail(`cannot increment non-semver version: ${input}`)
  return `${version.major}.${version.minor}.${version.patch + 1}`
}

export function selectNextRelease(releases, currentTag) {
  const candidates = releases
    .filter((release) => !release.draft && release.tag_name.startsWith('dsh-v') && parseSemver(release.tag_name))
    .sort((left, right) => compareSemver(left.tag_name, right.tag_name))
  if (candidates.length === 0) return null
  if (!currentTag || !parseSemver(currentTag)) return candidates.at(-1)
  return candidates.find((release) => compareSemver(release.tag_name, currentTag) > 0) ?? null
}

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`invalid JSON in ${path}: ${error.message}`)
  }
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

function normalizeDesktopVersion(input) {
  const clean = String(input ?? '').trim().replace(/^v/, '')
  if (!parseSemver(clean) || clean.startsWith('dsh-')) fail(`invalid desktop version: ${input}`)
  return clean
}

function bool(input) {
  return ['1', 'true', 'yes'].includes(String(input ?? '').trim().toLowerCase())
}

async function githubApi(path, token, { allow404 = false } = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'dsh-desktop-release',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (allow404 && response.status === 404) return null
  if (!response.ok) fail(`GitHub API ${path} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

async function listReleases(repository, token) {
  const releases = []
  for (let page = 1; ; page += 1) {
    const batch = await githubApi(`/repos/${repository}/releases?per_page=100&page=${page}`, token)
    releases.push(...batch)
    if (batch.length < 100) return releases
  }
}

async function releaseByTag(repository, tag, token) {
  if (!tag || !parseSemver(tag)) return null
  return githubApi(
    `/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`,
    token,
    { allow404: true },
  )
}

function upstreamRemote(repository) {
  return `https://github.com/${repository}.git`
}

function resolveRemoteRef(repository, ref) {
  if (/^[0-9a-f]{40}$/i.test(ref)) return ref
  const result = spawnSync(
    'git',
    ['ls-remote', upstreamRemote(repository), ref, `${ref}^{}`],
    { encoding: 'utf8' },
  )
  if (result.status !== 0 || !result.stdout.trim()) {
    fail(`cannot resolve ${repository}@${ref}: ${result.stderr?.trim() || 'git ls-remote failed'}`)
  }
  const lines = result.stdout.trim().split('\n')
  const peeled = lines.find((line) => line.endsWith('^{}'))
  return (peeled ?? lines[0]).split(/\s+/)[0]
}

function currentDesktopVersion(project) {
  const conf = readJson(join(project, 'src-tauri', 'tauri.conf.json'))
  return normalizeDesktopVersion(conf?.version)
}

function latestDesktopTag(project) {
  const result = spawnSync(
    'git',
    ['ls-remote', '--tags', '--refs', 'origin', 'refs/tags/v*'],
    { cwd: project, encoding: 'utf8' },
  )
  if (result.status !== 0) fail(`cannot list desktop tags: ${result.stderr?.trim()}`)
  const tags = result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[1]?.replace('refs/tags/', ''))
    .filter((tag) => parseSemver(tag))
    .sort(compareSemver)
  return tags.at(-1) ?? `v${currentDesktopVersion(project)}`
}

function desktopRepositoryFromOrigin(project) {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: project, encoding: 'utf8' })
  if (result.status !== 0) return null
  const remote = result.stdout.trim().replace(/\.git$/, '')
  const match = remote.match(/github\.com[/:]([^/]+\/[^/]+)$/)
  return match?.[1] ?? null
}

const requiredReleaseAssets = [
  (name) => name.endsWith('-setup.exe'),
  (name) => name.endsWith('.dmg'),
  (name) => name.endsWith('.deb'),
  (name) => name.endsWith('.AppImage'),
  (name) => name === 'latest.json',
]

function releaseIsComplete(release) {
  if (!release || release.draft) return false
  const names = (release.assets ?? []).map((asset) => asset.name)
  return requiredReleaseAssets.every((matches) => names.some(matches))
}

function findUnreleasedSection(changelog) {
  const heading = /^## \[Unreleased\][^\S\r\n]*(?:\r?\n|$)/m.exec(changelog)
  if (!heading) return null
  const bodyStart = heading.index + heading[0].length
  const nextHeading = /^## \[/m.exec(changelog.slice(bodyStart))
  const end = nextHeading ? bodyStart + nextHeading.index : changelog.length
  return {
    start: heading.index,
    end,
    body: changelog.slice(bodyStart, end),
  }
}

function extractUnreleased(changelog) {
  return findUnreleasedSection(changelog)?.body.trim() ?? ''
}

function upstreamChineseNotes(body, repository, tag, headingOffset = 1) {
  if (!body?.trim()) return ''
  let notes = body.replace(/\r\n/g, '\n').split(/^\s*---\s*$/m)[0]
  notes = notes.replace(/^\s*\[[^\]]*中文[^\]]*\][^\n]*\n?/i, '').trim()
  notes = notes.replace(
    /<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\1>/gi,
    (match, level, title) => `${'#'.repeat(Number(level))} ${title}`,
  )
  notes = notes.replace(/\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g, (match, path) =>
    `](https://github.com/${repository}/blob/${tag}/${path})`)
  return notes.replace(/^(#{1,6})\s+/gm, (match, hashes) =>
    `${'#'.repeat(Math.min(6, hashes.length + headingOffset))} `)
}

function upstreamTransition(metadata) {
  const previous = metadata.upstream.previousTag
  const current = metadata.upstream.tag
  if (previous && previous !== current) return `\`${previous}\` → \`${current}\``
  return `\`${current}\``
}

export function createChangelogEntry(metadata, unreleased = '') {
  const desktop = unreleased || '### 桌面端\n\n- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。'
  const upstreamNotes = upstreamChineseNotes(
    metadata.upstream.body,
    metadata.upstream.repository,
    metadata.upstream.tag,
  )
  const lines = [
    `## [${metadata.desktop.version}] - ${metadata.date}`,
    '',
    desktop,
    '',
    '### 内置 DeepSeek Harness',
    '',
    `- 版本：${upstreamTransition(metadata)}`,
    `- Commit：\`${metadata.upstream.commit}\``,
    `- [上游 Release Notes](${metadata.upstream.releaseUrl})`,
  ]
  if (upstreamNotes) lines.push('', upstreamNotes)
  return `${lines.join('\n').trim()}\n`
}

function releaseNotes(metadata, unreleased) {
  const upstreamNotes = upstreamChineseNotes(
    metadata.upstream.body,
    metadata.upstream.repository,
    metadata.upstream.tag,
    0,
  )
  const desktop = unreleased
    ? unreleased.replace(/^### 桌面端\s*/m, '').trim()
    : '- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。'
  return [
    `## 内置 DeepSeek Harness`,
    '',
    `- 版本：${upstreamTransition(metadata)}`,
    `- Commit：\`${metadata.upstream.commit}\``,
    `- [查看上游完整发布说明](${metadata.upstream.releaseUrl})`,
    '',
    upstreamNotes,
    '',
    '## 桌面端',
    '',
    desktop,
  ].filter((line, index, array) => line !== '' || array[index - 1] !== '').join('\n').trim() + '\n'
}

function updaterNotes(metadata) {
  return [
    `DSH Desktop ${metadata.desktop.version}`,
    '',
    `内置 DeepSeek Harness 已更新至 ${metadata.upstream.tag}。`,
    `完整说明：${metadata.upstream.releaseUrl}`,
  ].join('\n') + '\n'
}

function writeOutputs(path, metadata) {
  if (!path) return
  const outputs = {
    should_build: metadata.shouldBuild,
    should_publish: metadata.shouldPublish,
    update_repository: metadata.updateRepository,
    desktop_version: metadata.desktop.version,
    desktop_tag: metadata.desktop.tag,
    upstream_ref: metadata.upstream.tag,
  }
  appendFileSync(path, Object.entries(outputs).map(([key, result]) => `${key}=${result}\n`).join(''))
}

function metadataPaths(project) {
  const output = resolve(value('--output') ?? join(project, '.release', 'metadata.json'))
  return {
    output,
    releaseNotes: resolve(value('--release-notes') ?? join(dirname(output), 'release-notes.md')),
    updaterNotes: resolve(value('--updater-notes') ?? join(dirname(output), 'updater-notes.md')),
  }
}

async function prepare() {
  const project = resolve(value('--project') ?? defaultProject)
  const event = value('--event') ?? 'workflow_dispatch'
  const upstreamRepository = value('--upstream-repo') ?? 'deepseek-ai/deepseek-harness'
  const desktopRepository = value('--desktop-repo')
  const statePath = resolve(value('--state') ?? join(project, '.dsh-upstream.json'))
  const token = process.env.GITHUB_TOKEN?.trim()
  const state = readJson(statePath, {})
  const paths = metadataPaths(project)
  let upstreamRelease
  let version
  let shouldBuild = true
  let shouldPublish = false
  let updateRepository = false

  if (event === 'schedule') {
    if (!desktopRepository) fail('--desktop-repo is required for scheduled releases')
    if (state.managed && state.desktopVersion) {
      const existing = await releaseByTag(desktopRepository, `v${state.desktopVersion}`, token)
      if (!releaseIsComplete(existing)) {
        upstreamRelease = await releaseByTag(upstreamRepository, state.tag, token)
        version = state.desktopVersion
        shouldPublish = true
        updateRepository = true
      }
    }
    if (!upstreamRelease) {
      const releases = await listReleases(upstreamRepository, token)
      upstreamRelease = selectNextRelease(releases, state.tag)
      if (!upstreamRelease) {
        version = currentDesktopVersion(project)
        shouldBuild = false
      } else {
        version = nextPatchVersion(latestDesktopTag(project))
        shouldPublish = true
        updateRepository = true
      }
    }
  } else {
    const requestedRef = value('--upstream-ref')?.trim() || state.tag || 'master'
    upstreamRelease = await releaseByTag(upstreamRepository, requestedRef, token)
    const requestedVersion = value('--version')?.trim()
    shouldPublish = event === 'push' || bool(value('--publish'))
    version = requestedVersion
      ? normalizeDesktopVersion(requestedVersion)
      : shouldPublish
        ? nextPatchVersion(latestDesktopTag(project))
        : currentDesktopVersion(project)
    updateRepository = shouldPublish && event !== 'push'
    if (!upstreamRelease) {
      upstreamRelease = {
        tag_name: requestedRef,
        html_url: `https://github.com/${upstreamRepository}/tree/${encodeURIComponent(requestedRef)}`,
        body: '',
        published_at: null,
      }
    }
  }

  const upstreamTag = upstreamRelease?.tag_name ?? state.tag ?? 'master'
  const upstreamCommit = upstreamTag === state.tag && state.commit
    ? state.commit
    : resolveRemoteRef(upstreamRepository, upstreamTag)
  const previousDesktopTag = latestDesktopTag(project)
  const metadata = {
    schemaVersion: 1,
    event,
    date: new Date().toISOString().slice(0, 10),
    shouldBuild,
    shouldPublish,
    updateRepository,
    desktop: {
      repository: desktopRepository ?? desktopRepositoryFromOrigin(project),
      previousVersion: previousDesktopTag.replace(/^v/, ''),
      version: normalizeDesktopVersion(version),
      tag: `v${normalizeDesktopVersion(version)}`,
    },
    upstream: {
      repository: upstreamRepository,
      previousTag: state.tag ?? null,
      tag: upstreamTag,
      commit: upstreamCommit,
      releaseUrl: upstreamRelease?.html_url ?? `https://github.com/${upstreamRepository}/tree/${upstreamTag}`,
      publishedAt: upstreamRelease?.published_at ?? null,
      body: upstreamRelease?.body ?? '',
    },
  }

  mkdirSync(dirname(paths.output), { recursive: true })
  writeJson(paths.output, metadata)
  const changelog = existsSync(join(project, 'CHANGELOG.md'))
    ? readFileSync(join(project, 'CHANGELOG.md'), 'utf8')
    : ''
  const unreleased = extractUnreleased(changelog)
  writeFileSync(paths.releaseNotes, releaseNotes(metadata, unreleased))
  writeFileSync(paths.updaterNotes, updaterNotes(metadata))
  writeOutputs(value('--github-output'), metadata)
  console.log(shouldBuild
    ? `release metadata: ${metadata.desktop.tag} bundles ${upstreamTag}@${upstreamCommit.slice(0, 7)}`
    : `no upstream release after ${state.tag ?? '(none)'}`)
}

function replaceRequired(path, pattern, replacement, label) {
  const input = readFileSync(path, 'utf8')
  if (!pattern.test(input)) fail(`cannot find ${label} in ${path}`)
  writeFileSync(path, input.replace(pattern, replacement))
}

export function applyReleaseMetadata(project, metadata) {
  const version = normalizeDesktopVersion(metadata.desktop.version)
  replaceRequired(
    join(project, 'src-tauri', 'tauri.conf.json'),
    /"version"\s*:\s*"[^"]*"/,
    `"version": "${version}"`,
    'Tauri version',
  )
  replaceRequired(
    join(project, 'src-tauri', 'Cargo.toml'),
    /^version\s*=\s*"[^"]*"/m,
    `version = "${version}"`,
    'Cargo package version',
  )
  replaceRequired(
    join(project, 'src-tauri', 'Cargo.lock'),
    /(\[\[package\]\]\r?\nname = "dsh-desktop"\r?\nversion = ")[^"]*(")/,
    `$1${version}$2`,
    'Cargo lock package version',
  )

  const changelogPath = join(project, 'CHANGELOG.md')
  const initial = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : '# Changelog\n\nAll notable changes to DSH Desktop are documented in this file.\n\n## [Unreleased]\n'
  if (!new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm').test(initial)) {
    const section = findUnreleasedSection(initial)
    if (!section) fail(`cannot find Unreleased section in ${changelogPath}`)
    const unreleased = section.body.trim()
    const entry = createChangelogEntry(metadata, unreleased)
    const next = `${initial.slice(0, section.start)}## [Unreleased]\n\n${entry}\n${initial.slice(section.end)}`
    const repository = metadata.desktop.repository
    let linked = next
    if (repository) {
      const baseUrl = `https://github.com/${repository}`
      const version = metadata.desktop.version
      const previous = metadata.desktop.previousVersion
      linked = linked.replace(/^\[Unreleased\]:[^\n]*\n?/m, '')
      linked = linked.replace(new RegExp(`^\\[${version.replace(/\./g, '\\.')}\\]:[^\\n]*\\n?`, 'm'), '')
      linked = linked.trimEnd() + '\n\n'
      linked += `[Unreleased]: ${baseUrl}/compare/v${version}...HEAD\n`
      linked += previous && previous !== version
        ? `[${version}]: ${baseUrl}/compare/v${previous}...v${version}\n`
        : `[${version}]: ${baseUrl}/releases/tag/v${version}\n`
    }
    writeFileSync(changelogPath, linked.endsWith('\n') ? linked : `${linked}\n`)
  }

  if (parseSemver(metadata.upstream.tag)) {
    writeJson(join(project, '.dsh-upstream.json'), {
      schemaVersion: 1,
      repository: metadata.upstream.repository,
      tag: metadata.upstream.tag,
      commit: metadata.upstream.commit,
      releaseUrl: metadata.upstream.releaseUrl,
      publishedAt: metadata.upstream.publishedAt,
      desktopVersion: version,
      managed: true,
    })
  }
}

function apply() {
  const project = resolve(value('--project') ?? defaultProject)
  const metadataPath = resolve(value('--metadata') ?? join(project, '.release', 'metadata.json'))
  const metadata = readJson(metadataPath)
  if (!metadata) fail(`release metadata not found: ${metadataPath}`)
  applyReleaseMetadata(project, metadata)
  console.log(`applied release metadata for ${metadata.desktop.tag}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (command === 'prepare') await prepare()
    else if (command === 'apply') apply()
    else fail('usage: release-metadata.mjs <prepare|apply> [options]')
  } catch (error) {
    console.error(`FAILED: ${error.message}`)
    process.exit(1)
  }
}
