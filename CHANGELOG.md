# Changelog

DSH Desktop 的重要变更记录在此文件中。版本号属于桌面端；每个版本同时记录其内置的
DeepSeek Harness 上游版本，以便复现构建和排查兼容性问题。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.23] - 2026-09-08

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.3-alpha.1` → `dsh-v0.1.3-alpha.2`
- Commit：`82a5fd61a7cf5c293cec4bdff68f455398d685e9`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.3-alpha.2)

### 0.1.3-alpha.2 · 中文

#### 新增功能

- 升级 pi-ai 到 0.85.1，支持新模型。 — @tianyicui
- Web 顶栏新增“在应用中打开”，可用已安装的编辑器、IDE、终端或文件管理器等打开 Workspace。 — @yixiangihsiang
- 可继续对话的子代理支持消息排队、编辑、删除、单条或全部 Steer，以及停止操作。 — @Dudu-0223
- PTC 模式下支持展开查看命令及其输出。 — @tianyicui

#### 问题修复

- 修复 Web 断线后无法自动恢复的问题。 — @LegGasai
- 修复发送消息或调整窗口后，聊天不再自动滚动到底部的问题。 — @tianyicui
- 修复 Windows 上 Python SDK 运行时可能出现的启动崩溃。 — @tianyicui
- 改善 Windows 和部分 Linux 环境下的进程清理，减少任务停止后的后台进程残留。 — @pku-xht

#### 体验优化

- 改善长会话打开、恢复和持续对话时的卡顿，降低内存占用。 — @imccyu, @tianyicui, @Dudu-0223
- 引用较长会话时，模型可按需读取预览中未展示的内容。 — @tianyicui
- 排队消息新增“发送中”提示，发送完成前暂不可编辑、删除或 Steer。 — @LegGasai
- 统一设置面板中标签、开关和插件状态的样式，改善浅色和深色主题下的显示效果。 — @LegGasai
- 反馈可独立提交，无需继续对话；提交时会附带相关会话内容，普通聊天不会触发这类上报。 — @tianyicui, @Chinesezjc

#### 其他变更

- **默认工具调整:** SDK、Headless 和 ACP 默认使用 read、write、edit 编辑文件；Web minimal 和 sdk-minimal 保持不变。 — @koalazf99
- 自定义 persona 配置拆分为前缀和后缀，旧配置及相关常量需要适配。 — @tianyicui
- 普通 subprocess handle 移除 pid；终端 handle 不受影响。 — @pku-xht

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.3-alpha.1...dsh-v0.1.3-alpha.2

### 0.1.3-alpha.2 · English

#### New Features

- Upgrade pi-ai to 0.85.1 that supports more new models. — by @tianyicui
- Add “Open in” to the Web header to open the Workspace in an installed editor, IDE, terminal, file manager, or other supported application. — by @yixiangihsiang
- Continuable subagents support message queuing, editing, deletion, Steer for individual or all queued messages, and Stop. — by @Dudu-0223
- Allow commands and their output to be expanded in PTC mode. — by @tianyicui

#### Bug Fixes

- Fix Web connections failing to recover automatically after a disconnection. — by @LegGasai
- Fix chat no longer scrolling to the bottom automatically after sending a message or resizing the window. — by @tianyicui
- Fix a possible Python SDK runtime crash on startup on Windows. — by @tianyicui
- Improve process cleanup on Windows and supported Linux environments, reducing leftover background processes after a task stops. — by @pku-xht

#### Improvements

- Reduce lag when opening, resuming, and continuing long conversations, and lower memory usage. — by @imccyu, @tianyicui, @Dudu-0223
- When a long conversation is referenced, the model can read content omitted from the preview as needed. — by @tianyicui
- Add a “Sending” indicator for queued messages; editing, deletion, and Steer are temporarily unavailable until sending completes. — by @LegGasai
- Unify the styling of labels, switches, and plugin status indicators in the settings panel, improving their appearance in light and dark themes. — by @LegGasai
- Submit feedback without continuing the conversation. Submissions include the relevant conversation content; ordinary chat does not trigger this reporting. — by @tianyicui, @Chinesezjc

#### Other Changes

- **Default tool changes:** SDK, Headless, and ACP use read, write, and edit for file editing by default; Web minimal and sdk-minimal are unchanged. — by @koalazf99
- Custom persona configuration is split into a prefix and a suffix; existing configurations and related constants need to be updated. — by @tianyicui
- Remove pid from ordinary subprocess handles; terminal handles are unaffected. — by @pku-xht

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.3-alpha.1...dsh-v0.1.3-alpha.2

## [0.1.22] - 2026-09-06

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-rc.1` → `dsh-v0.1.3-alpha.1`
- Commit：`d347e703908d0406b7a7ef80e3a0e594d86b2215`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.3-alpha.1)

