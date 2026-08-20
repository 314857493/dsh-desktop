//! DSH Desktop — a Tauri shell that launches the DeepSeek Harness web server
//! (`dsh web`) and hosts its GUI in a native window.
//!
//! Lifecycle:
//!   1. Resolve configuration (bundled resources < config file
//!      < env vars < CLI args): DSH runtime root, node.exe, DSH_HOME.
//!   2. If the resolved root is the bundled runtime, run its preparation
//!      scripts: `ensure-fallback.mjs` makes shipped packages resolvable from
//!      profiles, and `ensure-marketplace.mjs` mounts the preinstalled plugin
//!      market once without overriding a later user uninstall.
//!   3. Spawn `node <root>/lib/bin.js web --host 127.0.0.1 --port 0`, adding
//!      `--no-open` when supported, with the resolved environment (bundled node
//!      dir prepended to PATH).
//!   4. Watch the child's stdout for the readiness line
//!      `dsh web: http://127.0.0.1:<port>` and navigate the webview there.
//!   5. On app exit, kill the child process tree.

use std::{
    env,
    fs::{self, OpenOptions},
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{Mutex, OnceLock},
    thread,
    time::{Duration, SystemTime},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, RunEvent, State, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Windows: spawn console-subsystem children (node, taskkill, ...) without a
/// visible console window. Without this flag a GUI app's console children get
/// their own terminal window, which flashes an ugly AppData path at startup.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn hide_console(command: &mut Command) {
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);
    #[cfg(not(windows))]
    let _ = command;
}

/// The Windows Job Object whose processes are killed when this process exits
/// (however it dies: graceful close, crash, or forced kill). The job handle
/// is deliberately kept open for the app's lifetime.
#[cfg(windows)]
static KILL_JOB: OnceLock<usize> = OnceLock::new();

/// Windows: assign the server process to a kill-on-close Job Object so the
/// node server tree can never outlive the app as an orphaned writer.
#[cfg(windows)]
fn assign_kill_on_close_job(child: &Child) {
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };
    unsafe {
        let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
        if job.is_null() {
            return;
        }
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        let ok = SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &info as *const _ as *const core::ffi::c_void,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        );
        if ok == 0 {
            CloseHandle(job);
            return;
        }
        let assigned =
            AssignProcessToJobObject(job, child.as_raw_handle() as *mut core::ffi::c_void);
        if assigned == 0 {
            CloseHandle(job);
            return; // e.g. the child is already in a job that blocks nesting
        }
        // Keep the handle open: when this process exits, the OS kills the job.
        let _ = KILL_JOB.set(job as usize);
    }
}

/// Prefix of the readiness line `dsh web` prints once the server is up.
const URL_LINE_PREFIX: &str = "dsh web: ";

/// Normal title restored after temporary updater progress is shown.
const APP_WINDOW_TITLE: &str = "DeepSeek Harness";

