# DSH Desktop

> **简体中文** | [English](README.en.md)

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的
桌面端拓展：以 Tauri 原生窗口壳承载 DSH 的 Web GUI，负责拉起 `dsh web` Node 服务器，
等它就绪后把界面加载进 WebView2 窗口，关窗即关闭服务器。

本项目**不改动 DSH 内核**——Agent 循环、工具调用、会话持久化等全部来自上游
DSH，本仓库提供的是桌面封装、自包含打包与自动化发布（构建、裁剪、冒烟测试、安装包）。

## 特性

- 🖥️ **桌面一键启动**：双击即用，无控制台弹窗（子进程全部 `CREATE_NO_WINDOW`）
- 🔒 **数据目录隔离**：默认使用独立的 `~/.dsh-desktop`，与浏览器 GUI（`~/.dsh`）
  互不干扰，避免双实例写同一会话导致日志损坏
- 🧹 **进程清理可靠**：退出时 `taskkill /T /F` 杀进程树 + Windows Job Object
  kill-on-close（app 即使被强杀/崩溃，服务器进程树也会被 OS 强制清理，不留孤儿）
- 🔗 **外链交给系统浏览器**：回答/设置里的外部链接用系统默认浏览器打开（opener 插件 +
  面向回环地址的 remote capability），配置文件用系统默认编辑器打开
- 📦 **自包含分发**：内置 Node.js 运行时 + 裁剪过的 DSH 运行环境，对方无需安装任何东西
- ⚙️ **可配置**：内置资源 / 配置文件 / 环境变量 / 命令行参数四级优先级
- 🔄 **跟随上游**：发布脚本从 DSH 官方仓库拉取源码构建，可固定 tag/分支，随上游更新

## 环境要求

### 运行环境（最终用户）

| 要求 | 说明 |
| --- | --- |
| 操作系统 | Windows 10/11 x64 |
| WebView2 运行时 | 安装包自动检测/安装（Win11 一般自带），无需手动处理 |
| Node.js | **不需要**（安装包内置 node 运行时） |
| DSH 源码 | **不需要**（内置裁剪过的 DSH 运行环境） |

### 构建 / 发布环境（开发者）

| 依赖 | 版本要求 | 用途 |
| --- | --- | --- |
| 操作系统 | Windows 10/11 x64 | 打包 NSIS 安装包 |
| Node.js | ≥ 22 | 运行发布脚本 / 内置运行时来源 |
| pnpm | 与仓库 lockfile 匹配 | 依赖安装与 deploy |
| Rust | stable（MSVC target） | 编译 Tauri 壳 |
| VS Build Tools | C++ 工作负载 | Rust 链接（link.exe） |
| `@tauri-apps/cli` | ≥ 2 | tauri 打包 |
| git | 任意 | 远程源码拉取 |

> 构建机需要有 Node（发布脚本会从它复制核心文件进安装包）；**运行环境的用户则不需要**。

## 快速开始

- **已安装**：双击桌面/开始菜单的「DSH Desktop」即可。
- **安装包**：`src-tauri/target/release/bundle/nsis/DSH Desktop_0.1.0_x64-setup.exe`
- **绿色版**：`src-tauri/target/release/dsh-desktop.exe`，需连同旁边的 `dsh/`、`node/`
  目录一起拷贝（这俩是内置运行时）。

## 两种分发形态

### 1. 自包含版（给别人用，推荐）

安装包内**内置**了 Node.js 运行时（`node-runtime/` → 安装后 `node/`）和精简的 DSH
运行环境（`rt/` → 安装后 `dsh/`，已裁剪源码/map/类型/孤儿依赖，约 200 MB）。
对方**无需安装任何东西**，装完双击即用。安装包约 **57 MB**。

### 2. 源码版（本机/开发者用）

应用内置资源缺失时，自动回退到外部 DSH 源码 + 系统 Node：

