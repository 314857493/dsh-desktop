# Changelog

DSH Desktop 的重要变更记录在此文件中。版本号属于桌面端；每个版本同时记录其内置的
DeepSeek Harness 上游版本，以便复现构建和排查兼容性问题。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 自包含安装包在发布构建时预装 `dshmarket@latest`，并将实际解析版本固化进运行时
  manifest；在 DSH 设置中提供插件搜索、一键安装、
  更新、停用与卸载。
- 安装包内置私有 `pnpm@11.22.0`，最终用户无需安装 Node/npm/pnpm 即可管理社区插件。
- 首次启动自动把商城挂载到 `web` profile；迁移标记会保留用户之后的卸载选择，
  不会在每次启动时强制装回。

### 构建与验证

- 发布流水线新增商城最新版解析与私有包管理器固定版本打包，禁用依赖安装脚本，并把
  商城依赖隔离在自身目录，避免覆盖 DSH 运行时依赖。
- 冒烟测试新增商城路由与私有 pnpm 可用性检查，并兼容尚不支持 `--no-open` 的旧 DSH 运行时。

## [0.1.10] - 2026-08-20

### 桌面端

- 修复内置 rc8 启动桌面端时额外打开系统浏览器的问题，同时兼容不支持
  `--no-open` 参数的旧版自定义运行时。
- 将 DeepSeek Harness 新版本定时检查从每小时一次调整为每天一次。
- 在中英文 README 中明确说明本项目为个人维护的非官方项目。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.0-rc.8`
- Commit：`141eb6fef83422698aef7a981029e843e8161534`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)

#### 新增功能

* 增强多模态支持度，DeepSeek 模型适配器支持配置启用原生图片请求，`/goal`、`/plan` 等命令可接收图文输入，`@` 菜单支持引用文件和会话
* Claude Code 与 Codex 子代理均可作为 Profile Bundle 按需安装，Codex 同时支持非交互权限模式和多个命名实例
* Windows PTY 终端支持持久 PowerShell 会话， 并在极简模式预设中默认支持

#### 问题修复

* 修复图片尺寸过大或历史图片累计载荷过高导致模型请求失败的问题
* 修正取消流式生成后已展示的回复前缀未带入后续提问和分叉会话
* 修复部分自定义 OpenAI 兼容网关因请求格式差异无法调用，以及推理内容回传可能缺失问题

#### 体验优化

* 优化布局和信息呈现，涉及HOME 目录以 `~` 缩写表示、输入框窄屏布局、反馈界面等
* 优化界面操作，涉及侧栏搜索焦点响应、工作流面板操作、模型选择器选中操作、打开本地文件失败支持重试等
* 优化工具调用，`web_search` 支持并发查询、子代理 `reportDelivery` 会及时反馈并唤醒父任务
* 优化安装与启动，改善下载依赖体积、本地运行 `dsh web` 时会自动打开浏览器
* 改善大历史会话执行分叉操作上的性能耗时

#### 其他变更

* 改善 SQLite 后端的读写与分叉性能并降低存储体积，数据结构不兼容
* 明确品牌使用规范：“DeepSeek Harness”是注册商标，详见 [品牌使用规范](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.8/BRAND_GUIDELINES.zh.md)

#### SDK

* Python SDK 依赖配置覆盖 4 个内置 Agent 预设，并包含 `rg` / glob 搜索和 MCP stdio 工具所需依赖

## [0.1.9] - 2026-08-20

### 桌面端

- 新增上游 DeepSeek Harness 版本监控、自动构建和发布流程。
- 自动同步桌面端版本、上游固定状态、GitHub Release Notes 与应用内更新说明。
- 修复 Windows PowerShell 未传入固定上游引用，以及 standalone pnpm 无法运行 rc8
  构建脚本的问题。
- 修复 Windows checkout 使用 CRLF 行尾时无法同步 `Cargo.lock` 版本的问题。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.0-rc.7` → `dsh-v0.1.0-rc.8`
- Commit：`141eb6fef83422698aef7a981029e843e8161534`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.0-rc.8)

#### 新增功能

* 增强多模态支持度，DeepSeek 模型适配器支持配置启用原生图片请求，`/goal`、`/plan` 等命令可接收图文输入，`@` 菜单支持引用文件和会话
* Claude Code 与 Codex 子代理均可作为 Profile Bundle 按需安装，Codex 同时支持非交互权限模式和多个命名实例
* Windows PTY 终端支持持久 PowerShell 会话， 并在极简模式预设中默认支持

#### 问题修复

* 修复图片尺寸过大或历史图片累计载荷过高导致模型请求失败的问题
* 修正取消流式生成后已展示的回复前缀未带入后续提问和分叉会话
* 修复部分自定义 OpenAI 兼容网关因请求格式差异无法调用，以及推理内容回传可能缺失问题

#### 体验优化

* 优化布局和信息呈现，涉及HOME 目录以 `~` 缩写表示、输入框窄屏布局、反馈界面等
* 优化界面操作，涉及侧栏搜索焦点响应、工作流面板操作、模型选择器选中操作、打开本地文件失败支持重试等
* 优化工具调用，`web_search` 支持并发查询、子代理 `reportDelivery` 会及时反馈并唤醒父任务
* 优化安装与启动，改善下载依赖体积、本地运行 `dsh web` 时会自动打开浏览器
* 改善大历史会话执行分叉操作上的性能耗时

#### 其他变更

* 改善 SQLite 后端的读写与分叉性能并降低存储体积，数据结构不兼容
* 明确品牌使用规范：“DeepSeek Harness”是注册商标，详见 [品牌使用规范](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.0-rc.8/BRAND_GUIDELINES.zh.md)

#### SDK

* Python SDK 依赖配置覆盖 4 个内置 Agent 预设，并包含 `rg` / glob 搜索和 MCP stdio 工具所需依赖

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

[0.1.8]: https://github.com/314857493/dsh-desktop/releases/tag/v0.1.8

[0.1.9]: https://github.com/314857493/dsh-desktop/compare/v0.1.8...v0.1.9

[Unreleased]: https://github.com/314857493/dsh-desktop/compare/v0.1.10...HEAD
[0.1.10]: https://github.com/314857493/dsh-desktop/compare/v0.1.9...v0.1.10