/// Injected after every finished page load. It routes external `window.open`
/// calls through the opener plugin and mounts the desktop shell's manual
/// updater button inside the Settings dialog's existing header-action seat.
/// The button therefore never floats over the primary conversation surface.
const PAGE_SHIM: &str = r#"
(() => {
  const invoke = window.__TAURI_INTERNALS__?.invoke;

  if (!window.__dshOpenShimmed) {
    window.__dshOpenShimmed = true;
    const original = window.open;
    window.open = function (url, target, features) {
      try {
        if (typeof url === 'string' && url.trim() !== '') {
          const u = new URL(url, window.location.href);
          if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:' || u.protocol === 'tel:') {
            invoke?.('plugin:opener|open_url', { url: u.href }).catch(() => {});
            return null;
          }
        }
      } catch { /* fall through to the native open below */ }
      return typeof original === 'function' ? original.apply(this, arguments) : null;
    };
  }

  const findSettingsContext = () => {
    const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    for (const dialog of dialogs) {
      const titleId = dialog.getAttribute('aria-labelledby');
      const title = titleId ? document.getElementById(titleId)?.textContent?.trim() : '';
      if (title !== '设置' && title !== 'Settings') continue;
      const close = [...dialog.querySelectorAll('button')].find((candidate) => {
        const text = candidate.textContent?.trim();
        return text === '关闭' || text === 'Close';
      });
      if (close?.previousElementSibling instanceof HTMLElement && close.parentElement instanceof HTMLElement) {
        return { dialog, actions: close.previousElementSibling, header: close.parentElement, english: title === 'Settings' };
      }
    }
    return null;
  };

  let feedbackTimer;
  const removeUpdateFeedback = () => {
    window.clearTimeout(feedbackTimer);
    document.getElementById('dsh-desktop-update-feedback')?.remove();
  };

  const renderUpdateFeedback = (context, result) => {
    removeUpdateFeedback();
    const status = result?.status || 'serviceError';
    const englishCopy = {
      latest: { title: 'You’re up to date', message: 'You’re running the latest available version.' },
      unpublished: { title: 'No updates available', message: 'The update channel does not have an installable release yet.' },
      offline: { title: 'Can’t reach the update service', message: 'Check your network connection, then try again.' },
      incompatible: { title: 'No compatible update yet', message: 'An update exists, but there is no installer for this system and architecture yet.' },
      available: { title: 'A new version is available', message: `Version ${result?.availableVersion || ''} is ready to download, verify, and install.` },
      serviceError: { title: 'Update service unavailable', message: 'The update service can’t respond right now. The app is still available; please try again later.' },
      installError: { title: 'Update didn’t finish', message: 'The update could not be downloaded or installed. Run Check for updates before trying again.' },
    }[status];
    const displayTitle = context.english ? englishCopy?.title : result?.title;
    const displayMessage = context.english ? englishCopy?.message : result?.message;
    const palette = {
      latest: { icon: '✓', color: '#16853f', background: 'rgba(22, 133, 63, 0.08)' },
      unpublished: { icon: 'i', color: '#52606d', background: 'rgba(82, 96, 109, 0.08)' },
      offline: { icon: '↓', color: '#a15c00', background: 'rgba(161, 92, 0, 0.09)' },
      incompatible: { icon: 'i', color: '#a15c00', background: 'rgba(161, 92, 0, 0.09)' },
      available: { icon: '↑', color: '#1769d2', background: 'rgba(23, 105, 210, 0.09)' },
      serviceError: { icon: '!', color: '#c03737', background: 'rgba(192, 55, 55, 0.08)' },
      installError: { icon: '!', color: '#c03737', background: 'rgba(192, 55, 55, 0.08)' },
    }[status] || { icon: '!', color: '#c03737', background: 'rgba(192, 55, 55, 0.08)' };

    const feedback = document.createElement('div');
    feedback.id = 'dsh-desktop-update-feedback';
    const isError = status === 'serviceError' || status === 'installError';
    feedback.setAttribute('role', isError ? 'alert' : 'status');
    feedback.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    Object.assign(feedback.style, {
      position: 'relative',
      flex: 'none',
      width: 'auto',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: '24px minmax(0, 1fr) auto',
      columnGap: '10px',
      rowGap: '4px',
      margin: '0 24px 12px',
      padding: '12px',
      border: '1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22))',
      borderRadius: '12px',
      background: 'var(--dsw-alias-bg-layer-2, #fff)',
      color: 'var(--dsw-alias-label-primary, currentColor)',
      boxShadow: '0 8px 28px rgba(0, 0, 0, 0.14)',
      fontSize: '12px',
      lineHeight: '18px',
    });

    const icon = document.createElement('span');
    icon.textContent = palette.icon;
    Object.assign(icon.style, {
      gridRow: '1 / span 2',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: palette.background,
      color: palette.color,
      fontWeight: '700',
      fontSize: '13px',
    });

    const title = document.createElement('strong');
    title.textContent = displayTitle || (context.english ? 'Update status unavailable' : '更新状态未知');
    title.style.fontSize = '13px';
    title.style.fontWeight = '600';

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.title = context.english ? 'Dismiss' : '关闭提示';
    close.setAttribute('aria-label', context.english ? 'Dismiss update status' : '关闭更新提示');
    Object.assign(close.style, {
      width: '20px',
      height: '20px',
      padding: '0',
      border: '0',
      background: 'transparent',
      color: 'var(--dsw-alias-label-secondary, #68707a)',
      cursor: 'pointer',
      fontSize: '16px',
      lineHeight: '20px',
    });
    close.addEventListener('click', removeUpdateFeedback);

    const message = document.createElement('div');
    message.textContent = displayMessage || (context.english ? 'Please try again later.' : '请稍后重试。');
    Object.assign(message.style, {
      gridColumn: '2 / 4',
      color: 'var(--dsw-alias-label-secondary, #68707a)',
      overflowWrap: 'anywhere',
    });

    feedback.append(icon, title, close, message);

    if (status === 'available') {
      const install = document.createElement('button');
      install.type = 'button';
      install.textContent = context.english ? 'Update now' : '立即更新';
      Object.assign(install.style, {
        gridColumn: '2 / 4',
        justifySelf: 'start',
        marginTop: '6px',
        height: '28px',
        padding: '0 12px',
        border: '0',
        borderRadius: '14px',
        background: 'var(--dsw-alias-interactive-primary, #1769d2)',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
      });
      install.addEventListener('click', async () => {
        install.disabled = true;
        install.textContent = context.english ? 'Downloading…' : '正在下载更新…';
        install.style.cursor = 'wait';
        title.textContent = context.english ? 'Preparing the update' : '正在准备更新';
        message.textContent = context.english
          ? 'The installer will be downloaded and verified first. The app restarts automatically when installation finishes.'
          : '将先下载并校验安装包，完成后应用会自动重启。';
        try {
          await invoke('install_available_update');
        } catch (error) {
          console.error('[updater] install command failed', error);
          renderUpdateFeedback(context, {
            status: 'installError',
            title: '更新未完成',
            message: typeof error === 'string' && error.trim() ? error : '更新下载或安装未能完成，应用仍可继续使用。',
          });
        }
      });
      feedback.appendChild(install);
    }

    // The Settings content column is a flex stack: header, then options.
    // Insert the card in that flow so it shortens the scrollable options area
    // instead of covering the first settings rows.
    context.header.insertAdjacentElement('afterend', feedback);

    if (status !== 'available') {
      feedbackTimer = window.setTimeout(removeUpdateFeedback, status === 'latest' ? 4000 : 6500);
    }
  };

  const presentCachedUpdate = async () => {
    const context = findSettingsContext();
    const button = document.getElementById('dsh-desktop-update-button');
    if (!context || !(button instanceof HTMLButtonElement)) return;
    try {
      const result = await invoke('get_cached_update_status');
      if (result?.status !== 'available' || !context.dialog.isConnected) return;
      button.dataset.updateAvailable = 'true';
      if (!button.disabled) {
        button.textContent = context.english ? '↑ Update available' : '↑ 有新版本';
        button.title = context.english ? 'A DSH Desktop update is available' : 'DSH Desktop 有可用更新';
        button.setAttribute('aria-label', button.title);
      }
      renderUpdateFeedback(context, result);
    } catch (error) {
      console.error('[updater] cached status command failed', error);
    }
  };

  const mountUpdateButton = () => {
    if (typeof invoke !== 'function' || !document.body) return;
    const context = findSettingsContext();
    if (!context) return;
    const language = context.english ? 'en' : 'zh';
    const existing = document.getElementById('dsh-desktop-update-button');
    if (existing instanceof HTMLButtonElement) {
      // Language can change while Settings remains open. Recreate our
      // shell-owned controls so their visible and accessible copy follows it.
      if (existing.dataset.updateLanguage === language) return;
      removeUpdateFeedback();
      existing.remove();
    }
    const { actions } = context;
    const ui = context.english
      ? { idle: '↻ Check for updates', available: '↑ Update available', checking: 'Checking…', title: 'Check for DSH Desktop updates', availableTitle: 'A DSH Desktop update is available' }
      : { idle: '↻ 检查更新', available: '↑ 有新版本', checking: '正在检查…', title: '检查 DSH Desktop 更新', availableTitle: 'DSH Desktop 有可用更新' };

    const button = document.createElement('button');
    button.id = 'dsh-desktop-update-button';
    button.type = 'button';
    button.dataset.updateLanguage = language;
    button.textContent = ui.idle;
    button.title = ui.title;
    button.setAttribute('aria-label', ui.title);
    const peerAction = actions.querySelector('button');
    if (peerAction?.className) {
      // Adopt DSH's own outline/small Button classes (the neighboring
      // "Open config file" action), so themes and future token changes match.
      button.className = peerAction.className;
    } else {
      // The neighboring async action may not have loaded yet. This fallback is
      // the same Button outline/small token contract, not a guessed color.
      Object.assign(button.style, {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '28px',
        padding: '0 10px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: '14px',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary, currentColor)',
        fontSize: '12px',
        lineHeight: '18px',
        cursor: 'pointer',
      });
    }
    button.style.flex = 'none';
    button.style.transition = 'opacity 120ms ease, background 120ms ease';
    const setIdleLabel = () => {
      const available = button.dataset.updateAvailable === 'true';
      button.textContent = available ? ui.available : ui.idle;
      button.title = available ? ui.availableTitle : ui.title;
      button.setAttribute('aria-label', button.title);
    };
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) button.style.background = 'var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12))';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
    });
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = ui.checking;
      button.style.cursor = 'wait';
      button.style.opacity = '0.72';
      removeUpdateFeedback();
      try {
        const result = await invoke('check_for_updates_manual');
        button.dataset.updateAvailable = result?.status === 'available' ? 'true' : 'false';
        renderUpdateFeedback(context, result);
      } catch (error) {
        console.error('[updater] manual check command failed', error);
        renderUpdateFeedback(context, {
          status: 'serviceError',
          title: '暂时无法检查更新',
          message: '更新功能暂时不可用，请重启应用后再试。',
        });
      } finally {
        button.disabled = false;
        setIdleLabel();
        button.style.cursor = 'pointer';
        button.style.opacity = '1';
      }
    });
    actions.appendChild(button);

    // The startup check is silent and non-blocking. If it found a release,
    // surface it the next time Settings opens instead of interrupting work.
    presentCachedUpdate();
  };

  const watchForSettings = () => {
    mountUpdateButton();
    new MutationObserver(mountUpdateButton).observe(document.body, { childList: true, subtree: true });
  };
  window.addEventListener('dsh-desktop-update-available', presentCachedUpdate);
  if (document.body) watchForSettings();
  else document.addEventListener('DOMContentLoaded', watchForSettings, { once: true });
})();
"#;