#### 新增功能

* Web 支持上传任意类型的通用文件：文件与图片可在同一预览区混排，后台上传支持进度、取消与会话切换续显，模型可通过已保存路径使用现有文件工具按需读取。 @CreatixChu
* 所有出站网络请求都会遵循启动环境中的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 与 `NO_PROXY` 配置。 @LegGasai
* Python SDK 新增 macOS x64 runtime wheel，可在 Intel 架构的 Mac 上安装并运行随包 runtime。 @koalazf99
* `read_image` 的顶层与 PTC 嵌套工具调用会在 Web 工具卡中直接渲染图片，不再展示原始附件对象。 @Chinesezjc
* 模型探测新增对自定义模型提供商 `models` 对象和 Anthropic 原生模型列表的支持，并支持回填模型名称、上下文窗口及最大输出 token 的回填。 @LegGasai

#### 问题修复

* 在 Web 中手动暂停目标会立即终止当前模型轮次，避免运行中的模型继续执行或在同一轮恢复目标。 @mektpoy
* 修复 DeepSeek 流式工具调用的续传分片用空值覆盖调用 ID 或名称的问题，避免工具以空名称失败并写入无法重新打开的会话记录。 @LegGasai
* 修复 Python SDK 单文件 runtime 将 Bash 中以 `node` 开头的命令错误重写为 dsh runtime 的问题。 @imccyu
* 修复从会话搜索结果进入会话后仍停留在搜索界面的问题；目标会话会在所属 Workspace 中展开并滚动到可见位置。 @Dudu-0223
* 修复 Windows 盘符根目录 Workspace 的路径分隔符、标题与绝对路径校验，确保盘符根目录可以正常使用。 @turtle1999
* 修复 Session 缓存读取问题。 @imccyu

#### 体验优化

* Skill 选择器支持模糊搜索；优化聊天气泡中的的 Skill 和命令引用。 @LegGasai
* 统一会话内可点击链接的颜色、hover/focus 样式和分类图标，优化 Markdown 链接、文件引用、网页来源、产物链接与 Workflow 成员链接的辨识度。 @yixiangihsiang
* 统一未观察文件写入与编辑失败的 `FS_NOT_OBSERVED` 诊断，保留文件路径、结构化错误码和原始原因。 @turtle1999
* Windows 上的本地非终端子进程不再弹出控制台窗口。 @turtle1999
* Agent Team 的 `send_message` 统一采用 steer 语义，并在跨 Agent 和冷恢复投递中保留发送者归属与顺序。 @Dudu-0223

#### 其他变更

* **破坏性变更：**Session persistence API 改为由生命周期持有的 `SessionHandle`；`agentLoop.create()` 改为异步，新增session锁，同一session至多被一个进程持有。 @turtle1999
* Session format 升级至 v2：旧 v0/v1 日志通过不可变的相邻 generation 迁移到当前格式，Assistant 流按 attempt 聚合进持久化 settlement，同时 Web 保持实时增量显示。 @tianyicui
* 已知的性能缺陷：本版本存在一项已知的性能回退，可能影响部分历史session加载的响应速度；我们将在下一个版本中修复。