- **DSH 源码目录**：通过配置指定（默认取 `DSH_DESKTOP_DSH_ROOT` 环境变量；为空且无内置
  资源时报错并提示配置）；也可指向 `release.mjs` 拉取并构建好的
  `repo-cache/deepseek-harness/`。需已构建过 `pnpm run build`
  （或至少 `build:lib` + `build:web`），目录下需有 `apps/cli/lib/bin.js`（或 `lib/bin.js`）。
- **Node.js ≥ 22**：从 PATH、fnm 安装目录或标准位置自动探测，也可配置指定。

## 配置

按优先级：**内置资源 < 配置文件 < 环境变量 < 命令行参数**。

配置文件：`{app_config_dir}/dsh-desktop.json`（Tauri 应用配置目录），例如：

```json
{
  "dsh_root": "<DSH 源码目录，如 release.mjs 拉取的 repo-cache/deepseek-harness>",
  "node": "<node.exe 绝对路径（可选，默认自动探测）>",
  "dsh_home": "<DSH_HOME 数据目录（可选，默认 ~/.dsh-desktop）>"
}
```

> `dsh_root` 指向源码仓库根目录即可（本地 clone、发布脚本拉取的
> `repo-cache/deepseek-harness`，或任意已构建的 checkout），该目录需含
> `apps/cli/lib/bin.js`。

环境变量：

| 变量 | 含义 |
| --- | --- |
| `DSH_DESKTOP_DSH_ROOT` | DSH 运行环境 / 源码目录 |
| `DSH_DESKTOP_NODE` | node.exe 绝对路径 |
| `DSH_DESKTOP_HOME` | DSH_HOME（默认 `~/.dsh-desktop`，与浏览器 GUI 的 `~/.dsh` 隔离） |

命令行参数：`dsh-desktop.exe --dsh-root <path> [--node <path>] [--home <path>]`

> **数据目录隔离**：桌面应用默认使用独立的 `~/.dsh-desktop`，避免与同时运行的
> 浏览器 GUI 实例写同一个会话导致日志损坏（DSH 要求每会话单一写者）。
> 如需共享会话历史，可显式把 `dsh_home` 设为 `~/.dsh`，但不要同时让两个
> 实例处理同一个会话的消息。

## 构建 / 发布（全自动）

```bash
# 一键发布（默认从远程 GitHub 获取 DSH 源码 → 构建 → 打包，全自动、跨平台）
node scripts/release.mjs

# 指定远程引用（tag / 分支 / commit）
node scripts/release.mjs --ref v0.1.0

# 用本地 clone（不联网）：已构建则跳过 install/build，直接打包（最快路径）
node scripts/release.mjs --local
node scripts/release.mjs --repo <本地 DSH 源码路径>
node scripts/release.mjs --local --rebuild-repo   # 本地源码重新构建后再打包

# 自定义远程地址 / 发布后静默安装（Windows）/ 跳过冒烟测试 / 指定产物版本号
node scripts/release.mjs --remote-url <url>
node scripts/release.mjs --install
node scripts/release.mjs --skip-boot-test
node scripts/release.mjs --version 0.1.4   # 产物版本号（同步 tauri.conf.json + Cargo.toml，v 前缀自动去掉）
```

> **产物版本号**：GitHub Actions 打 `v*` tag 发布时自动把 tag 名作为版本号
> （`v0.1.4` → 安装包 `DSH Desktop_0.1.4_x64-setup.exe`）；本地/手动触发不传则
> 使用仓库里 tauri.conf.json 的版本。

远程源码缓存在 `repo-cache/deepseek-harness/`（浅克隆，后续运行增量 fetch，不触碰
本机开发用的 checkout）。

**内置 Node 运行时**：`release.mjs` 会从系统 Node 安装中**复制核心文件**
（`node.exe` + npm/npx/corepack，约 100 MB）到 `node-runtime/`——**无需下载**，
也不会把全局安装的 npm 包带进安装包。打包时随安装包一并分发，最终用户无需装 Node。