/// Managed handle to the spawned server process (killed on app exit).
struct ServerHandle(Mutex<Option<Child>>);

/// Latest actionable result from the automatic startup check. Only an
/// available release is cached; normal no-update and transient error states
/// remain silent until the user explicitly checks in Settings.
struct UpdateStatusState(Mutex<Option<ManualUpdateResult>>);

/// Where the app writes its diagnostics (the OS app-log directory).
static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

/// tauri's resource/executable dirs can return `\\?\`-prefixed paths on NSIS
/// installs; Node.js cannot load scripts or resolve files through those, so
/// strip the prefix before any filesystem use.
fn normalize_path(path: PathBuf) -> PathBuf {
    let text = path.to_string_lossy();
    let stripped = text
        .strip_prefix(r"\\?\")
        .or_else(|| text.strip_prefix(r"\??\"))
        .unwrap_or(&text);
    PathBuf::from(stripped)
}

fn log(message: &str) {
    let Some(path) = LOG_PATH.get() else { return };
    let line = format!(
        "[{}] {message}\n",
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .map(|d| d.as_millis().to_string())
            .unwrap_or_else(|_| "?".into())
    );
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = file.write_all(line.as_bytes());
    }
}

/// User-facing configuration. Order of precedence for each field:
/// bundled resources < config file `{app_config_dir}/dsh-desktop.json`
/// < `DSH_DESKTOP_*` env vars < `--dsh-root` / `--node` / `--home` CLI args.
#[derive(Debug, Default, Deserialize)]
struct AppConfig {
    /// Absolute path to a DSH runtime (must contain lib/bin.js).
    dsh_root: Option<String>,
    /// Absolute path to a node.exe.
    node: Option<String>,
    /// Optional DSH_HOME override (defaults to the isolated `~/.dsh-desktop`).
    dsh_home: Option<String>,
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

fn config_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("dsh-desktop.json")
}

fn load_config(app: &AppHandle) -> AppConfig {
    let mut config = AppConfig::default();

    if let Ok(text) = fs::read_to_string(config_path(app)) {
        if let Ok(parsed) = serde_json::from_str::<AppConfig>(&text) {
            config = parsed;
        }
    }

    let apply_env = |name: &str, slot: &mut Option<String>| {
        if let Ok(value) = env::var(name) {
            if !value.trim().is_empty() {
                *slot = Some(value);
            }
        }
    };
    apply_env("DSH_DESKTOP_DSH_ROOT", &mut config.dsh_root);
    apply_env("DSH_DESKTOP_NODE", &mut config.node);
    apply_env("DSH_DESKTOP_HOME", &mut config.dsh_home);

    let mut args = env::args().skip(1);
    while let Some(arg) = args.next() {
        let value = args.next();
        match arg.as_str() {
            "--dsh-root" => value.map(|v| config.dsh_root = Some(v)),
            "--node" => value.map(|v| config.node = Some(v)),
            "--home" => value.map(|v| config.dsh_home = Some(v)),
            _ => None,
        };
    }

    config
}

/// The bundled self-contained runtime, when this build ships one.
fn bundled_runtime(app: &AppHandle) -> Option<PathBuf> {
    let res = app.path().resource_dir().ok()?;
    let root = normalize_path(res.join("dsh"));
    if root.join("lib").join("bin.js").is_file() {
        Some(root)
    } else {
        None
    }
}

fn bundled_node(app: &AppHandle) -> Option<PathBuf> {
    let res = app.path().resource_dir().ok()?;
    let exe_name = if cfg!(windows) { "node.exe" } else { "node" };
    let node = normalize_path(res.join("node").join(exe_name));
    if node.is_file() {
        Some(node)
    } else {
        None
    }
}

fn resolve_dsh_root(app: &AppHandle, configured: Option<String>) -> Result<PathBuf, String> {
    if let Some(bundled) = bundled_runtime(app) {
        return Ok(bundled);
    }
    let root = match configured {
        Some(path) => PathBuf::from(path),
        None => {
            return Err(
                "没有内置运行时，且未配置 DSH 源码目录。\n请设置配置文件里的 dsh_root、\
                 环境变量 DSH_DESKTOP_DSH_ROOT，或用 --dsh-root 参数指定已构建的 DSH 源码目录。"
                    .into(),
            )
        }
    };
    let bin = root.join("lib").join("bin.js");
    if !bin.is_file() {
        let repo_bin = root.join("apps").join("cli").join("lib").join("bin.js");
        if !repo_bin.is_file() {
            return Err(format!(
                "找不到 DSH 入口（lib/bin.js）: {}。\n请确认路径正确，且 DSH 已构建（pnpm run build）。",
                root.display()
            ));
        }
        return Ok(root);
    }
    Ok(root)
}

/// Parse a `vX.Y.Z` version from a path and compare numerically.
fn version_tuple(path: &Path) -> Option<(u64, u64, u64)> {
    let name = path.parent()?.parent()?.file_name()?.to_string_lossy();
    let name = name.trim_start_matches('v');
    let mut parts = name.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next().unwrap_or("0").parse().ok()?;
    let patch = parts.next().unwrap_or("0").parse().ok()?;
    Some((major, minor, patch))
}

/// Default DSH_HOME for the desktop app: an isolated directory so the app
/// never shares live session storage with a browser-GUI DSH instance.
/// Sharing the same home made both instances write the same live session
/// (one live writer per session), which corrupted the session log.
/// Override via config `dsh_home`, `DSH_DESKTOP_HOME`, or `--home`.
fn default_dsh_home() -> String {
    let base = env::var_os("USERPROFILE")
        .or_else(|| env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    base.join(".dsh-desktop").to_string_lossy().into_owned()
}

fn resolve_node(app: &AppHandle, configured: Option<String>) -> Result<PathBuf, String> {
    if let Some(bundled) = bundled_node(app) {
        return Ok(bundled);
    }
    if let Some(path) = configured {
        let node = PathBuf::from(path);
        if node.is_file() {
            return Ok(node);
        }
        return Err(format!("配置的 node 不存在: {}", node.display()));
    }

    // 1) node on PATH (fnm multishell shims resolve to real node.exe here).
    let node_on_path = || -> Option<PathBuf> {
        #[cfg(windows)]
        {
            let mut where_command = Command::new("where");
            where_command.arg("node.exe");
            hide_console(&mut where_command);
            let output = where_command.output().ok()?;
            if !output.status.success() {
                return None;
            }
            let text = String::from_utf8_lossy(&output.stdout);
            let node = PathBuf::from(text.lines().next()?.trim());
            node.is_file().then_some(node)
        }
        #[cfg(not(windows))]
        {
            let output = Command::new("which").arg("node").output().ok()?;
            if !output.status.success() {
                return None;
            }
            let text = String::from_utf8_lossy(&output.stdout);
            let node = PathBuf::from(text.lines().next()?.trim());
            node.is_file().then_some(node)
        }
    };
    if let Some(node) = node_on_path() {
        return Ok(node);
    }

    // 2) fnm-installed node versions, highest version wins (Windows-only layout).
    let mut candidates: Vec<PathBuf> = Vec::new();
    #[cfg(windows)]
    for base in [env::var("APPDATA"), env::var("LOCALAPPDATA")]
        .into_iter()
        .flatten()
    {
        let versions_dir = PathBuf::from(base).join("fnm").join("node-versions");
        if let Ok(entries) = fs::read_dir(&versions_dir) {
            for entry in entries.flatten() {
                let node = entry.path().join("installation").join("node.exe");
                if node.is_file() {
                    candidates.push(node);
                }
            }
        }
    }
    if !candidates.is_empty() {
        candidates.sort_by_key(|p| version_tuple(p).unwrap_or((0, 0, 0)));
        if let Some(best) = candidates.pop() {
            return Ok(best);
        }
    }

    // 3) Standard install locations.
    for node in [
        PathBuf::from(r"C:\Program Files\nodejs\node.exe"),
        PathBuf::from(r"C:\Program Files (x86)\nodejs\node.exe"),
    ] {
        if node.is_file() {
            return Ok(node);
        }
    }

    Err("找不到 node.exe。请安装 Node.js（>= 22），或在配置文件 / 环境变量 DSH_DESKTOP_NODE 中指定 node 路径。".into())
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

const WEB_SERVER_ARGS: [&str; 5] = ["web", "--host", "127.0.0.1", "--port", "0"];

fn web_runtime_supports_no_open(root: &Path) -> bool {
    let startup = root
        .join("node_modules")
        .join("@deepseek-ai")
        .join("dsh-web-app")
        .join("lib")
        .join("startup.js");
    fs::read_to_string(startup).is_ok_and(|source| source.contains("--no-open"))
}

fn web_server_args(supports_no_open: bool) -> Vec<&'static str> {
    let mut args = WEB_SERVER_ARGS.to_vec();
    if supports_no_open {
        args.push("--no-open");
    }
    args
}

/// Run the bundled runtime's `ensure-fallback.mjs` so the Cordis loader can
/// resolve bundle packages from `$DSH_HOME/profiles`.
fn run_ensure_fallback(node: &Path, root: &Path, dsh_home: Option<&str>) -> Result<(), String> {
    let script = root.join("scripts").join("ensure-fallback.mjs");
    if !script.is_file() {
        return Ok(()); // external checkouts manage their own fallback
    }
    let mut command = Command::new(node);
    command.arg(&script).arg(root);
    if let Some(home) = dsh_home {
        command.env("DSH_HOME", home);
    }
    hide_console(&mut command);
    let status = command
        .status()
        .map_err(|err| format!("无法运行 ensure-fallback: {err}"))?;
    if !status.success() {
        return Err(format!(
            "ensure-fallback 退出码 {}；DSH 可能无法启动",
            status.code().unwrap_or(-1)
        ));
    }
    Ok(())
}

/// Activate the marketplace shipped by DSH Desktop for this profile. The
/// migration owns a marker inside the profile, so it runs once and never
/// silently reverses a later user uninstall. Marketplace failure is optional:
/// the caller logs it and continues to boot the core DSH experience.
fn run_ensure_marketplace(node: &Path, root: &Path, dsh_home: &str) -> Result<(), String> {
    let script = root.join("scripts").join("ensure-marketplace.mjs");
    if !script.is_file() {
        return Ok(()); // external/older runtimes do not ship the marketplace
    }
    let mut command = Command::new(node);
    command
        .arg(&script)
        .arg(root)
        .env("DSH_HOME", dsh_home)
        .stdin(Stdio::null());
    hide_console(&mut command);
    let status = command
        .status()
        .map_err(|err| format!("无法准备插件商城: {err}"))?;
    if !status.success() {
        return Err(format!(
            "插件商城准备脚本退出码 {}",
            status.code().unwrap_or(-1)
        ));
    }
    Ok(())
}

fn spawn_server(
    app: &AppHandle,
    window: WebviewWindow,
    root: &Path,
    node: &Path,
    dsh_home: String,
) -> Result<Child, String> {
    if let Err(message) = run_ensure_fallback(node, root, Some(&dsh_home)) {
        return Err(message);
    }
    if let Err(message) = run_ensure_marketplace(node, root, &dsh_home) {
        log(&format!(
            "[marketplace] optional preparation failed: {message}"
        ));
    } else {
        log("[marketplace] profile preparation complete");
    }

    let bin = root.join("lib").join("bin.js");
    let mut command = Command::new(node);
    let server_args = web_server_args(web_runtime_supports_no_open(root));
    command
        .arg(&bin)
        .args(server_args)
        .current_dir(root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    command.env("DSH_HOME", &dsh_home);
    // Make node findable by any child process the server spawns.
    if let Some(dir) = node.parent() {
        let current_path = env::var_os("PATH").unwrap_or_default();
        let mut search_paths = vec![dir.to_path_buf()];
        search_paths.extend(env::split_paths(&current_path));
        if let Ok(joined) = env::join_paths(search_paths) {
            command.env("PATH", joined);
        }
    }
    hide_console(&mut command);

    let mut child = command
        .spawn()
        .map_err(|err| format!("无法启动 node 服务器: {err}"))?;
    #[cfg(windows)]
    assign_kill_on_close_job(&child);

    let stdout = child.stdout.take().expect("stdout must be piped");
    let stderr = child.stderr.take().expect("stderr must be piped");

    // Drain stderr into the app log (never block the server on a full pipe).
    {
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                match line {
                    Ok(line) => log(&format!("[dsh-server:err] {line}")),
                    Err(_) => break,
                }
            }
        });
    }

    // Watch stdout for the readiness line, then navigate the webview.
    let app_handle = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        let mut navigated = false;
        for line in reader.lines() {
            let line = match line {
                Ok(line) => line,
                Err(_) => break,
            };
            log(&format!("[dsh-server:out] {line}"));
            if navigated {
                continue;
            }
            if let Some(at) = line.find(URL_LINE_PREFIX) {
                let rest = line[at + URL_LINE_PREFIX.len()..].trim();
                if let Some(url) = rest.split_whitespace().next() {
                    if url.starts_with("http://") {
                        navigated = true;
                        let target = window.clone();
                        let url = url.to_string();
                        let _ = app_handle.run_on_main_thread(move || {
                            if let Ok(parsed) = url.parse() {
                                let _ = target.navigate(parsed);
                            }
                        });
                    }
                }
            }
        }
        // stdout EOF: the server process exited.
    });

    Ok(child)
}

