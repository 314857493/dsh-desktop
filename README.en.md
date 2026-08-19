# DSH Desktop

> **English** | [简体中文](README.md)

A desktop extension of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): a Tauri native window shell that hosts the DSH Web GUI. It launches the `dsh web` Node server, loads the UI into a WebView2 window once the server is ready, and shuts the server down when the window closes.

This project does **not modify the DSH core** — the agent loop, tool calling, session persistence, etc. all come from upstream DSH. This repository provides the desktop shell, self-contained packaging, and automated release tooling (build, pruning, smoke test, installer).

## Features

- 🖥️ **One-click desktop launch** — double-click to run; no console popups (child processes use `CREATE_NO_WINDOW`)
- 🔒 **Isolated data directory** — uses a dedicated `~/.dsh-desktop` by default, separate from the browser GUI (`~/.dsh`), avoiding session-log corruption from two instances writing the same session
- 🧹 **Reliable process cleanup** — kills the process tree with `taskkill /T /F` on exit plus a Windows Job Object with kill-on-close (even if the app is force-killed or crashes, the OS cleans up the server tree — no orphans)
- 🔗 **External links go to the system browser** — links in answers/settings open in the default browser (opener plugin + a loopback remote capability); the config file opens in the default editor
- 📦 **Self-contained distribution** — bundles a Node.js runtime and a pruned DSH runtime; end users install nothing
- ⚙️ **Configurable** — four-level precedence: bundled resources < config file < env vars < CLI args
- 🔄 **Tracks upstream** — the release script pulls DSH source from the official repository and can pin a tag/branch

## Requirements

### Runtime (end users)

| Requirement | Notes |
| --- | --- |
| OS | Windows 10/11 x64 |
| WebView2 runtime | Auto-detected/installed by the installer (usually preinstalled on Win11) |
| Node.js | **Not needed** (bundled with the installer) |
| DSH source | **Not needed** (a pruned DSH runtime is bundled) |

### Build / release (developers)

| Dependency | Version | Purpose |
| --- | --- | --- |
| OS | Windows 10/11 x64 | NSIS installer packaging |
| Node.js | ≥ 22 | Runs the release scripts / source for the bundled runtime |
| pnpm | matches the repo lockfile | dependency install and deploy |
| Rust | stable (MSVC target) | compiles the Tauri shell |
| VS Build Tools | C++ workload | Rust linking (link.exe) |
| `@tauri-apps/cli` | ≥ 2 | tauri packaging |
| git | any | remote source fetch |

> The build machine needs Node (the release script copies core files from it into the installer); **end users do not**.

## Quick Start

- **Installed**: double-click "DSH Desktop" on the desktop/Start Menu.
- **Installer**: `src-tauri/target/release/bundle/nsis/DSH Desktop_0.1.0_x64-setup.exe`
- **Portable**: `src-tauri/target/release/dsh-desktop.exe`, copy it together with the adjacent `dsh/` and `node/` directories (the bundled runtimes).

## Distribution Forms

### 1. Self-contained (for end users, recommended)

The installer bundles a Node.js runtime (`node-runtime/` → installed as `node/`) and a pruned DSH runtime (`rt/` → installed as `dsh/`; sources/maps/types/orphan deps stripped, ~200 MB). End users **install nothing** — just run it. Installer is ~**57 MB**.

### 2. Source mode (local / developer use)

When bundled resources are missing, the app falls back to an external DSH checkout + system Node:

- **DSH source directory**: configured explicitly (defaults to the `DSH_DESKTOP_DSH_ROOT` env var; if empty and no bundled resources exist, the app errors with configuration hints). It can also point at `repo-cache/deepseek-harness/` fetched and built by `release.mjs`. The checkout must have been built with `pnpm run build` (or at least `build:lib` + `build:web`) and contain `apps/cli/lib/bin.js` (or `lib/bin.js`).
- **Node.js ≥ 22**: auto-detected from PATH, fnm install dirs, or standard locations; can also be configured.

## Configuration

Precedence: **bundled resources < config file < env vars < CLI args**.

Config file: `{app_config_dir}/dsh-desktop.json` (Tauri app config dir), e.g.:

```json
{
  "dsh_root": "<DSH source dir, e.g. repo-cache/deepseek-harness fetched by release.mjs>",
  "node": "<absolute path to node.exe (optional, auto-detected by default)>",
  "dsh_home": "<DSH_HOME data dir (optional, defaults to ~/.dsh-desktop)>"
}
```

