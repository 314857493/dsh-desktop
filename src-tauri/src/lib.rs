//! DSH Desktop — a Tauri shell that launches the DeepSeek Harness web server
//! (`dsh web`) and hosts its GUI in a native window.
//!
//! Lifecycle:
//!   1. Resolve configuration (bundled resources < config file
//!      < env vars < CLI args): DSH runtime root, node.exe, DSH_HOME.
//!   2. If the resolved root is the bundled runtime, run its
//!      `scripts/ensure-fallback.mjs` so the Cordis loader can resolve bundle
//!      packages from the profile directory.
//!   3. Spawn `node <root>/lib/bin.js web --host 127.0.0.1 --port 0` with the
//!      resolved environment (bundled node dir prepended to PATH).
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
    time::SystemTime,
};

use serde::Deserialize;
use tauri::{AppHandle, Manager, RunEvent, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

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
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION, JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
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
        let assigned = AssignProcessToJobObject(job, child.as_raw_handle() as *mut core::ffi::c_void);
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

/// Managed handle to the spawned server process (killed on app exit).
struct ServerHandle(Mutex<Option<Child>>);

/// Where the app writes its diagnostics (next to the exe).
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
    let node = normalize_path(res.join("node").join("node.exe"));
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
    let mut where_command = Command::new("where");
    where_command.arg("node.exe");
    hide_console(&mut where_command);
    if let Ok(output) = where_command.output() {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            if let Some(first) = text.lines().next() {
                let node = PathBuf::from(first.trim());
                if node.is_file() {
                    return Ok(node);
                }
            }
        }
    }

    // 2) fnm-installed node versions, highest version wins.
    let mut candidates: Vec<PathBuf> = Vec::new();
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

    let bin = root.join("lib").join("bin.js");
    let mut command = Command::new(node);
    command
        .arg(&bin)
        .arg("web")
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg("0")
        .current_dir(root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    command.env("DSH_HOME", &dsh_home);
    // Make node findable by any child process the server spawns.
    if let Some(dir) = node.parent() {
        let path = env::var("PATH").unwrap_or_default();
        command.env("PATH", format!("{};{path}", dir.display()));
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

/// Show a native error dialog and keep the splash window with an error state.
fn fail(app: &AppHandle, window: &WebviewWindow, title: &str, message: &str) {
    log(&format!("[fatal] {title}: {message}"));
    let _ = window.navigate(
        format!(
            "tauri://localhost/index.html?error={}",
            urlencode(message)
        )
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
        .setup(|app| {
            let handle = app.handle();
            // Diagnostics live next to the exe so they are easy to find.
            if let Ok(exe) = std::env::current_exe() {
                if let Some(dir) = exe.parent() {
                    let _ = LOG_PATH.set(dir.join("dsh-desktop.log"));
                }
            }
            log("=== DSH Desktop start ===");
            let config = load_config(handle);
            let window = app
                .get_webview_window("main")
                .expect("main window missing from config");

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