## [0.1.21] - 2026-09-04

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.5` → `dsh-v0.1.2-rc.1`
- Commit：`a66e4702047846cdaa10c66c9d3df3951f5ea70d`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-rc.1)

作为 0.1.2 系列的首个候选版本，本版本汇总了自 v0.1.1-rc.2 以来的主要用户和开发者相关变更。

> oh-my-dsh 开源社区推出了帮助插件作者随着 DSH 版本升级插件代码的 skill： https://github.com/oh-my-dsh/dsh-plugin-upgrade-skill. 欢迎 DSH 插件作者试用并参与开源共建。oh-my-dsh 与 DeepSeek AI 没有隶属关系，相关项目非 DeepSeek 官方出品。

#### 新增功能

* 会话流默认在每个已完成回答前折叠过程内容，并默认折叠的「System prompt」 @07akioni, @lsdsjy
* 会话流正文宽度可自适应或拖拽调整 @yixiangihsiang
* 回答末尾显示 token 用量和耗时，可展开查看精确用量与详细统计 @hypatiamay, @ZiyaZhang, @Yifffan
* 会话视图提供覆盖完整历史的回合导航，可预览并跳转尚未载入的轮次 @LegGasai
* 统一界面次级文字层级，会话流支持字号调节，Markdown 表格随正文字号缩放 @yixiangihsiang
* 插件支持在模型设置页添加提供方登录配置 @LegGasai
* 界面支持第三方语言，并统一权限分类和标签的本地化表达 @tianyicui, @LegGasai, @imccyu, @ZiyaZhang
* 子代理模型选择支持 Agent 在授权范围内自主选择，也支持调用方指定提供方、模型、推理力度和最大输出长度，以及为 Claude Code、Codex 配置模型 @Dudu-0223, @pku-xht
* Python SDK runtime 新增 Windows x64 发行包 @tianyicui
* ACP 补齐标准会话控制、模型设置、MCP、权限和取消能力 @tianyicui, @pku-xht
* DeepSeek 官方适配器默认随请求提供已启用插件的包名和版本，可在配置中关闭 @tianyicui
* DeepSeek 官方适配器新增可选的 Session 日志增量上传，默认关闭 @tianyicui
* 新增实验性 Inspector 工具 @imccyu
* 新增实验性 Web Preview @imccyu
* 界面显示连接状态，容忍短暂服务端卡顿，并支持连接中断后的自动重试或立即重连 @imccyu
* 会话标题区域支持在不同视口宽度下查看活动的定时计划 @pku-xht
* 父 Agent 与可持续子 Agent 可通过 `send_message` 双向传递后续消息，取代单向 `report` 工具 @Dudu-0223

#### 体验优化

* 减少页面启动和会话初始化中的代码加载、数据传输与解析开销 @lsdsjy, @imccyu, @Kingwl, @kermanx
* 改善会话记录占用的磁盘空间 @Magolor
* 优化 `/` 与 `@` 菜单的图标、目录加载和文件搜索，支持通过鼠标在目录层级间导航 @Yifffan, @LegGasai
* 会话运行中存在草稿时主按钮切换为「发送」，消息排队发送 @lsdsjy
* 输入框中的文件和会话引用在相邻文字编辑后仍保持有效 @LegGasai
* 切换会话后仍保留未提交的提问卡片草稿 @LegGasai
* 会话流中的流式回复代码块在生成期间持续显示语法高亮 @07akioni
* 会话流中的提问历史显示为可读的问答卡片，并标明取消或中断后的未提交状态 @LegGasai
* 图片发送后立即显示，压缩和上传在后台继续 @CreatixChu
* 上下文压缩会计入图片占用 @CreatixChu
* 轨迹视图支持展示用户、助手和工具结果中的图片 @CreatixChu
* 在本地文件系统模式下，模型可定位上传图片，并通过 `read_image` 读取没有扩展名的附件路径 @CreatixChu
* 调整图片压缩策略，压缩更快、上传体积更小，并改善超长截图的清晰度 @CreatixChu
* 会话日志截断尾部自动修复时输出警告并注明受影响会话 @turtle1999
* 插件列表按会话插件和全局插件分组，可切换 Agent Preset 查看组合、搜索其他预设 @LegGasai
* 改善会话与输入界面的菜单显示、滚动条、工具文件链接与 diff 统计 @Yifffan
* 减少 macOS 和 Linux 加载会话时不必要的文件系统检查 @LegGasai
* 提升长会话和密集实时消息的处理效率，降低内存占用以及流式回复、代码高亮、布局和导航预览的渲染开销 @Dudu-0223, @imccyu, @07akioni
* `web_search` 失败时报告实际端点和错误明细 @CreatixChu
* 调整首页标志的动画效果 @Yifffan
* 自定义模型发现复用 Profile 请求头；模型目录支持搜索和筛选 @LegGasai

#### 问题修复

* 修复 macOS 和 Linux 上持久 PowerShell 启动过早、输出不完整的问题 @tianyicui
* 修复 Linux 持久 Bash 在管道内部读取时提前返回空输出的问题 @LegGasai
* 修复 Bash 命令派生大量子进程时 macOS 宿主卡顿的问题 @LegGasai
* 修复 Windows 目录选择器截断含「开」等特定编码字符路径的问题 @tianyicui
* 修复会话视图中持久 Bash 与 PowerShell 结果无法展开的问题 @LegGasai
* 修复 Profile 配置的 Agent Preset 目录在启动时丢失的问题 @LegGasai
* 无法加载的 Agent Preset 会提前标记，并在切换失败时说明原因 @LegGasai
* Minimal preset 不再显示不适用的 `/goal` 命令 @Magolor
* 文件编辑工具接受当前操作未使用字段的 `null` 占位值 @lsdsjy
* PTC Mode 的 SDK 功能只能通过 `run_code` 调用，不再被模型当作普通工具直接调用 @CreatixChu
* 网关定期发送 WebSocket 心跳，避免空闲连接中断 @lsdsjy
* 修复新建空会话挤掉 Workspace 折叠列表已有会话的问题 @lsdsjy
* 修复系统提示词 workflow 分区顺序 @LegGasai
* 优化 NPM 包中的 peer dependency 依赖以改善包管理解析成本 @imccyu
* 修复 Node.js 24.0–24.11.1 上启动可能失败且 HMR 失效的问题 @imccyu
* 关闭设置窗口后，键盘焦点会返回设置入口 @LegGasai
* 会话运行中追加或排队发送的图片可正确回显并可靠投递；持续子代理的后续消息也支持图片 @CreatixChu
* 命令菜单打开时，`Tab` 可补全当前高亮的斜杠命令 @mektpoy

#### 其他变更

* 更新 [安全说明](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.2-rc.1/SAFETY.zh.md)：DeepSeek Harness 尚未接受安全审计，沙箱、审批与权限控制不能保证隔离 @turtle1999
* 调整模型提示词顺序，使 Shell 使用指南稳定出现在其他工具指南之前 @LegGasai
* Remote 网关统一远程调用 API 与异常分发，旧版 APIProxy 已迁移并移除 @imccyu
* 会话视图工程大幅拆分，请面向诉求分层导入合适模块 @imccyu
* 网络访问 Web 界面时启用链接中的一次性 token 认证鉴权 @tianyicui
* 应用统一通过 `dsh` Profile 启动，包括 Python SDK、ACP 模式等 @tianyicui
* pi-ai 模型支持更新，并增加 vLLM 思考预算等配置 @tianyicui
* Headless 运行期间向 stderr 流式输出进度，stdout 只输出最终结果 @lsdsjy
* Code Mode 统一更名为 PTC mode，现有会话记录仍可读取 @tianyicui
* 默认启用公网 WebFetch（内置 SSRF 防护，公网请求不再逐次审批） @Dudu-0223
* 移除可选的 SQLite Session 持久化后端；已有内容不会删除，请使用旧版本导出 @tianyicui
* Python SDK、Headless、ACP 与自定义 Profile 默认提供 `web_fetch` @koalazf99
* Web PTC Mode 默认不再向模型提供通用 `workflow` 工具 @koalazf99
* `Session.events` 被按需读取 API `seq`、`eventAt()` 和 `snapshotEvents()` 取代 @kermanx
* `SessionSeq` 与 `SessionLogOffset` 使用强类型区分，本改造保持向前兼容 @tianyicui, @imccyu

## [0.1.20] - 2026-09-03

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.4` → `dsh-v0.1.2-alpha.5`
- Commit：`db6bdc3576c2d4e7c965e8e3ed0c2a731eed87f5`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.5)

