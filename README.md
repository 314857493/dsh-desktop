# DSH Desktop

> **简体中文** | [English](README.en.md) | [更新日志](CHANGELOG.md)

> [!IMPORTANT]
> **非官方个人项目**：本项目由个人独立开发和维护，不是 DeepSeek 或 DeepSeek Harness
> 官方项目，与其官方团队不存在隶属、合作或背书关系。

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的
桌面端拓展：以 Tauri 原生窗口壳承载 DSH 的 Web GUI，负责拉起 `dsh web` Node 服务器，
等它就绪后把界面加载进系统 WebView，退出应用时关闭服务器。发布流程同时支持
Windows、macOS 和 Linux。

本项目**不改动 DSH 内核**——Agent 循环、工具调用、会话持久化等全部来自上游
DSH，本仓库提供的是桌面封装、自包含打包与自动化发布（构建、裁剪、冒烟测试、安装包）。

## 特性

- 🖥️ **桌面一键启动**：打开安装后的应用即用；Windows 子进程使用
  `CREATE_NO_WINDOW`，不会闪现控制台
- 1️⃣ **单实例**：重复启动只会显示并聚焦已打开的主窗口，不会再启动一个服务器
- 🔒 **数据目录隔离**：默认使用独立的 `~/.dsh-desktop`，与浏览器 GUI（`~/.dsh`）
  互不干扰，避免双实例写同一会话导致日志损坏
- 🧹 **进程跟随应用退出**：正常退出会终止 Node 服务器；Windows 额外使用
  `taskkill /T /F` 和 kill-on-close Job Object，应用崩溃或被强杀时也能由系统清理进程树
- 🔗 **外链交给系统浏览器**：回答/设置里的外部链接用系统默认浏览器打开（opener 插件 +
  面向回环地址的 remote capability），配置文件用系统默认编辑器打开
- 🧩 **内置插件商城**：预装社区 `dshmarket`，可在设置中搜索、安装、更新、停用和卸载
  DSH 社区插件；同时内置私有 pnpm，最终用户无需另外配置包管理器
- 📦 **自包含分发**：内置 Node.js 运行时 + 裁剪过的 DSH 运行环境，对方无需安装任何东西
- ⚙️ **可配置**：内置资源 / 配置文件 / 环境变量 / 命令行参数四级优先级
- 🔄 **应用内更新**：启动后静默检查，也可在设置中手动检查、下载并安装签名更新
- 🔄 **跟随上游**：发布脚本从 DSH 官方仓库拉取源码构建，可固定 tag/分支，随上游更新

## 环境要求

### 运行环境（最终用户）

| 要求 | 说明 |
| --- | --- |
| 操作系统 | Windows 10/11、macOS、Linux（CI 使用 Ubuntu 22.04 构建） |
| 系统 WebView | Windows 使用 WebView2（NSIS 安装包处理运行时）；macOS 使用系统 WebKit；Linux 使用 WebKitGTK |
| Node.js | **不需要**（安装包内置 node 运行时） |
| pnpm | **不需要**（安装包内置仅供 DSH 插件管理使用的私有 pnpm） |
| DSH 源码 | **不需要**（内置裁剪过的 DSH 运行环境） |

### 构建 / 发布环境（开发者）

| 依赖 | 版本要求 | 用途 |
| --- | --- | --- |
| 操作系统 | 与目标平台一致 | 脚本在当前系统生成 NSIS、DMG/`.app` 或 DEB/AppImage，不做跨平台编译 |
| Node.js | ≥ 22（CI 使用 24） | 运行发布脚本 / 内置运行时来源 |
| pnpm | 11.7.0（CI） | DSH 依赖安装与 deploy |
| Rust | stable | 编译 Tauri 壳 |
| 平台构建工具 | Windows: VS Build Tools C++；macOS: Xcode Command Line Tools；Linux: WebKitGTK/GTK 等 | 原生编译和打包 |
| `@tauri-apps/cli` | ≥ 2 | Tauri 打包 |
| git | 任意 | 远程源码拉取 |

> 构建机需要有 Node（发布脚本会从它复制核心文件进安装包）；**运行环境的用户则不需要**。

## 快速开始

