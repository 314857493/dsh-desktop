# DSH Desktop

> **English** | [简体中文](README.md) | [Changelog](CHANGELOG.md)

> [!IMPORTANT]
> **Unofficial personal project:** This project is independently developed and maintained by an
> individual. It is not an official DeepSeek or DeepSeek Harness project and is not affiliated
> with, sponsored by, or endorsed by their official teams.

A desktop extension of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): a Tauri native window shell that hosts the DSH Web GUI. It launches the `dsh web` Node server, loads the UI into the system webview once the server is ready, and shuts the server down when the app exits. The release pipeline supports Windows, macOS, and Linux.

This project does **not modify the DSH core** — the agent loop, tool calling, session persistence, etc. all come from upstream DSH. This repository provides the desktop shell, self-contained packaging, and automated release tooling (build, pruning, smoke test, installer).

## Features

- 🖥️ **One-click desktop launch** — open the installed app and start working; on Windows, child processes use `CREATE_NO_WINDOW` to avoid console flashes
- 1️⃣ **Single instance** — launching the app again shows and focuses the existing main window instead of starting another server
- 🔒 **Isolated data directory** — uses a dedicated `~/.dsh-desktop` by default, separate from the browser GUI (`~/.dsh`), avoiding session-log corruption from two instances writing the same session
- 🧹 **Server lifetime follows the app** — normal exit terminates the Node server; Windows additionally uses `taskkill /T /F` and a kill-on-close Job Object so the OS cleans up the process tree after a crash or forced exit
- 🔗 **External links go to the system browser** — links in answers/settings open in the default browser (opener plugin + a loopback remote capability); the config file opens in the default editor
- 🧩 **Built-in plugin market** — ships the community `dshmarket` for browsing, installing, updating, disabling, and removing DSH plugins; a private pnpm is bundled as well
- 📦 **Self-contained distribution** — bundles a Node.js runtime and a pruned DSH runtime; end users install nothing
- ⚙️ **Configurable** — four-level precedence: bundled resources < config file < env vars < CLI args
- 🔄 **In-app updates** — checks silently at startup, with manual check, download, and installation of signed updates in Settings
- 🔄 **Tracks upstream** — the release script pulls DSH source from the official repository and can pin a tag/branch

## Requirements

### Runtime (end users)

| Requirement | Notes |
| --- | --- |
| OS | Windows 10/11, macOS, or Linux (CI builds on Ubuntu 22.04) |
| System webview | WebView2 on Windows (handled by the NSIS installer), system WebKit on macOS, and WebKitGTK on Linux |
| Node.js | **Not needed** (bundled with the installer) |
| pnpm | **Not needed** (a private copy used only for DSH plugin management is bundled) |
| DSH source | **Not needed** (a pruned DSH runtime is bundled) |

### Build / release (developers)

| Dependency | Version | Purpose |
| --- | --- | --- |
| OS | same as the target platform | The script produces NSIS, DMG/`.app`, or DEB/AppImage on the current OS; it does not cross-compile |
| Node.js | ≥ 22 (CI uses 24) | Runs the release scripts / source for the bundled runtime |
| pnpm | 11.7.0 in CI | DSH dependency install and deploy |
| Rust | stable | compiles the Tauri shell |
| Platform build tools | Windows: VS Build Tools C++; macOS: Xcode Command Line Tools; Linux: WebKitGTK/GTK packages | native compilation and packaging |
| `@tauri-apps/cli` | ≥ 2 | Tauri packaging |
| git | any | remote source fetch |

> The build machine needs Node (the release script copies core files from it into the installer); **end users do not**.

## Quick Start