#### 问题修复

* 修复从 `0.1.1-rc.2` 或 `0.1.2-alpha.3` 升级时，应用可能启动失败或者会话列表标题丢失的问题 @imccyu

## [0.1.19] - 2026-09-02

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.3` → `dsh-v0.1.2-alpha.4`
- Commit：`4e84901e6471b79ec0338099867ebb4606d12bb5`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.4)

#### 新增功能

* 父 Agent 与可持续子 Agent 可通过 `send_message` 双向传递后续消息，取代单向 `report` 工具 @Dudu-0223

#### 体验优化

* 自定义模型发现复用 Profile 请求头；模型目录支持搜索和筛选 @LegGasai
* 界面优化圆角、描边、轮次导航、投影效果 @yixiangihsiang, @LegGasai
* 改善超长会话在流式回复、界面布局、导航预览场景的渲染开销 @imccyu

#### 其他变更

* Python SDK、Headless、ACP 与自定义 Profile 默认提供 `web_fetch` @koalazf99
* Web PTC Mode 默认不再向模型提供通用 `workflow` 工具 @koalazf99
* `Session.events` 被按需读取 API `seq`、`eventAt()` 和 `snapshotEvents()` 取代 @kermanx
* `SessionSeq` / `SessionLogOffset` 强类型区分，请开发者关注兼容性 @tianyicui

## [0.1.18] - 2026-09-02

### 桌面端

- 修复商城经插件管理器更新后丢失桌面所有权标记时，启动迁移仍会保留依赖范围内的旧版
  `dshmarket`，导致它与新版内置 DSH 不兼容并阻断启动的问题；仅在内置种子版本更高且
  用户声明的版本范围明确允许时刷新并固定到该版本，避免后续 pnpm 操作按旧锁文件回退；
  精确版本、更新版本及 Git/file 等来源仍保持不变，同时按 SemVer 规则保护预发布版本。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.3`
