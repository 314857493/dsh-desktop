# Changelog

DSH Desktop 的重要变更记录在此文件中。版本号属于桌面端；每个版本同时记录其内置的
DeepSeek Harness 上游版本，以便复现构建和排查兼容性问题。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 桌面端

- 新增上游 DeepSeek Harness 版本监控、自动构建和发布流程。
- 自动同步桌面端版本、上游固定状态、GitHub Release Notes 与应用内更新说明。
- 修复 Windows PowerShell 未传入固定上游引用，以及 standalone pnpm 无法运行 rc8
  构建脚本的问题。
- 修复 Windows checkout 使用 CRLF 行尾时无法同步 `Cargo.lock` 版本的问题。

## [0.1.8] - 2026-08-19

### 修复

- 更新器资产 URL 规范化：GitHub 会把带空格的文件名编码（`DSH Desktop_...` → `DSH.Desktop_...`），
  更新检查现在能正确匹配安装包资产，不再误报"无可用更新"。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.0-rc.7`
- Commit：`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.7)

## [0.1.7] - 2026-08-19

### 修复

- 保留已签名的 Linux 发布产物（deb/AppImage 签名后不再被后续打包步骤丢弃）。
- 继承自 v0.1.6 的应用内更新功能（v0.1.6 的 Release 构建失败未发布，功能并入本版）。

## [0.1.6] - 2026-08-19

> ⚠️ 本 tag 的 Release 构建失败，未产出安装包；功能已并入 v0.1.7。

### 新增

- 签名的应用内更新：`tauri-plugin-updater` 接入，启动时自动检查、可手动检查/下载/安装，
  更新器签名校验（Apple 签名 / 自定义密钥）。
- 应用内更新体验：设置区更新按钮、更新状态提示（有新版本/最新/离线/服务不可用等）、
  更新进度反馈；服务器启动失败时也提供更新入口以便自愈。

## [0.1.5] - 2026-08-18

### 修复

- 忽略空的 Apple 签名密钥：未配置 macOS 签名凭据时不再导致打包失败。

## [0.1.4] - 2026-08-18

### 新增

- 发布时按 tag 自动同步产物版本号（`release.mjs --version`）：安装包文件名与 tag 一致
  （`v0.1.4` → `DSH Desktop_0.1.4_x64-setup.exe`），CI 打 `v*` tag 时自动生效。

### 修复

- macOS 发布打包加固（签名/公证流程更稳）。

## [0.1.3] - 2026-08-18

### 修复

- 回答/设置里的外部链接点击无反应：DSH 页面跑在 `http://127.0.0.1:<port>`，Tauri 视其为
  远程源并默认拒绝 IPC，opener 插件的点击拦截被访问控制列表静默吞掉。新增
  `remote-opener` capability 放行回环地址后，外链改用系统默认浏览器打开。
- 插件经 `window.open` 打开的链接（插件市场卡片、侧边栏「跳转」）此前被 WebView 直接取消：
  注入 shim 拦截并转交系统浏览器。
- 「打开配置文件」在 Windows 上静默无效：DSH 依赖 `.yaml`/`.yml` 文件关联，无关联时
  系统忽略请求。README 排障补充用户级关联修复方法。

## [0.1.2] - 2026-08-18

### 修复

- 非交互环境（CI/脚本）下 pnpm 清空 `node_modules` 被中止（`--config.confirmModulesPurge=false`）。
- 绿色版启动器注释改为 ASCII（避免编码乱码），exe 缺失时给出明确提示。

## [0.1.1] - 2026-08-16

### 新增

- 多平台构建与发布：Windows NSIS、macOS dmg/app、Linux deb/AppImage，GitHub Actions 矩阵
  一键产出三平台安装包并合并为 GitHub Release。

## [0.1.0] - 2026-08-15

### 新增

- 首个发布：Tauri 桌面壳，一键启动 DSH（DeepSeek Harness）Web GUI，关窗即关闭服务器。
  - 无控制台弹窗：子进程 `CREATE_NO_WINDOW` 静默运行。
  - 数据目录隔离：默认 `~/.dsh-desktop`，与浏览器 GUI（`~/.dsh`）互不干扰。
  - 进程清理可靠：退出时杀进程树 + Windows Job Object kill-on-close，强杀也不留孤儿。
- 自包含分发：内置 Node.js 运行时（`node-runtime`）+ 裁剪过的 DSH 运行环境（`rt`），
  最终用户无需安装 Node/DSH。
- 一键发布脚本 `scripts/release.mjs`：远程拉取 DSH 源码 → 构建 → pnpm deploy →
  依赖补齐/裁剪/孤儿扫描 → 冒烟测试 → 打包；依赖裁剪自动扫描、随上游更新重扫。
- GitHub Actions：CI 校验（语法/空白/机器路径）+ Release 发布。
- 双语 README（中/英）。

[Unreleased]: https://github.com/314857493/dsh-desktop/compare/v0.1.8...HEAD
[0.1.8]: https://github.com/314857493/dsh-desktop/releases/tag/v0.1.8