> `dsh_root` just needs to point at the source repo root (a local clone, `repo-cache/deepseek-harness` fetched by the release script, or any built checkout); the directory must contain `apps/cli/lib/bin.js`.

Environment variables:

| Variable | Meaning |
| --- | --- |
| `DSH_DESKTOP_DSH_ROOT` | DSH runtime / source directory |
| `DSH_DESKTOP_NODE` | absolute path to node.exe |
| `DSH_DESKTOP_HOME` | DSH_HOME (defaults to `~/.dsh-desktop`, isolated from the browser GUI's `~/.dsh`) |

CLI args: `dsh-desktop.exe --dsh-root <path> [--node <path>] [--home <path>]`

> **Data isolation**: the desktop app defaults to a dedicated `~/.dsh-desktop` to avoid corrupting session logs by writing the same session from two instances (DSH requires one live writer per session). To share history, set `dsh_home` to `~/.dsh` explicitly — but never let both instances process messages for the same session at the same time.

## Build / Release (fully automated)

```bash
# One-command release (default: fetch DSH source from GitHub → build → package; automated, cross-platform)
node scripts/release.mjs

# Pin a remote ref (tag / branch / commit)
node scripts/release.mjs --ref v0.1.0

# Use a local clone (offline): skips install/build if already built (fastest path)
node scripts/release.mjs --local
node scripts/release.mjs --repo <local DSH source path>
node scripts/release.mjs --local --rebuild-repo   # rebuild the local source first

# Custom remote URL / silent install after build (Windows) / skip smoke test / stamp version
node scripts/release.mjs --remote-url <url>
node scripts/release.mjs --install
node scripts/release.mjs --skip-boot-test
node scripts/release.mjs --no-updater       # test installer on a dev machine; no updater key required
node scripts/release.mjs --version 0.1.4   # artifact version (syncs tauri.conf.json + Cargo.toml; a leading `v` is stripped)
```

> **Development packaging**: `--no-updater` still prepares the runtime, runs the
> smoke test, and builds the platform installer, but temporarily disables updater
> artifacts through `src-tauri/tauri.no-updater.conf.json`. It produces no `.sig`,
> so Windows, macOS, and Ubuntu development machines do not need the updater private
> key. Do not use this option for a formal release.

> **Artifact version**: when GitHub Actions publishes a `v*` tag, the tag name is
> used as the artifact version automatically (`v0.1.4` → installer
> `DSH Desktop_0.1.4_x64-setup.exe`); local runs / manual dispatch without a
> version use the version checked into `tauri.conf.json`.

Remote source is cached in `repo-cache/deepseek-harness/` (shallow clone; subsequent runs do an incremental fetch and never touch your local dev checkout).

**Bundled Node runtime**: `release.mjs` copies the **core files** from your system Node install (`node.exe` + npm/npx/corepack, ~100 MB) into `node-runtime/` — **no download**, and your globally installed npm packages never leak into the installer. It is shipped with the installer, so end users don't need Node.

### Two source modes

| Mode | Behavior | When to use |
| --- | --- | --- |
| **Default (remote)** | `git fetch` → `pnpm install` → `pnpm run build` → deploy… | no local clone / want latest / CI |
| **`--local`** | checks for built artifacts (`apps/cli/lib/bin.js` etc.): **already built → skips install+build and packages directly**; if not built, needs `--rebuild-repo` | local clone already built — near-instant packaging |

### Pipeline (remote mode, 12 steps)

0. `git fetch` remote source (default `master`; `--ref` pins a tag/branch/commit)
1. `pnpm install` (frozen lockfile)
2. `pnpm run build` (remote clones carry source only — lib/dist are not git-tracked — so a build is required)
3. `pnpm deploy` generates the self-contained runtime `rt/` from the DSH repo
4. `patch-runtime` restores runtime-needed deps that pnpm deploy pruned
5. installs `ensure-fallback.mjs`
6. `trim-runtime` strips maps/types/sources
7. `prune-rt` **auto-scans**: dependency closure + reference scan over runtime code, removing orphan packages with no references
   (the previous installer is auto-backed up to `backup-pre-prune/`; referenced/undeclared runtime deps such as tsx are kept automatically)
8. `ensure node-runtime` copies core Node files from the system install (node.exe + npm/corepack)
9. `boot-test` runtime smoke test (boots the server, waits for the ready line)
10. `tauri build` produces the installer
11. Linux builds additionally sign the `.deb` updater artifact

> Every release **re-scans dependencies automatically**: when DSH updates, new deps are kept and new garbage is pruned — no manual maintenance.

### GitHub Actions, in-app updates, and macOS signing

The release workflow builds and publishes Windows, macOS, and Linux bundles, signed
updater artifacts, and a static `latest.json` manifest. The installed app checks
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

- Installer: `src-tauri/target/release/bundle/nsis/DSH Desktop_0.1.0_x64-setup.exe` (~57 MB)
- Portable: `src-tauri/target/release/dsh-desktop.exe` + `dsh/` + `node/` directories

## How It Works

1. The Rust shell resolves configuration (bundled `dsh/` + `node/` take precedence) and locates node and `lib/bin.js`.
2. With the bundled runtime, it first runs `ensure-fallback.mjs`, which links all `@deepseek-ai` packages into `$DSH_HOME/profiles/node_modules` so the Cordis loader can resolve packages from the config directory (pnpm deploy output lacks the per-package repo-style links — this is a required fix-up).
3. It starts the server with `web --host 127.0.0.1 --port 0` (OS-assigned port, avoiding conflicts) and prepends the bundled node dir to the child's PATH; children run silently with `CREATE_NO_WINDOW`.
4. It watches the child's stdout for the readiness line `dsh web: http://127.0.0.1:<port>` and navigates the WebView there.
5. On exit it kills the process tree with `taskkill /T /F`; the child is also in a Windows Job Object with kill-on-close — the server is cleaned up no matter how the app exits (close/crash/force-kill).

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
│   ├── release.mjs            # one-command release (remote/local, 12 steps)
│   ├── patch-runtime.mjs      # restores runtime-needed deps pruned by deploy
│   ├── trim-runtime.mjs       # strips maps/types/sources
│   ├── prune-rt.mjs           # auto orphan-dep pruning (closure + reference scan)
│   ├── ensure-fallback.mjs    # links bundled packages into DSH_HOME at launch
│   ├── boot-test.mjs          # runtime smoke test
│   ├── gen-app-icon-svg.mjs   # generates icons from the official SVG (uses glyph-path.txt)
│   ├── repair-session-log.mjs # session-log repair (rebuilds contiguous seq after dual-writer corruption)
│   ├── test-open-document.mjs # e2e check of the open-config-file path (TEST_NODE/TEST_BIN point at a runtime)
│   └── analyze-session-log.mjs # session-log structure analysis
├── launch-dsh-desktop.cmd # portable launcher
└── README.md
```

> `rt/`, `node-runtime/`, `repo-cache/`, `backup-pre-prune/` are local generated/cache directories and are not committed (see `.gitignore`); run `node scripts/release.mjs` after cloning to build the artifacts.

## Troubleshooting

- **App log**: `dsh-desktop.log` in the platform app-log directory (server stdout/stderr and startup resolution info).
- **Session history fails to load** (`corrupt session log: seq gap ...`): caused by two instances writing the same session. Fix with `node scripts/repair-session-log.mjs <session.jsonl.zstd>` (keeps the live timeline and aligns with the running instance's counter); back up the file first.
- **Desktop icon does not update**: clear the Windows icon cache (delete `IconCache.db` and restart Explorer); shortcuts already point at the standalone `dsh-desktop.ico`.
- **External link clicks do nothing**: the opener plugin depends on the remote capability (see How It Works). Make sure the installed build includes `capabilities/remote-opener.json` (from `v0.2.x`); reinstall if you are on an older build.
- **"Open config file" does nothing (Windows)**: DSH opens files through the extension association on Windows; if `.yaml`/`.yml` has no default association, the system silently ignores the request. Set a per-user association, e.g. open with Cursor (matches "Open with → Cursor"):

  ```bat
  reg add HKCU\Software\Classes\.yaml /ve /d Cursor.yaml /f
  reg add HKCU\Software\Classes\.yml  /ve /d Cursor.yml /f
  ```

  You can use any registered progid instead (VS Code is usually `VSCode.yaml`, Notepad is `txtfile`).
- **Rollback**: `backup-pre-prune/` holds previous installers and the complete pre-prune `rt/`.