- Commit：`dd6322d604e00eec1ba5e0c8541159906a21094a`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.3)

#### 体验优化

* 长会话右侧导航支持预览和跳转尚未载入的全部分页轮次 @LegGasai
* 改善长会话渲染的内存开销和代码高亮流畅度 @imccyu, @07akioni
* 优化权限标签多语言表达 @ZiyaZhang

#### 问题修复

* 会话运行中追加或排队发送的图片可正确回显并可靠投递；持续子代理的后续消息也支持图片 @CreatixChu
* `read_image` 可根据文件内容识别并读取没有扩展名的图片附件路径 @CreatixChu
* 命令菜单打开时，`Tab` 可补全当前高亮的斜杠命令 @mektpoy
* 修复后端卡顿可能造成网络连接被误判为断开的问题 @imccyu
* 修复会话标题中的定时计划列表在窄视口下偏移或越界的问题 @pku-xht

#### 其他变更

* 移除可选的 SQLite Session 持久化后端；已有内容不会删除，请使用旧版本导出 @tianyicui

## [0.1.17] - 2026-09-01

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.2` → `dsh-v0.1.2-alpha.3`
- Commit：`dd6322d604e00eec1ba5e0c8541159906a21094a`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.3)

#### 体验优化

* 长会话右侧导航支持预览和跳转尚未载入的全部分页轮次 @LegGasai
* 改善长会话渲染的内存开销和代码高亮流畅度 @imccyu, @07akioni
* 优化权限标签多语言表达 @ZiyaZhang

#### 问题修复

* 会话运行中追加或排队发送的图片可正确回显并可靠投递；持续子代理的后续消息也支持图片 @CreatixChu
* `read_image` 可根据文件内容识别并读取没有扩展名的图片附件路径 @CreatixChu
* 命令菜单打开时，`Tab` 可补全当前高亮的斜杠命令 @mektpoy
* 修复后端卡顿可能造成网络连接被误判为断开的问题 @imccyu
* 修复会话标题中的定时计划列表在窄视口下偏移或越界的问题 @pku-xht

#### 其他变更

* 移除可选的 SQLite Session 持久化后端；已有内容不会删除，请使用旧版本导出 @tianyicui

## [0.1.16] - 2026-09-01

### 桌面端

- 修复应用升级后旧版桌面受管 `dshmarket` 被误判为用户选择版本、无法随内置运行时刷新，
  进而因插件与核心版本不兼容而停在启动页的问题；用户自行选择的版本仍不会被覆盖。
- 兼容新版 DSH 的一次性 token 与 Strict Cookie 登录流程：由桌面端在 loopback 上完成
  token 交换并安全写入 WebView，避免首次跳转返回 401；同时从日志中移除启动 token，
  并在服务器退出或返回无效就绪地址时显示明确错误，不再无限等待。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.2`
- Commit：`0a53fb55bea101816fa226bb964ae2bed71c343b`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.2)

#### 新增功能

* 界面新增显示连接异常状态，支持自动重试和立即重连 @imccyu
* 会话标题区域支持查看活动的定时计划 @pku-xht

#### 体验优化

* 插件列表按会话插件和全局插件分组，可切换 Agent Preset 查看组合、搜索其他预设 @LegGasai
* 改善会话与输入界面的菜单显示、滚动条、工具文件链接与 diff 统计 @Yifffan
* 减少 macOS 和 Linux 加载会话时不必要的文件系统检查 @LegGasai
* 提升长会话历史和密集实时消息的处理效率 @Dudu-0223
* 回答末尾显示 token 用量和耗时，点击可查看详细统计 @Yifffan
* `web_search` 失败时报告实际端点和错误明细 @CreatixChu
* 权限分类使用本地化内容显示 @imccyu
* 调整首页标志的动画效果 @Yifffan

#### 问题修复

* 修复使用鼠标在 `@` 菜单中下钻目录时面包屑丢失或路径消失的问题 @LegGasai
* 优化 NPM 包中的 peer dependency 依赖以改善包管理解析成本 @imccyu
* 修复 Node.js 24.0–24.11.1 上启动可能失败且 HMR 失效的问题 @imccyu
* 关闭设置窗口后，键盘焦点会返回设置入口 @LegGasai

#### 其他变更

* 恢复 0.1.2-alpha.1 中移除的 `SessionEvent.ignorable` @tianyicui
* Remote 网关提供统一的 RemoteError 调用异常封装 @imccyu