### 两种源码来源

| 模式 | 行为 | 适用 |
| --- | --- | --- |
| **默认（远程）** | `git fetch` → `pnpm install` → `pnpm run build` → deploy… | 无本地 clone / 要最新代码 / CI |
| **`--local`（本地）** | 校验 `apps/cli/lib/bin.js` 等构建产物：**已构建 → 跳过 install+build 直接打包**；未构建 → 需 `--rebuild-repo` 先构建 | 本地已有 clone 且构建过，秒级出包 |

### 流水线（远程模式 11 步）

0. `git fetch` 远程源码（默认 `master`，可 `--ref` 指定 tag/分支/commit）
1. `pnpm install`（frozen lockfile）
2. `pnpm run build`（远程克隆只有源码，lib/dist 不被 git 跟踪，必须构建）
3. `pnpm deploy` 从 DSH 仓库生成自包含运行时 `rt/`
4. `patch-runtime` 补齐 pnpm deploy 剪掉的运行时依赖
5. 放入 `ensure-fallback.mjs`
6. `trim-runtime` 裁剪 map/类型/源码
7. `prune-rt` **自动扫描**：依赖闭包 + 运行时代码引用扫描，删除确无引用的孤儿包
   （旧安装包自动备份到 `backup-pre-prune/`；被引用/未声明的运行时依赖如 tsx 自动保留）
8. `ensure node-runtime` 从系统 Node 复制核心文件（node.exe + npm/corepack）
9. `boot-test` 运行时冒烟测试（起服务器、等就绪行）
10. `tauri build` 产出安装包

> 每次发布都会**重新自动扫描**依赖：DSH 源码更新后，新依赖自动保留、
> 新垃圾自动裁剪，无需手动维护清单。

### GitHub Actions

仓库内置两个工作流：

- **CI**（`.github/workflows/ci.yml`）：push/PR 时校验脚本语法、空白、无机器路径。
- **Release**（`.github/workflows/release.yml`）：打 `v*` tag 或手动触发 → Windows
  构建 → 上传安装包并创建 GitHub Release。

```bash
# 触发发布（推 tag 即可，例如）
git tag v0.2.0
git push origin v0.2.0
```

> 首次构建较慢（CI 全量编译），cargo registry 已缓存；后续相同依赖复用。

### 产物

- 安装包：`src-tauri/target/release/bundle/nsis/DSH Desktop_0.1.0_x64-setup.exe`（约 57 MB）
- 绿色版：`src-tauri/target/release/dsh-desktop.exe` + `dsh/` + `node/` 目录

## 工作原理

1. Rust 壳解析配置（内置 `dsh/` + `node/` 优先），找到 node 与 `lib/bin.js`。
2. 若使用内置运行时，先跑 `ensure-fallback.mjs`：把运行时内所有 `@deepseek-ai`
   包链接进 `$DSH_HOME/profiles/node_modules`，让 Cordis loader 能从配置文件目录
   解析到包（pnpm deploy 产物没有仓库布局的逐包链接，这是必需的补齐步骤）。
3. 以 `web --host 127.0.0.1 --port 0` 启动服务器（端口由 OS 分配，避免冲突），
   并把内置 node 目录加到子进程 PATH；子进程 `CREATE_NO_WINDOW` 静默运行。
4. 读取子进程 stdout，捕获 `dsh web: http://127.0.0.1:<port>` 就绪行后，
   把 WebView 导航到该地址。
5. 退出时 `taskkill /T /F` 杀掉服务器进程树；同时子进程挂 Windows Job Object
   kill-on-close——app 无论怎么退出（关窗/崩溃/强杀），服务器都会被清理。