fn kill_process_tree(pid: u32) {
    #[cfg(windows)]
    {
        let mut command = Command::new("taskkill");
        command.args(["/PID", &pid.to_string(), "/T", "/F"]);
        hide_console(&mut command);
        let _ = command.status();
    }
    #[cfg(not(windows))]
    {
        let _ = Command::new("kill").arg(pid.to_string()).status();
    }
}

fn shutdown_server(app: &AppHandle) {
    if let Some(handle) = app.try_state::<ServerHandle>() {
        if let Ok(mut guard) = handle.0.lock() {
            if let Some(mut child) = guard.take() {
                kill_process_tree(child.id());
                let _ = child.wait();
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Application updates
// ---------------------------------------------------------------------------

/// Perform the automatic startup check. Transient failures remain in the log
/// so startup is never interrupted. Manual checks use the structured command
/// response below and render feedback inside the Settings dialog instead.
async fn run_automatic_update_check(app: AppHandle) {
    log("[updater] automatic check started");
    let updater = match app.updater() {
        Ok(updater) => updater,
        Err(error) => {
            log(&format!("[updater] initialization failed: {error}"));
            return;
        }
    };
    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => {
            log("[updater] already on the latest version");
            return;
        }
        Err(error) => {
            log(&format!("[updater] check failed: {error}"));
            return;
        }
    };

    log(&format!(
        "[updater] update available: {} -> {}",
        update.current_version, update.version
    ));
    let result = available_update_result(&update.current_version, &update.version);
    cache_actionable_update(&app, Some(result));
    if let Some(window) = app.get_webview_window("main") {
        // If Settings is already open, surface the completed automatic check
        // immediately. The Rust cache remains the fallback across page loads.
        let _ = window.eval("window.dispatchEvent(new Event('dsh-desktop-update-available'))");
    }
}

/// Check once per launch. Automatic check failures stay in the diagnostic log
/// so a temporary network or GitHub outage never interrupts startup.
fn check_for_updates(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        run_automatic_update_check(app).await;
    });
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManualUpdateResult {
    status: &'static str,
    title: &'static str,
    message: String,
    available_version: Option<String>,
}

fn cache_actionable_update(app: &AppHandle, result: Option<ManualUpdateResult>) {
    let Some(state) = app.try_state::<UpdateStatusState>() else {
        return;
    };
    match state.0.lock() {
        Ok(mut cached) => *cached = result,
        Err(error) => log(&format!("[updater] update status lock poisoned: {error}")),
    };
}

#[tauri::command]
fn get_cached_update_status(state: State<'_, UpdateStatusState>) -> Option<ManualUpdateResult> {
    state.0.lock().ok().and_then(|cached| cached.clone())
}

fn take_cached_update_version(state: &UpdateStatusState) -> Result<String, String> {
    let mut cached = state
        .0
        .lock()
        .map_err(|_| "更新状态暂时不可用，请重启应用后再试。".to_string())?;
    cached
        .take()
        .and_then(|result| result.available_version)
        .ok_or_else(|| "请先检查更新，确认有可安装的新版本后再试。".to_string())
}

impl ManualUpdateResult {
    fn new(status: &'static str, title: &'static str, message: String) -> Self {
        Self {
            status,
            title,
            message,
            available_version: None,
        }
    }
}

fn available_update_result(current_version: &str, available_version: &str) -> ManualUpdateResult {
    ManualUpdateResult {
        status: "available",
        title: "发现新版本",
        message: format!(
            "可从当前版本 {current_version} 更新到 {available_version}。点击“立即更新”后将下载、校验并安装。"
        ),
        available_version: Some(available_version.to_string()),
    }
}

fn unpublished_update_result(current_version: &str) -> ManualUpdateResult {
    ManualUpdateResult::new(
        "unpublished",
        "暂无可用更新",
        format!("当前版本 {current_version}。更新通道尚未发布可安装的新版本。"),
    )
}

fn update_service_error_result() -> ManualUpdateResult {
    ManualUpdateResult::new(
        "serviceError",
        "更新服务暂时不可用",
        "服务端暂时无法响应更新请求，应用仍可正常使用，请稍后再试。".into(),
    )
}

fn release_probe_http_result(
    status: reqwest::StatusCode,
    current_version: &str,
) -> ManualUpdateResult {
    if status == reqwest::StatusCode::NOT_FOUND {
        unpublished_update_result(current_version)
    } else {
        update_service_error_result()
    }
}

fn configured_update_endpoint(app: &AppHandle) -> Option<String> {
    app.config()
        .plugins
        .0
        .get("updater")?
        .get("endpoints")?
        .as_array()?
        .first()?
        .as_str()
        .map(ToOwned::to_owned)
}

fn friendly_check_error(error: &tauri_plugin_updater::Error) -> ManualUpdateResult {
    use tauri_plugin_updater::Error;

    match error {
        // The updater folds every non-successful HTTP status into this one
        // variant. The async probe below distinguishes 404 from server errors.
        Error::ReleaseNotFound => update_service_error_result(),
        Error::Reqwest(_) | Error::Network(_) => ManualUpdateResult::new(
            "offline",
            "暂时无法连接更新服务",
            "请检查网络连接，恢复后可再次检查。".into(),
        ),
        Error::TargetNotFound(_) | Error::TargetsNotFound(_) => ManualUpdateResult::new(
            "incompatible",
            "当前设备暂无适配版本",
            "已找到更新信息，但尚未提供适用于当前系统和架构的安装包。".into(),
        ),
        Error::Serialization(_) => ManualUpdateResult::new(
            "serviceError",
            "更新信息暂时不可用",
            "服务端返回的更新信息不完整，请稍后再试。".into(),
        ),
        _ => ManualUpdateResult::new(
            "serviceError",
            "暂时无法检查更新",
            "更新服务暂时不可用，应用仍可正常使用，请稍后再试。".into(),
        ),
    }
}

async fn friendly_check_error_with_probe(
    app: &AppHandle,
    error: &tauri_plugin_updater::Error,
    current_version: &str,
) -> ManualUpdateResult {
    if !matches!(error, tauri_plugin_updater::Error::ReleaseNotFound) {
        return friendly_check_error(error);
    }

    let Some(endpoint) = configured_update_endpoint(app) else {
        log("[updater] no endpoint available for release status probe");
        return update_service_error_result();
    };
    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .user_agent(format!("DSH-Desktop/{}", app.package_info().version))
        .build()
    {
        Ok(client) => client,
        Err(error) => {
            log(&format!("[updater] failed to build status probe: {error}"));
            return update_service_error_result();
        }
    };

    match client.get(endpoint).send().await {
        Ok(response) => {
            let status = response.status();
            log(&format!(
                "[updater] release manifest probe returned HTTP {}",
                status
            ));
            release_probe_http_result(status, current_version)
        }
        Err(error) => {
            log(&format!("[updater] release manifest probe failed: {error}"));
            ManualUpdateResult::new(
                "offline",
                "暂时无法连接更新服务",
                "请检查网络连接，恢复后可再次检查。".into(),
            )
        }
    }
}

#[cfg(test)]
mod updater_status_tests {
    use super::*;

    #[test]
    fn a_bare_release_not_found_is_not_assumed_to_be_a_404() {
        let result = friendly_check_error(&tauri_plugin_updater::Error::ReleaseNotFound);

        assert_eq!(result.status, "serviceError");
        assert_eq!(result.title, "更新服务暂时不可用");
    }

    #[test]
    fn a_404_manifest_probe_is_a_neutral_state() {
        let result = release_probe_http_result(reqwest::StatusCode::NOT_FOUND, "0.1.0");

        assert_eq!(result.status, "unpublished");
        assert_eq!(result.title, "暂无可用更新");
        assert!(result.message.contains("0.1.0"));
    }

    #[test]
    fn a_server_error_is_not_misreported_as_no_update() {
        let result = release_probe_http_result(reqwest::StatusCode::INTERNAL_SERVER_ERROR, "0.1.0");

        assert_eq!(result.status, "serviceError");
        assert_eq!(result.title, "更新服务暂时不可用");
    }

    #[test]
    fn missing_platform_package_is_explained_separately() {
        let error = tauri_plugin_updater::Error::TargetNotFound("darwin-aarch64".into());
        let result = friendly_check_error(&error);

        assert_eq!(result.status, "incompatible");
        assert_eq!(result.title, "当前设备暂无适配版本");
    }

    #[test]
    fn malformed_manifest_is_a_service_error_without_raw_details() {
        let parse_error = serde_json::from_str::<serde_json::Value>("{").unwrap_err();
        let error = tauri_plugin_updater::Error::Serialization(parse_error);
        let result = friendly_check_error(&error);

        assert_eq!(result.status, "serviceError");
        assert_eq!(result.title, "更新信息暂时不可用");
        assert!(!result.message.contains("line 1"));
    }

    #[test]
    fn install_authorization_is_one_shot_and_version_bound() {
        let state = UpdateStatusState(Mutex::new(Some(available_update_result("0.1.0", "0.2.0"))));

        assert_eq!(take_cached_update_version(&state).unwrap(), "0.2.0");
        assert!(take_cached_update_version(&state).is_err());
    }
}

/// Manual checks return a user-facing state to the page. No native system
/// dialog is shown for ordinary results or failures.
#[tauri::command]
async fn check_for_updates_manual(app: AppHandle) -> ManualUpdateResult {
    log("[updater] manual check started");
    let current_version = app.package_info().version.to_string();
    let updater = match app.updater() {
        Ok(updater) => updater,
        Err(error) => {
            log(&format!("[updater] manual initialization failed: {error}"));
            return ManualUpdateResult::new(
                "serviceError",
                "更新功能暂时不可用",
                "无法初始化更新服务，请重启应用后再试。".into(),
            );
        }
    };

    let result = match updater.check().await {
        Ok(Some(update)) => {
            log(&format!(
                "[updater] manual update available: {} -> {}",
                update.current_version, update.version
            ));
            available_update_result(&update.current_version, &update.version)
        }
        Ok(None) => {
            log("[updater] manual check: already on the latest version");
            ManualUpdateResult::new(
                "latest",
                "已是最新版本",
                format!("当前版本 {current_version}，暂时不需要更新。"),
            )
        }
        Err(error) => {
            log(&format!("[updater] manual check failed: {error}"));
            friendly_check_error_with_probe(&app, &error, &current_version).await
        }
    };
    let cached = (result.status == "available").then(|| result.clone());
    cache_actionable_update(&app, cached);
    result
}

/// The in-app "Update now" action is itself the user's confirmation. Recheck
/// immediately before downloading so an old or replaced release is never used.
#[tauri::command]
async fn install_available_update(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    log("[updater] manual install requested");
    let expected_version = {
        let state = app
            .try_state::<UpdateStatusState>()
            .ok_or_else(|| "更新状态暂时不可用，请重启应用后再试。".to_string())?;
        take_cached_update_version(&state)?
    };
    let updater = app.updater().map_err(|error| {
        log(&format!(
            "[updater] manual install initialization failed: {error}"
        ));
        "更新功能暂时不可用，请重启应用后再试。".to_string()
    })?;
    let update = updater
        .check()
        .await
        .map_err(|error| {
            log(&format!("[updater] manual install recheck failed: {error}"));
            match error {
                tauri_plugin_updater::Error::Reqwest(_)
                | tauri_plugin_updater::Error::Network(_) => {
                    "网络连接不可用，更新尚未开始，请检查网络后重试。"
                }
                _ => "暂时无法获取安装包，请稍后重试。",
            }
            .to_string()
        })?
        .ok_or_else(|| "当前已是最新版本，无需安装。".to_string())?;

    if update.version != expected_version {
        log(&format!(
            "[updater] release changed before install: expected {expected_version}, got {}",
            update.version
        ));
        let refreshed = available_update_result(&update.current_version, &update.version);
        cache_actionable_update(&app, Some(refreshed));
        return Err(format!(
            "可用版本已更新为 {}，请重新检查并确认。",
            update.version
        ));
    }

    log(&format!(
        "[updater] manually downloading update {} -> {}",
        update.current_version, update.version
    ));
    let _ = window.set_title("DSH Desktop — 正在下载更新…");
    let progress_window = window.clone();
    let finished_window = window.clone();
    let mut downloaded = 0_u64;
    let mut last_reported_percent = 0_u64;
    let result = update
        .download_and_install(
            move |chunk_length, content_length| {
                downloaded = downloaded.saturating_add(chunk_length as u64);
                let Some(total) = content_length.filter(|total| *total > 0) else {
                    return;
                };
                let percent = downloaded.saturating_mul(100) / total;
                if percent >= last_reported_percent.saturating_add(5) || percent >= 100 {
                    last_reported_percent = percent;
                    let _ = progress_window
                        .set_title(&format!("DSH Desktop — 正在下载更新 {percent}%"));
                }
            },
            move || {
                log("[updater] manual download complete; installing");
                let _ = finished_window.set_title("DSH Desktop — 正在安装更新…");
            },
        )
        .await;

    if let Err(error) = result {
        log(&format!("[updater] manual install failed: {error}"));
        let _ = window.set_title(APP_WINDOW_TITLE);
        return Err("更新下载或安装未能完成，应用仍可继续使用，请稍后重试。".into());
    }

    log("[updater] manual update installed; restarting");
    app.restart();
}

/// Show a native error dialog and keep the splash window with an error state.
fn fail(app: &AppHandle, window: &WebviewWindow, title: &str, message: &str) {
    log(&format!("[fatal] {title}: {message}"));
    let _ = window.navigate(
        format!("tauri://localhost/index.html?error={}", urlencode(message))
            .parse()
            .unwrap_or_else(|_| "tauri://localhost/index.html".parse().expect("static url")),
    );
    app.dialog()
        .message(message)
        .title(title)
        .kind(MessageDialogKind::Error)
        .show(|_| {});
}

fn urlencode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            check_for_updates_manual,
            get_cached_update_status,
            install_available_update
        ])
        .on_page_load(|webview, payload| {
            if matches!(payload.event(), tauri::webview::PageLoadEvent::Finished) {
                let _ = webview.eval(PAGE_SHIM);
            }
        })
        .setup(|app| {
            let handle = app.handle();
            // Never write into the installed application bundle: doing so
            // invalidates its macOS code signature (and AppImage mounts are
            // read-only). Keep diagnostics in the platform app-log directory.
            if let Ok(dir) = handle.path().app_log_dir() {
                let _ = fs::create_dir_all(&dir);
                let _ = LOG_PATH.set(dir.join("dsh-desktop.log"));
            }
            log("=== DSH Desktop start ===");
            let config = load_config(handle);
            let window = app
                .get_webview_window("main")
                .expect("main window missing from config");
            app.manage(UpdateStatusState(Mutex::new(None)));

            // Keep recovery independent from the bundled DSH/Node runtime.
            // A broken runtime is exactly when an in-app update is most useful.
            check_for_updates(handle.clone());

            let root = match resolve_dsh_root(handle, config.dsh_root) {
                Ok(root) => root,
                Err(message) => {
                    fail(handle, &window, "启动失败", &message);
                    return Ok(());
                }
            };
            let node = match resolve_node(handle, config.node) {
                Ok(node) => node,
                Err(message) => {
                    fail(handle, &window, "启动失败", &message);
                    return Ok(());
                }
            };
            log(&format!(
                "resolved: root={} node={} bundled_root={} bundled_node={}",
                root.display(),
                node.display(),
                bundled_runtime(handle).is_some(),
                bundled_node(handle).is_some()
            ));

            let dsh_home = config.dsh_home.unwrap_or_else(default_dsh_home);
            log(&format!("dsh_home={dsh_home}"));
            match spawn_server(handle, window.clone(), &root, &node, dsh_home) {
                Ok(child) => {
                    app.manage(ServerHandle(Mutex::new(Some(child))));
                }
                Err(message) => {
                    fail(handle, &window, "启动失败", &message);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| match event {
            RunEvent::ExitRequested { .. } | RunEvent::Exit => shutdown_server(app),
            _ => {}
        });
}

#[cfg(test)]
mod tests {
    use super::web_server_args;

    #[test]
    fn desktop_server_suppresses_upstream_browser_handoff() {
        assert!(web_server_args(true).contains(&"--no-open"));
    }

    #[test]
    fn desktop_server_remains_compatible_with_older_runtimes() {
        assert!(!web_server_args(false).contains(&"--no-open"));
    }
}