## [0.1.15] - 2026-08-31

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.2-alpha.1` → `dsh-v0.1.2-alpha.2`
- Commit：`0a53fb55bea101816fa226bb964ae2bed71c343b`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.2)

#### 新增功能

* 界面新增显示连接异常状态，支持自动重试和立即重连 @imccyu
* 会话标题区域支持查看活动的定时计划 @pku-xht

#### 体验优化

* 插件列表按会话插件和全局插件分组，可切换 Agent Preset 查看组合、搜索其他预设 @LegGasai
* 改善会话与输入界面的菜单显示、滚动条、工具文件链接与 diff 统计 @Yifffan
* 减少 macOS 和 Linux 加载会话时不必要的文件系统检查 @LegGasai
* 提升长会话历史和密集实时消息的处理效率 @Dudu-0223
* 回答末尾显示 token 用量和耗时，点击可查看详细统计 @Yifffan
* `web_search` 失败时报告实际端点和错误明细 @CreatixChu
* 权限分类使用本地化内容显示 @imccyu
* 调整首页标志的动画效果 @Yifffan

#### 问题修复

* 修复使用鼠标在 `@` 菜单中下钻目录时面包屑丢失或路径消失的问题 @LegGasai
* 优化 NPM 包中的 peer dependency 依赖以改善包管理解析成本 @imccyu
* 修复 Node.js 24.0–24.11.1 上启动可能失败且 HMR 失效的问题 @imccyu
* 关闭设置窗口后，键盘焦点会返回设置入口 @LegGasai

#### 其他变更

* 恢复 0.1.2-alpha.1 中移除的 `SessionEvent.ignorable` @tianyicui
* Remote 网关提供统一的 RemoteError 调用异常封装 @imccyu

## [0.1.14] - 2026-08-29

### 桌面端

- 启动 DSH 时通过桌面端受管的 `--patch` overlay 加载部署上下文插件，明确告诉模型
  `$DSH_HOME` 才是配置与用户数据的权威根目录；默认 `~/.dsh-desktop`，同时自动尊重
  `dsh_home`、`DSH_DESKTOP_HOME` 与 `--home` 覆盖，不再误猜浏览器版 `~/.dsh`。
- 插件内嵌于桌面可执行文件，并与 overlay 一同写入平台应用缓存，不修改用户的
  `AGENTS.md`、profile 或 home 级 `cordis.patch.yml`，也不把机器绝对路径写进稳定提示词。

### 安全与发布

- 将无密钥的上游 DSH 运行时构建与安装包签名拆分到不同 CI runner；准备包先在隔离目录校验再移入签名工作区，避免上游构建脚本或归档覆盖路径接触 updater / Apple 签名凭据。
- GitHub Actions 固定到完整 commit SHA，构建工具链固定到明确版本；商城在每次构建开始时解析一次 `latest`，三个平台共享同一精确版本并校验 npm tarball integrity。
- 发布产物新增 `SHA256SUMS`，仓库补充 MIT `LICENSE` 与第三方组件声明。
- 打包前清理旧 bundle 输出，并排除 Tauri 的 `rw.*.dmg` 临时镜像，防止本地重复构建误带旧安装包或 updater 产物。
- 适配新版 DSH 的结构化 Web profile 模板与 token 登录握手，发布烟测会验证受保护的商城状态接口。
- 归档前将 pnpm 指向上游源码 checkout 的 workspace 链接实体化，并再次校验 runtime 内所有链接可移植，避免三平台签名任务收到悬空资源。

### 工程质量

- CI 的 Rust 检查会先创建被忽略的 Tauri 运行时资源目录，保证干净 checkout 下 Clippy 与测试不会因缺少 `rt/`、`node-runtime/` 而误报失败。
- CI 新增 Rust 格式、Clippy、测试与 RustSec 审计，并启用 Cargo / GitHub Actions Dependabot 更新。
- Dependabot 补丁级更新在 `main` 必需 CI 检查通过后自动 squash 合并；minor 与 major 更新仍保留人工审核。
- CI 以最小 `checks: write` 权限发布 RustSec 检查结果，避免 `push` 事件在报告 informational advisories 时因 token 权限不足失败。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.1-rc.2` → `dsh-v0.1.2-alpha.1`
- Commit：`cd5ef8148158c3a752a658978873241fdf8e2bbc`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.2-alpha.1)

#### 新增功能