**外链打开**：DSH 前端把外部链接渲染为 `target="_blank"`；opener 插件注入的
脚本拦截点击并调用 Tauri IPC 让系统默认浏览器打开。由于页面地址是
`http://127.0.0.1:<port>`（Tauri 视为远程源），必须用
`capabilities/remote-opener.json` 里的 remote capability 放行
`plugin:opener|open_url`，否则点击被访问控制列表静默拒绝、毫无反应。
**打开配置文件**：走 DSH 服务端 `settings.openDocument` → 系统默认应用打开
（Windows 依赖 `.yaml`/`.yml` 文件关联，见故障排查）。

## 项目结构

```
dsh-desktop/
├── src-tauri/            # Tauri 壳（Rust）
│   ├── src/lib.rs        # 配置解析 / 拉起服务器 / 导航 / 进程清理
│   ├── tauri.conf.json   # 窗口、资源（rt→dsh、node-runtime→node、icon.ico）
│   ├── capabilities/     # 权限：default + remote-opener（回环地址放行外链打开）
│   ├── nsis/hooks.nsh    # 安装时创建桌面快捷方式（指向独立 ico）
│   └── icons/            # 图标资源（由官方 SVG 生成）
├── dist/                 # 启动页（loading 页，服务器就绪前展示）
├── scripts/
│   ├── release.mjs            # 一键发布（远程/本地，10 步）
│   ├── patch-runtime.mjs      # 补齐 deploy 剪掉的运行时依赖
│   ├── trim-runtime.mjs       # 裁剪 map/类型/源码
│   ├── prune-rt.mjs           # 孤儿依赖自动裁剪（闭包 + 引用扫描）
│   ├── ensure-fallback.mjs    # 启动时链接内置包到 DSH_HOME
│   ├── boot-test.mjs          # 运行时冒烟测试
│   ├── gen-app-icon-svg.mjs   # 从官方 SVG 生成图标（含 glyph-path.txt）
│   ├── repair-session-log.mjs # 会话日志修复（双实例写坏时重建连续 seq）
│   ├── test-open-document.mjs # 端到端验证「打开配置文件」（TEST_NODE/TEST_BIN 指定运行时）
│   └── analyze-session-log.mjs # 会话日志结构分析
├── launch-dsh-desktop.cmd # 绿色版启动器
└── README.md
```

> `rt/`、`node-runtime/`、`repo-cache/`、`backup-pre-prune/` 为本地生成/缓存目录，
> 不入库（见 `.gitignore`）；克隆后跑 `node scripts/release.mjs` 即可构建产物。

## 故障排查

- **应用日志**：exe 旁边的 `dsh-desktop.log`（服务器 stdout/stderr、启动解析信息）。
- **会话历史加载失败**（`corrupt session log: seq gap ...`）：双实例写同一会话所致。
  用 `node scripts/repair-session-log.mjs <session.jsonl.zstd>` 修复（自动保留实时
  时间线、与运行中实例计数器对齐），原文件先备份。
- **桌面图标不更新**：清 Windows 图标缓存（删除 `IconCache.db` 后重启资源管理器），
  快捷方式已直接引用独立的 `dsh-desktop.ico`。
- **外链点击没反应**：opener 插件依赖 remote capability（见「工作原理」）。确认安装包
  版本包含 `capabilities/remote-opener.json`（`v0.2.x` 起）；旧版本请重装。
- **「打开配置文件」没反应（Windows）**：DSH 在 Windows 上靠扩展名关联打开文件；
  若 `.yaml`/`.yml` 无默认关联，系统会静默忽略。为当前用户设置关联即可，例如
  用 Cursor 打开（与「打开方式 → Cursor」一致）：

  ```bat
  reg add HKCU\Software\Classes\.yaml /ve /d Cursor.yaml /f
  reg add HKCU\Software\Classes\.yml  /ve /d Cursor.yml /f
  ```

  也可换成其他已注册的 progid（VS Code 一般为 `VSCode.yaml`，记事本为 `txtfile`）。
- **回滚**：`backup-pre-prune/` 下有历史安装包与裁剪前的完整 `rt/`。