从 [GitHub Releases](https://github.com/314857493/dsh-desktop/releases) 下载当前系统的产物：

- **Windows**：运行 NSIS `*-setup.exe`。
- **macOS**：打开 `.dmg`，将 DSH Desktop 拖入「应用程序」。
- **Linux**：安装 `.deb`，或给 `.AppImage` 添加执行权限后直接运行。

安装后打开「DSH Desktop」即可。Windows 还保留了
`launch-dsh-desktop.cmd` 作为本地绿色版启动器：它要求 `dsh-desktop.exe`、`dsh/`
和 `node/` 位于同一目录。

## 两种分发形态

### 1. 自包含版（给别人用，推荐）

各平台安装包都**内置** Node.js 运行时（`node-runtime/` → 包内 `node/`）和
精简的 DSH 运行环境（`rt/` → 包内 `dsh/`），并预置商城种子和私有 pnpm。
发布脚本会裁剪 source map、类型/源码与未引用孤儿依赖；最终用户不需要
另行安装 Node.js、npm 或 pnpm，产物体积会随内置 DSH 与商城版本变化。

### 2. 源码版（本机/开发者用）

应用内置资源缺失时，自动回退到外部 DSH 源码 + 系统 Node：

- **DSH 源码目录**：通过配置指定（默认取 `DSH_DESKTOP_DSH_ROOT` 环境变量；为空且无内置
  资源时报错并提示配置）；也可指向 `release.mjs` 拉取并构建好的
  `repo-cache/deepseek-harness/`。需已构建过 `pnpm run build`
  （或至少 `build:lib` + `build:web`），目录下需有 `apps/cli/lib/bin.js`（或 `lib/bin.js`）。
- **Node.js ≥ 22**：优先从 PATH 自动探测；Windows 还会检查 fnm 与标准安装目录，
  也可在配置中显式指定。

## 配置

按优先级：**内置资源 < 配置文件 < 环境变量 < 命令行参数**。

配置文件：`{app_config_dir}/dsh-desktop.json`（Tauri 应用配置目录），例如：

```json
{
  "dsh_root": "<DSH 源码目录，如 release.mjs 拉取的 repo-cache/deepseek-harness>",
  "node": "<node 可执行文件的绝对路径（可选，默认自动探测）>",
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
| `DSH_DESKTOP_NODE` | node 可执行文件的绝对路径 |
| `DSH_DESKTOP_HOME` | DSH_HOME（默认 `~/.dsh-desktop`，与浏览器 GUI 的 `~/.dsh` 隔离） |

命令行参数：`dsh-desktop[.exe] --dsh-root <path> [--node <path>] [--home <path>]`

> **数据目录隔离**：桌面应用默认使用独立的 `~/.dsh-desktop`，避免与同时运行的
> 浏览器 GUI 实例写同一个会话导致日志损坏（DSH 要求每会话单一写者）。
> 如需共享会话历史，可显式把 `dsh_home` 设为 `~/.dsh`，但不要同时让两个
> 实例处理同一个会话的消息。

## 插件商城

自包含安装包预装发布构建时最新版的开源社区插件
[`dshmarket`](https://github.com/dsh-market/dsh-market)。打开 **设置 → 插件商城** 即可
浏览社区目录、搜索并一键安装插件，也可以在已安装列表中更新、停用或卸载。商城和安装操作
都在本机 DSH 进程内完成；桌面端附带固定版本的私有 pnpm，不依赖系统 Node、npm 或 pnpm。

首次启动时，桌面端把安装包中的商城离线种子复制到当前 `web` profile，并登记精确版本和
迁移标记。此后商城由 profile 管理，可以正常自更新或卸载，也不会被安装目录中的旧版本遮蔽。
用户主动卸载商城后，后续启动不会强制装回；删除整个 profile 后重新初始化，则会恢复桌面端
默认预装项。用户安装的插件、配置和商城状态都位于 `DSH_HOME`（默认
`~/.dsh-desktop`），应用升级不会覆盖。桌面端负责 DSH 子进程生命周期，因此商城内的重启
入口默认禁用；用户设置可以覆盖该默认值，关闭并重新打开桌面应用仍是完整重启方式。

> 商城收录不代表本项目或 DeepSeek 对第三方插件背书。插件与本地代码拥有相同进程权限，
> 安装前请核对来源、仓库和权限提示；需要构建脚本的包默认不会被 pnpm 自动放行。

## 构建 / 发布（全自动）

```bash
# 本地开发打包（默认从 GitHub 获取 DSH 源码；不生成 updater 签名产物）
node scripts/release.mjs --no-updater

# 正式打包（需先在环境中设置 TAURI_SIGNING_PRIVATE_KEY）
node scripts/release.mjs

# 指定远程引用（tag / 分支 / commit）
node scripts/release.mjs --ref <tag-or-commit>

# 用本地 clone（不联网）：已构建则跳过 install/build，直接打包（最快路径）
node scripts/release.mjs --repo <本地 DSH 源码路径> --no-updater
node scripts/release.mjs --repo <本地 DSH 源码路径> --rebuild-repo --no-updater
# 也可设置 DSH_DESKTOP_REPO 后使用 --local

# 自定义远程地址 / 发布后静默安装（Windows）/ 跳过冒烟测试 / 指定产物版本号
node scripts/release.mjs --remote-url <url>
node scripts/release.mjs --install
node scripts/release.mjs --skip-boot-test
node scripts/release.mjs --no-updater       # 开发机测试安装包；不需要 updater 私钥
node scripts/release.mjs --version <semver>   # 同步 Tauri + Cargo 元数据，v 前缀自动去掉
```

> **开发机测试打包**：`--no-updater` 仍会执行运行时准备、冒烟测试和平台安装包构建，
> 但通过 `src-tauri/tauri.no-updater.conf.json` 临时关闭 updater 产物，不生成 `.sig`，
> 因此 Windows、macOS 和 Ubuntu 开发机都不需要持有 updater 私钥。正式发布不要使用该参数。
未使用 `--no-updater` 时，脚本若找不到 `TAURI_SIGNING_PRIVATE_KEY` 会直接失败，
避免误发布无法被已安装客户端验证的更新。

> **产物版本号**：GitHub Actions 打 `v*` tag 发布时自动把 tag 名作为版本号
> （`vX.Y.Z` → 安装包 `DSH Desktop_X.Y.Z_x64-setup.exe`）；本地/手动触发不传则
> 使用仓库里 tauri.conf.json 的版本。

远程源码缓存在 `repo-cache/deepseek-harness/`（浅克隆，后续运行增量 fetch，不触碰
本机开发用的 checkout）。

**内置 Node / pnpm 运行时**：`release.mjs` 会从构建机正在使用的 Node 安装中
复制当前平台的 node 可执行文件和必要文件到 `node-runtime/`，再从 registry
固定安装 `pnpm@11.22.0` 作为应用私有的插件包管理器。构建机全局安装的 npm
包不会被复制进安装包。

### 两种源码来源

| 模式 | 行为 | 适用 |
| --- | --- | --- |
| **默认（远程）** | `git fetch` → `pnpm install` → `pnpm run build` → deploy… | 无本地 clone / 要最新代码 / CI |
| **`--local`（本地）** | 校验 `apps/cli/lib/bin.js` 等构建产物：**已构建 → 跳过 install+build 直接打包**；未构建 → 需 `--rebuild-repo` 先构建 | 本地已有 clone 且构建过，秒级出包 |

### 流水线（远程模式 13 步）

0. `git fetch` 远程源码（默认 `master`，可 `--ref` 指定 tag/分支/commit）
1. `pnpm install`（frozen lockfile）
2. `pnpm run build`（远程克隆只有源码，lib/dist 不被 git 跟踪，必须构建）
3. `pnpm deploy` 从 DSH 仓库生成自包含运行时 `rt/`
4. `patch-runtime` 补齐 pnpm deploy 剪掉的运行时依赖
5. `ensure node-runtime` 从系统 Node 复制当前平台的核心运行时文件
6. `bundle-marketplace` 解析并预置构建时的 `dshmarket@latest` 离线种子（实际版本写入
   种子 manifest），同时固定预置私有 `pnpm@11.22.0`
7. 放入 `ensure-fallback.mjs` 与商城 profile 安装/迁移脚本
8. `trim-runtime` 裁剪 map/类型/源码
9. `prune-rt` **自动扫描**：依赖闭包 + 运行时代码引用扫描，删除确无引用的孤儿包
   （被移除的包会转移到 `backup-pre-prune/`；Windows 还会先备份上一个 NSIS 安装包）
10. `boot-test` 运行时与商城冒烟测试（起服务器、检查商城路由和私有 pnpm）
11. `tauri build` 按当前系统生成 NSIS、DMG/`.app` 或 DEB/AppImage
12. 正式 Linux 构建额外校验 `.deb.sig` 已生成

> 每次发布都会**重新自动扫描**依赖：DSH 源码更新后，新依赖自动保留、
> 新垃圾自动裁剪，无需手动维护清单。

### GitHub Actions

仓库内置两个工作流：

- **CI**（`.github/workflows/ci.yml`）：push/PR 时校验脚本语法、空白、无机器路径。
- **Release**（`.github/workflows/release.yml`）：每天 02:17 UTC（上海时间 10:17）
  检查上游 Release；发现新的 `dsh-v*` 版本后固定 tag/commit，每次处理一个
  尚未发布的版本。Windows、macOS、Linux 全部构建成功后，才更新版本文件、
  `CHANGELOG.md`、`.dsh-upstream.json`，并上传安装包、签名更新包、
  带真实更新说明的 `latest.json` 和 GitHub Release。

定时发布通过 `concurrency` 串行执行；如果 changelog 提交成功后附件上传中断，下次检查会
识别不完整 Release 并用同一版本重试。手动推送 `v*` tag 和 Actions 页面手动构建仍然可用。
手动运行默认只保存 Actions 产物，启用 `publish` 才会发布 Release。
`.dsh-upstream.json` 记录最近已处理的上游 tag/commit 和对应桌面版本。

自动发版需要仓库 Settings → Actions → General 中的 Workflow permissions 允许读写内容；
如果 `main` 有分支保护，还需允许 `github-actions[bot]` 写入发布元数据提交，否则构建完成后
会停在 changelog/version 提交步骤。

### 应用内更新

已安装的应用每次启动会在后台检查 GitHub Releases，也可随时点击“设置”弹窗右上角的
“检查更新”按钮手动检查。检查结果在设置弹窗内以非阻塞状态卡展示，区分已是最新版、
尚未发布更新、网络不可用、服务异常、当前设备无适配包和发现新版本，不使用系统提示框。
发现更高版本后，设置中会显示“立即更新”；点击后下载经过 minisign 验证的更新包、安装并重启。
后台检查的临时断网或失败只会写入应用日志，不影响正常启动。

Linux 同时支持 AppImage 和 `.deb` 应用内更新；`.deb` 更新安装时可能由系统请求管理员授权。

首次启用发布流水线前，需要把 updater 私钥配置为仓库 Secret：

```bash
gh auth login -h github.com
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/dsh-desktop-updater.key
```

公钥已经写入 `src-tauri/tauri.conf.json`，可以提交；私钥必须保存在仓库之外，不能提交。
请安全备份该私钥：丢失后，已经发布的客户端将无法验证用新密钥签署的更新。

更新源默认为
`https://github.com/314857493/dsh-desktop/releases/latest/download/latest.json`，
因此 GitHub Release 需要允许客户端匿名下载；若仓库保持私有，应改用可公开读取的
HTTPS 静态存储或更新服务，不能把 GitHub Token 内置到客户端。

macOS 构建至少使用 ad-hoc 身份签署完整 `.app`，避免 Apple Silicon 将从浏览器
下载的产物误报为“已损坏”。对外正式发布时，请在仓库 Secrets 中同时配置
`APPLE_SIGNING_IDENTITY`、`APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、
`APPLE_ID`、`APPLE_PASSWORD` 和 `APPLE_TEAM_ID`；Tauri 会改用 Developer ID
签名并提交 Apple 公证。ad-hoc 签名只保证 bundle 签名完整，不能提供开发者身份
验证，用户仍可能需要在“系统设置 → 隐私与安全性”中明确允许首次打开。

```bash
# 触发发布（推 tag 即可，例如）
git tag v0.2.0
git push origin v0.2.0
```

> 首次构建较慢（CI 全量编译），cargo registry 已缓存；后续相同依赖复用。

### macOS 提示“已损坏，无法打开”

旧版本 DMG 没有给完整 `.app` 签名。确认安装包来自本项目可信的 Release 后，
先把应用拖入“应用程序”，再执行一次：

```bash
xattr -dr com.apple.quarantine "/Applications/DSH Desktop.app"
open "/Applications/DSH Desktop.app"
```

这只用于绕过旧产物的 Gatekeeper 隔离；重新下载采用上述签名流程构建的新版本
是更合适的长期处理方式。

### 产物

| 平台 | 本地打包产物 |
| --- | --- |
| Windows | `src-tauri/target/release/bundle/nsis/*-setup.exe` |
| macOS | `src-tauri/target/release/bundle/dmg/*.dmg` 和 `bundle/macos/*.app` |
| Linux | `src-tauri/target/release/bundle/deb/*.deb` 和 `bundle/appimage/*.AppImage` |

正式签名构建还会生成 updater 用的 `.sig`；macOS updater 使用
`bundle/macos/*.app.tar.gz` 及其签名。`updater-manifest.mjs` 会为各平台生成片段并合并为
`latest.json`，同时按 GitHub Release 的资产命名规则将文件名空格规范化为点号。

## 工作原理

1. Rust 壳解析配置（内置 `dsh/` + `node/` 优先），找到 node 与 `lib/bin.js`。
2. 若使用内置运行时，先跑 `ensure-fallback.mjs`：把运行时内所有 `@deepseek-ai`
   包链接进 `$DSH_HOME/profiles/node_modules`，让 Cordis loader 能从配置文件目录
   解析到包；再把商城离线种子安装成 `web` profile 自己的依赖，并写入默认禁用内部重启的
   profile 策略，同时尊重用户设置、已有更新版本和后续卸载选择。
3. 以 `web --host 127.0.0.1 --port 0` 启动服务器（端口由 OS 分配，避免冲突），
   并把内置 node 目录加到子进程 PATH；Windows 上以 `CREATE_NO_WINDOW` 静默运行。
4. 读取子进程 stdout，捕获 `dsh web: http://127.0.0.1:<port>` 就绪行后，
   把 WebView 导航到该地址。
5. 退出时终止服务器并等待回收；Windows 使用 `taskkill /T /F` 和
   kill-on-close Job Object 清理整个进程树，macOS/Linux 向服务器子进程发送 `kill`。
6. 单实例插件阻止启动第二个实例；重复打开应用时只显示并聚焦现有窗口。

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
│   ├── release.mjs            # 一键发布（远程/本地，13 步）
│   ├── release-metadata.mjs   # 上游检测、版本递增、changelog / Release Notes
│   ├── updater-manifest.mjs   # 生成/合并跨平台 latest.json
│   ├── patch-runtime.mjs      # 补齐 deploy 剪掉的运行时依赖
│   ├── bundle-marketplace.mjs # 打包最新版社区商城种子 + 固定版私有 pnpm
│   ├── trim-runtime.mjs       # 裁剪 map/类型/源码
│   ├── prune-rt.mjs           # 孤儿依赖自动裁剪（闭包 + 引用扫描）
│   ├── ensure-fallback.mjs    # 启动时链接内置包到 DSH_HOME
│   ├── ensure-marketplace.mjs # 安装/迁移 profile 商城，保留更新和卸载选择
│   ├── boot-test.mjs          # 运行时冒烟测试
│   ├── gen-app-icon-svg.mjs   # 从官方 SVG 生成图标（含 glyph-path.txt）
│   ├── repair-session-log.mjs # 会话日志修复（双实例写坏时重建连续 seq）
│   ├── test-open-document.mjs # 端到端验证「打开配置文件」（TEST_NODE/TEST_BIN 指定运行时）
│   └── analyze-session-log.mjs # 会话日志结构分析
├── launch-dsh-desktop.cmd # 绿色版启动器
├── .dsh-upstream.json     # 已处理的上游 tag/commit 与桌面版本
├── CHANGELOG.md           # 桌面端与内置 DSH 的版本记录
└── README.md
```

> `rt/`、`node-runtime/`、`repo-cache/`、`backup-pre-prune/` 为本地生成/缓存目录，
> 不入库（见 `.gitignore`）；克隆后跑 `node scripts/release.mjs` 即可构建产物。

## 故障排查

- **应用日志**：系统应用日志目录中的 `dsh-desktop.log`（服务器 stdout/stderr、启动解析信息）。
- **会话历史加载失败**（`corrupt session log: seq gap ...`）：双实例写同一会话所致。
  用 `node scripts/repair-session-log.mjs <session.jsonl.zstd>` 修复（自动保留实时
  时间线、与运行中实例计数器对齐），原文件先备份。
- **桌面图标不更新**：清 Windows 图标缓存（删除 `IconCache.db` 后重启资源管理器），
  快捷方式已直接引用独立的 `dsh-desktop.ico`。
- **外链点击没反应**：opener 插件依赖 remote capability（见「工作原理」）。确认安装包
  版本包含 `capabilities/remote-opener.json`（`v0.2.x` 起）；旧版本请重装。
- **商城能打开但无法安装**：先看商城页顶部的 pnpm 状态。新版安装包自带私有 pnpm；
  若仍显示不可用，通常是安装包资源缺失或安全软件隔离了 `node/pnpm`，建议重装并查看
  `dsh-desktop.log`。目录拉取失败则检查到 npm/GitHub 的网络连接后重试。
- **「打开配置文件」没反应（Windows）**：DSH 在 Windows 上靠扩展名关联打开文件；
  若 `.yaml`/`.yml` 无默认关联，系统会静默忽略。为当前用户设置关联即可，例如
  用 Cursor 打开（与「打开方式 → Cursor」一致）：

  ```bat
  reg add HKCU\Software\Classes\.yaml /ve /d Cursor.yaml /f
  reg add HKCU\Software\Classes\.yml  /ve /d Cursor.yml /f
  ```

  也可换成其他已注册的 progid（VS Code 一般为 `VSCode.yaml`，记事本为 `txtfile`）。
- **恢复误裁剪的依赖**：`backup-pre-prune/` 保存 `prune-rt` 移出的包；Windows
  打包时还会保存上一个 NSIS 安装包。