* 会话流默认在每个已完成回答前折叠过程内容，并默认折叠的「System prompt」 @07akioni, @lsdsjy
* 会话流正文宽度可自适应或拖拽调整 @yixiangihsiang
* 会话流每个已完成回答后可展开查看精确 token 用量 @hypatiamay, @ZiyaZhang
* 会话视图提供紧凑的回合导航 @LegGasai
* 统一界面次级文字层级，会话流支持字号调节，Markdown 表格随正文字号缩放 @yixiangihsiang
* 插件支持在模型设置页添加提供方登录配置 @LegGasai
* 支持注册第三方语言，并补全多语言文本 @tianyicui, @LegGasai, @imccyu
* 开启子代理模型选择后，Agent 可在授权范围内选择提供方、模型和推理力度 @Dudu-0223
* 启动子代理时可指定提供方、模型、推理力度和最大输出长度 @pku-xht
* Claude Code、Codex 子代理支持配置模型 @pku-xht
* Python SDK runtime 新增 Windows x64 发行包 @tianyicui
* ACP 补齐标准会话控制、模型设置、MCP、权限和取消能力 @tianyicui, @pku-xht
* DeepSeek 官方适配器默认随请求提供已启用插件的包名和版本，可在配置中关闭 @tianyicui
* DeepSeek 官方适配器新增可选的 Session 日志增量上传，默认关闭 @tianyicui

#### 体验优化

* 改善页面启动流程，减少代码加载次数和数据量开销 @lsdsjy
* 改善会话初始化流程，减少数据传输解析开销，统一会话自有状态加载 @imccyu, @Kingwl, @kermanx
* 改善会话记录占用的磁盘空间 @Magolor
* 优化输入交互中的 `/` 与 `@` 菜单图标、目录加载、文件搜索 @Yifffan, @LegGasai
* 会话运行中存在草稿时主按钮切换为「发送」，消息排队发送 @lsdsjy
* 输入框中的文件和会话引用在相邻文字编辑后仍保持有效 @LegGasai
* 切换会话后仍保留未提交的提问卡片草稿 @LegGasai
* 会话流中的流式回复代码块在生成期间持续显示语法高亮 @07akioni
* 会话流中的提问历史显示为可读的问答卡片，并标明取消或中断后的未提交状态 @LegGasai
* 图片发送后立即显示，压缩和上传在后台继续 @CreatixChu
* 上下文压缩会计入图片占用 @CreatixChu
* 轨迹视图支持展示用户、助手和工具结果中的图片 @CreatixChu
* 在本地文件系统模式下，模型可直接找到已上传图片的可读取位置 @CreatixChu
* 调整图片压缩策略，压缩更快、上传体积更小，并改善超长截图的清晰度 @CreatixChu
* 会话日志截断尾部自动修复时输出警告并注明受影响会话 @turtle1999

#### 问题修复

* 修复 macOS 和 Linux 上持久 PowerShell 启动过早、输出不完整的问题 @tianyicui
* 修复 Linux 持久 Bash 在管道内部读取时提前返回空输出的问题 @LegGasai
* 修复 Bash 命令派生大量子进程时 macOS 宿主卡顿的问题 @LegGasai
* 修复 Windows 目录选择器截断含「开」等特定编码字符路径的问题 @tianyicui
* 修复会话视图中持久 Bash 与 PowerShell 结果无法展开的问题 @LegGasai
* 修复 Profile 配置的 Agent Preset 目录在启动时丢失的问题 @LegGasai
* 无法加载的 Agent Preset 会提前标记，并在切换失败时说明原因 @LegGasai
* Minimal preset 不再显示不适用的 `/goal` 命令 @Magolor
* 文件编辑工具接受当前操作未使用字段的 `null` 占位值 @lsdsjy
* PTC Mode 的 SDK 功能只能通过 `run_code` 调用，不再被模型当作普通工具直接调用 @CreatixChu
* 网关定期发送 WebSocket 心跳，避免空闲连接中断 @lsdsjy
* 修复新建空会话挤掉 Workspace 折叠列表已有会话的问题 @lsdsjy
* 修复系统提示词 workflow 分区顺序 @LegGasai

#### 其他变更

* 更新 [安全说明](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.2-alpha.1/SAFETY.zh.md)：DeepSeek Harness 尚未接受安全审计，沙箱、审批与权限控制不能保证隔离 @turtle1999
* 调整模型提示词顺序，使 Shell 使用指南稳定出现在其他工具指南之前 @LegGasai
* 旧版调用接口 APIProxy 已迁移并移除，请统一使用 `@Remote` 网关 @imccyu
* 会话视图工程大幅拆分，请面向诉求分层导入合适模块 @imccyu
* 网络访问 Web 界面时启用链接中的一次性 token 认证鉴权 @tianyicui
* 应用统一通过 `dsh` Profile 启动，包括 Python SDK、ACP 模式等 @tianyicui
* pi-ai 模型支持更新，并增加 vLLM 思考预算等配置 @tianyicui
* Headless 运行期间向 stderr 流式输出进度，stdout 只输出最终结果 @lsdsjy
* Code Mode 统一更名为 PTC mode，现有会话记录仍可读取 @tianyicui
* 默认启用公网 WebFetch（内置 SSRF 防护，公网请求不再逐次审批） @Dudu-0223