Download the artifact for your system from [GitHub Releases](https://github.com/314857493/dsh-desktop/releases):

- **Windows**: run the NSIS `*-setup.exe`.
- **macOS**: open the `.dmg` and drag DSH Desktop to Applications.
- **Linux**: install the `.deb`, or make the `.AppImage` executable and run it.

Then open "DSH Desktop." Windows also retains `launch-dsh-desktop.cmd` as a local portable-build launcher; it expects `dsh-desktop.exe`, `dsh/`, and `node/` in the same directory.

## Distribution Forms

### 1. Self-contained (for end users, recommended)

Every platform bundle includes a Node.js runtime (`node-runtime/` → bundled as `node/`), a pruned DSH runtime (`rt/` → bundled as `dsh/`), and the marketplace seed plus private pnpm. The release script removes source maps, types/sources, and unreferenced orphan dependencies. End users do not need to install Node.js, npm, or pnpm separately. Artifact size varies with the bundled DSH and marketplace versions.

### 2. Source mode (local / developer use)

When bundled resources are missing, the app falls back to an external DSH checkout + system Node:

- **DSH source directory**: configured explicitly (defaults to the `DSH_DESKTOP_DSH_ROOT` env var; if empty and no bundled resources exist, the app errors with configuration hints). It can also point at `repo-cache/deepseek-harness/` fetched and built by `release.mjs`. The checkout must have been built with `pnpm run build` (or at least `build:lib` + `build:web`) and contain `apps/cli/lib/bin.js` (or `lib/bin.js`).
- **Node.js ≥ 22**: auto-detected from PATH; Windows also checks fnm and standard installation directories. It can also be configured explicitly.

## Configuration

Precedence: **bundled resources < config file < env vars < CLI args**.

Config file: `{app_config_dir}/dsh-desktop.json` (Tauri app config dir), e.g.:

```json
{
  "dsh_root": "<DSH source dir, e.g. repo-cache/deepseek-harness fetched by release.mjs>",
  "node": "<absolute path to the node executable (optional, auto-detected by default)>",
  "dsh_home": "<DSH_HOME data dir (optional, defaults to ~/.dsh-desktop)>"
}
```

> `dsh_root` just needs to point at the source repo root (a local clone, `repo-cache/deepseek-harness` fetched by the release script, or any built checkout); the directory must contain `apps/cli/lib/bin.js`.

Environment variables:

| Variable | Meaning |
| --- | --- |
| `DSH_DESKTOP_DSH_ROOT` | DSH runtime / source directory |
| `DSH_DESKTOP_NODE` | absolute path to the node executable |
| `DSH_DESKTOP_HOME` | DSH_HOME (defaults to `~/.dsh-desktop`, isolated from the browser GUI's `~/.dsh`) |

CLI args: `dsh-desktop[.exe] --dsh-root <path> [--node <path>] [--home <path>]`

> **Data isolation**: the desktop app defaults to a dedicated `~/.dsh-desktop` to avoid corrupting session logs by writing the same session from two instances (DSH requires one live writer per session). To share history, set `dsh_home` to `~/.dsh` explicitly — but never let both instances process messages for the same session at the same time.

## Plugin Market

Self-contained builds preinstall the latest registry release available at build time of the open-source community plugin
[`dshmarket`](https://github.com/dsh-market/dsh-market). Open **Settings → Plugin Market**
to browse and search the community catalog, install plugins with confirmation, and manage updates,
disablement, or removal. All operations run in the local DSH process. The desktop bundle carries a
pinned private pnpm, so no system Node, npm, or pnpm setup is required.

On first launch, Desktop copies the bundled offline market seed into the current `web` profile,
records its exact version as a profile dependency, and writes a migration marker. The profile owns the
active package from then on, so market self-updates and removals work and are not shadowed by an older
installation copy. If the user later uninstalls it, subsequent launches do not force it back. Resetting
the entire profile also removes the marker and restores the desktop defaults. User-installed plugins,
configuration, and market state remain under `DSH_HOME` (normally `~/.dsh-desktop`) across app updates.
Desktop owns the DSH child-process lifecycle, so the market's internal restart action defaults to
disabled. An explicit user setting may override that default; close and reopen Desktop for a full restart.

> A market listing is not an endorsement by this project or DeepSeek. Plugins execute with local-code
> privileges: verify the source, repository, and permission/build-script prompts before installing.

## Build / Release (fully automated)

```bash
# Local development package (fetches DSH from GitHub; no signed updater artifacts)
node scripts/release.mjs --no-updater

# Formal package (set TAURI_SIGNING_PRIVATE_KEY in the environment first)
node scripts/release.mjs

# Pin a remote ref (tag / branch / commit)
node scripts/release.mjs --ref <tag-or-commit>

# Use a local clone (offline): skips install/build if already built (fastest path)
node scripts/release.mjs --repo <local DSH source path> --no-updater
node scripts/release.mjs --repo <local DSH source path> --rebuild-repo --no-updater
# Alternatively, set DSH_DESKTOP_REPO and pass --local

# Custom remote URL / silent install after build (Windows) / skip smoke test / stamp version
node scripts/release.mjs --remote-url <url>
node scripts/release.mjs --install
node scripts/release.mjs --skip-boot-test
node scripts/release.mjs --no-updater       # test installer on a dev machine; no updater key required
node scripts/release.mjs --version <semver>   # syncs Tauri + Cargo metadata; a leading `v` is stripped
```

> **Development packaging**: `--no-updater` still prepares the runtime, runs the
> smoke test, and builds the platform installer, but temporarily disables updater
> artifacts through `src-tauri/tauri.no-updater.conf.json`. It produces no `.sig`,
> so Windows, macOS, and Ubuntu development machines do not need the updater private
> key. Do not use this option for a formal release.
> Without `--no-updater`, the script fails early when `TAURI_SIGNING_PRIVATE_KEY`
> is missing, preventing an update that installed clients cannot verify from being
> published accidentally.

> **Artifact version**: when GitHub Actions publishes a `v*` tag, the tag name is
> used as the artifact version automatically (`vX.Y.Z` → installer
> `DSH Desktop_X.Y.Z_x64-setup.exe`); local runs / manual dispatch without a
> version use the version checked into `tauri.conf.json`.

Remote source is cached in `repo-cache/deepseek-harness/` (shallow clone; subsequent runs do an incremental fetch and never touch your local dev checkout).

**Bundled Node / pnpm runtime**: `release.mjs` copies the current platform's node executable and required files from the Node installation used by the build machine into `node-runtime/`, then stages pinned `pnpm@11.22.0` from the registry as the app-private plugin package manager. Globally installed packages from the build machine are never copied.

### Two source modes

| Mode | Behavior | When to use |
| --- | --- | --- |
| **Default (remote)** | `git fetch` → `pnpm install` → `pnpm run build` → deploy… | no local clone / want latest / CI |
| **`--local`** | checks for built artifacts (`apps/cli/lib/bin.js` etc.): **already built → skips install+build and packages directly**; if not built, needs `--rebuild-repo` | local clone already built — near-instant packaging |

### Pipeline (remote mode, 13 steps)

0. `git fetch` remote source (default `master`; `--ref` pins a tag/branch/commit)
1. `pnpm install` (frozen lockfile)
2. `pnpm run build` (remote clones carry source only — lib/dist are not git-tracked — so a build is required)
3. `pnpm deploy` generates the self-contained runtime `rt/` from the DSH repo
4. `patch-runtime` restores runtime-needed deps that pnpm deploy pruned
5. `ensure node-runtime` copies the current platform's core runtime files from the system Node installation
6. `bundle-marketplace` resolves and bundles an offline build-time `dshmarket@latest` seed
   (recording the exact version in the seed manifest) and pins private `pnpm@11.22.0`
7. installs the fallback and market profile install/migration scripts
8. `trim-runtime` strips maps/types/sources
9. `prune-rt` **auto-scans**: dependency closure + reference scan over runtime code, removing orphan packages with no references
   (removed packages are moved to `backup-pre-prune/`; Windows also backs up the previous NSIS installer first)
10. `boot-test` verifies the runtime, market route, and private pnpm
11. `tauri build` produces NSIS, DMG/`.app`, or DEB/AppImage bundles for the current OS
12. formal Linux builds additionally verify that `.deb.sig` was generated

> Every release **re-scans dependencies automatically**: when DSH updates, new deps are kept and new garbage is pruned — no manual maintenance.

### GitHub Actions, in-app updates, and macOS signing

At 02:17 UTC each day (10:17 Asia/Shanghai), the release workflow checks upstream
releases and processes one unseen `dsh-v*` version. It pins the exact tag and commit, then builds Windows,
macOS, and Linux bundles. Only after every platform succeeds does it update the checked-in
versions, `CHANGELOG.md`, and `.dsh-upstream.json`, then publish signed updater artifacts,
a `latest.json` manifest containing real update notes, and the GitHub Release. Runs are
serialized, and an interrupted release with missing assets is retried with the same version.
Pushing a `v*` tag and manual Actions builds remain supported. Manual runs store Actions
artifacts by default and publish a GitHub Release only when `publish` is enabled.
`.dsh-upstream.json` records the most recently processed upstream tag/commit and its
corresponding desktop version.

Automatic publishing requires read/write Workflow permissions under Settings → Actions →
General. If `main` is protected, allow `github-actions[bot]` to write the release-metadata
commit; otherwise the workflow stops after the platform builds.

The installed app checks
GitHub Releases in the background on each launch. The **Check for updates** button
in the Settings dialog can also trigger a manual check at any time. Results use a
non-blocking in-app status card and distinguish current, unpublished, offline, service-error,
unsupported-device, and update-available states without system message boxes. When a newer
version is available, Settings offers **Update now**; the app verifies the download with
minisign, installs it, and restarts. Background network/check failures are logged without interrupting startup.
Linux in-app updates support both AppImage and `.deb` installations. Installing a
`.deb` update may trigger the system's administrator authorization prompt.

Before using the release workflow for the first time, add the updater private key as
a repository secret:

```bash
gh auth login -h github.com
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/dsh-desktop-updater.key
```

The public key in `src-tauri/tauri.conf.json` is safe to commit. Keep and back up the
private key outside the repository; losing it prevents already-released clients from
trusting future updates. The default endpoint is
`https://github.com/314857493/dsh-desktop/releases/latest/download/latest.json`, so
release assets must be anonymously downloadable. For a private repository, use a
publicly readable HTTPS bucket or update service instead of embedding a GitHub token.

macOS builds use a full ad-hoc app signature by default so Apple Silicon does not report
browser-downloaded bundles as damaged. For public distribution, configure all of
the following repository secrets: `APPLE_SIGNING_IDENTITY`, `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`, and `APPLE_TEAM_ID`.
Tauri will then use the Developer ID certificate and submit the app for Apple
notarization. An ad-hoc signature only makes the bundle signature structurally
valid; users may still need to allow the first launch in Privacy & Security.

#### macOS says the app is damaged

Older DMGs did not sign the complete `.app` bundle. After confirming the installer
came from a trusted project release, drag the app to Applications and run once:

```bash
xattr -dr com.apple.quarantine "/Applications/DSH Desktop.app"
open "/Applications/DSH Desktop.app"
```

This bypass is only for legacy artifacts. Downloading a newly built, correctly
signed release is the preferred long-term fix.

### Artifacts

| Platform | Local bundle output |
| --- | --- |
| Windows | `src-tauri/target/release/bundle/nsis/*-setup.exe` |
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` and `bundle/macos/*.app` |
| Linux | `src-tauri/target/release/bundle/deb/*.deb` and `bundle/appimage/*.AppImage` |

Formal signed builds also produce updater `.sig` files; the macOS updater uses
`bundle/macos/*.app.tar.gz` and its signature. `updater-manifest.mjs` creates the
per-platform fragments and merges them into `latest.json`, normalizing spaces in
asset file names to dots to match GitHub Release asset naming.

## How It Works

1. The Rust shell resolves configuration (bundled `dsh/` + `node/` take precedence) and locates node and `lib/bin.js`.
2. With the bundled runtime, it runs `ensure-fallback.mjs` to make shipped packages resolvable from the profile directory, then installs the offline market seed as a profile-owned dependency and applies a profile default that disables in-market restart, while preserving user settings, existing updates, and any later user uninstall.
3. It starts the server with `web --host 127.0.0.1 --port 0` (OS-assigned port, avoiding conflicts) and prepends the bundled node dir to the child's PATH; on Windows, children run silently with `CREATE_NO_WINDOW`.
4. It watches the child's stdout for the readiness line `dsh web: http://127.0.0.1:<port>` and navigates the WebView there.
5. On exit it terminates and waits for the server. Windows uses `taskkill /T /F` plus a kill-on-close Job Object for the whole process tree; macOS/Linux sends `kill` to the server child.
6. The single-instance plugin prevents a second app instance; launching again only shows and focuses the existing window.

**Opening external links**: the DSH frontend renders external links with `target="_blank"`; the opener plugin's injected script intercepts the click and calls the Tauri IPC so the system default browser opens the URL. Because the page lives at `http://127.0.0.1:<port>` (a remote origin from Tauri's point of view), the `capabilities/remote-opener.json` remote capability must allow `plugin:opener|open_url` — otherwise the ACL silently rejects the click and nothing happens.
**Opening the config file**: goes through the DSH server's `settings.openDocument` → the OS default application (Windows relies on the `.yaml`/`.yml` file association — see Troubleshooting).

## Project Structure

```
dsh-desktop/
├── src-tauri/            # Tauri shell (Rust)
│   ├── src/lib.rs        # config resolution / server launch / navigation / process cleanup
│   ├── tauri.conf.json   # window, resources (rt→dsh, node-runtime→node, icon.ico)
│   ├── capabilities/     # permissions: default + remote-opener (loopback URL may open external links)
│   ├── nsis/hooks.nsh    # desktop shortcut on install (points at the standalone ico)
│   └── icons/            # icon assets (generated from the official SVG)
├── dist/                 # splash page (loading page shown before the server is ready)
├── scripts/
│   ├── release.mjs            # one-command release (remote/local, 13 steps)
│   ├── release-metadata.mjs   # upstream detection, version bump, changelog / release notes
│   ├── updater-manifest.mjs   # creates/merges cross-platform latest.json metadata
│   ├── patch-runtime.mjs      # restores runtime-needed deps pruned by deploy
│   ├── bundle-marketplace.mjs # bundles latest community market seed + pinned private pnpm
│   ├── trim-runtime.mjs       # strips maps/types/sources
│   ├── prune-rt.mjs           # auto orphan-dep pruning (closure + reference scan)
│   ├── ensure-fallback.mjs    # links bundled packages into DSH_HOME at launch
│   ├── ensure-marketplace.mjs # installs/migrates profile market; preserves updates/uninstall
│   ├── boot-test.mjs          # runtime + marketplace smoke test
│   ├── gen-app-icon-svg.mjs   # generates icons from the official SVG (uses glyph-path.txt)
│   ├── repair-session-log.mjs # session-log repair (rebuilds contiguous seq after dual-writer corruption)
│   ├── test-open-document.mjs # e2e check of the open-config-file path (TEST_NODE/TEST_BIN point at a runtime)
│   └── analyze-session-log.mjs # session-log structure analysis
├── launch-dsh-desktop.cmd # portable launcher
├── .dsh-upstream.json     # last processed upstream tag/commit and desktop version
├── CHANGELOG.md           # desktop and bundled-DSH release history
└── README.md
```

> `rt/`, `node-runtime/`, `repo-cache/`, `backup-pre-prune/` are local generated/cache directories and are not committed (see `.gitignore`); run `node scripts/release.mjs` after cloning to build the artifacts.

## Troubleshooting

- **App log**: `dsh-desktop.log` in the platform app-log directory (server stdout/stderr and startup resolution info).
- **Session history fails to load** (`corrupt session log: seq gap ...`): caused by two instances writing the same session. Fix with `node scripts/repair-session-log.mjs <session.jsonl.zstd>` (keeps the live timeline and aligns with the running instance's counter); back up the file first.
- **Desktop icon does not update**: clear the Windows icon cache (delete `IconCache.db` and restart Explorer); shortcuts already point at the standalone `dsh-desktop.ico`.
- **External link clicks do nothing**: the opener plugin depends on the remote capability (see How It Works). Make sure the installed build includes `capabilities/remote-opener.json` (from `v0.2.x`); reinstall if you are on an older build.
- **The market opens but cannot install**: check the pnpm status at the top of the market page. New builds bundle a private pnpm; if it is still unavailable, reinstall in case security software quarantined `node/pnpm`, then inspect `dsh-desktop.log`. Catalog/package download failures usually require restoring npm/GitHub network access and retrying.
- **"Open config file" does nothing (Windows)**: DSH opens files through the extension association on Windows; if `.yaml`/`.yml` has no default association, the system silently ignores the request. Set a per-user association, e.g. open with Cursor (matches "Open with → Cursor"):

  ```bat
  reg add HKCU\Software\Classes\.yaml /ve /d Cursor.yaml /f
  reg add HKCU\Software\Classes\.yml  /ve /d Cursor.yml /f
  ```

  You can use any registered progid instead (VS Code is usually `VSCode.yaml`, Notepad is `txtfile`).
- **Restore an incorrectly pruned dependency**: `backup-pre-prune/` holds packages moved out by `prune-rt`; Windows packaging also keeps the previous NSIS installer there.