## [0.1.13] - 2026-08-23

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.1-rc.1` → `dsh-v0.1.1-rc.2`
- Commit：`b150a551b8d465e31e418e1b2eaf5e79bbb7d28e`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.1-rc.2)

#### 体验优化

* DeepSeek 适配器支持优先通过 Files API 上传图像，并可复用已上传文件
* 优化图像预处理流程：根据模型要求自动缩放并转换为合适格式

## [0.1.12] - 2026-08-22

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.0-rc.8` → `dsh-v0.1.1-rc.1`
- Commit：`528c682e061696f5a160f363f236ecbf53cbd006`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.1-rc.1)

#### 新增功能

* DeepSeek 适配器新增多模态视觉理解模型 `DeepSeek-V4-Flash-Vision-Exp`

#### 问题修复

* 修复在输入框的 `@` 引用前增删改文本时，潜在的布局问题
* 修复 Bubblewrap 沙箱内的受限进程可经 `/proc/<pid>/root` 绕过限制的问题

#### 体验优化

* 优化会话 Markdown 表格自适应表现、缓存命中率在 99.x% 时的精度显示、子代理会话标题切换交互
* `ask_user_question` 回答内容支持多行输入、自动换行、`Shift+Enter` 换行

## [0.1.11] - 2026-08-20

### 新增

- 自包含安装包在发布构建时预置 `dshmarket@latest` 离线种子，并将实际解析版本固化进
  种子 manifest；在 DSH 设置中提供插件搜索、一键安装、
  更新、停用与卸载。
- 安装包内置私有 `pnpm@11.22.0`，最终用户无需安装 Node/npm/pnpm 即可管理社区插件。
- 首次启动自动把商城复制并登记到 `web` profile；商城可自行更新与卸载，迁移标记会
  保留用户之后的卸载选择，不会在每次启动时强制装回。

### 修复

- 商城不再从只读运行时目录优先加载，避免遮蔽 profile 中已更新或测试版的商城包。
- 在桌面壳托管 DSH 子进程时默认禁用商城内的重启入口；用户显式设置仍保持更高优先级。
- 商城首次卸载后会在下次启动清理桌面端拥有的残留目录；若精确种子版本的包实体缺失则
  自动修复；其他用户选择的版本不可解析时只暂停对应 bundle，使核心 DSH 仍可启动，
  不会降级或覆盖用户文件，包恢复后会自动重新启用。

### 构建与验证

- 发布流水线新增商城最新版解析与私有包管理器固定版本打包，禁用依赖安装脚本，并把
  商城种子依赖隔离在自身目录，避免覆盖 DSH 运行时依赖。
- 冒烟测试新增商城路由、profile 管理状态、重启策略和私有 pnpm 可用性检查；路由探测
  使用独立超时，并兼容尚不支持 `--no-open` 的旧 DSH 运行时。

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

[0.1.10]: https://github.com/314857493/dsh-desktop/compare/v0.1.9...v0.1.10

[0.1.11]: https://github.com/314857493/dsh-desktop/compare/v0.1.10...v0.1.11

[0.1.12]: https://github.com/314857493/dsh-desktop/compare/v0.1.11...v0.1.12

[0.1.13]: https://github.com/314857493/dsh-desktop/compare/v0.1.12...v0.1.13

[0.1.14]: https://github.com/314857493/dsh-desktop/compare/v0.1.13...v0.1.14

[0.1.15]: https://github.com/314857493/dsh-desktop/compare/v0.1.14...v0.1.15

[0.1.16]: https://github.com/314857493/dsh-desktop/compare/v0.1.15...v0.1.16

[0.1.17]: https://github.com/314857493/dsh-desktop/compare/v0.1.16...v0.1.17

[0.1.18]: https://github.com/314857493/dsh-desktop/compare/v0.1.17...v0.1.18

[0.1.19]: https://github.com/314857493/dsh-desktop/compare/v0.1.18...v0.1.19

[0.1.20]: https://github.com/314857493/dsh-desktop/compare/v0.1.19...v0.1.20

[0.1.21]: https://github.com/314857493/dsh-desktop/compare/v0.1.20...v0.1.21

[0.1.22]: https://github.com/314857493/dsh-desktop/compare/v0.1.21...v0.1.22

[Unreleased]: https://github.com/314857493/dsh-desktop/compare/v0.1.23...HEAD
[0.1.23]: https://github.com/314857493/dsh-desktop/compare/v0.1.22...v0.1.23
