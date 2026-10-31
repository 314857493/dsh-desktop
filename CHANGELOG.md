# Changelog

DSH Desktop 的重要变更记录在此文件中。版本号属于桌面端；每个版本同时记录其内置的
DeepSeek Harness 上游版本，以便复现构建和排查兼容性问题。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.41] - 2026-10-31

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-rc.5` → `dsh-v0.2.2-alpha.2`
- Commit：`f3803c96974ad4a94195fb97e5c637e9c2a3afe3`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.2)

#### 新增功能

- 插件管理页支持展示富文本详情，并改善页面布局和导航行为。 @turtle1999, @turtle2099
- 插件管理支持更新第三方插件包；热更新失败时会尝试恢复旧版本。 @turtle1999, @turtle2099
- 支持将聊天文本作为引用插入输入框，并在发送后显示紧凑预览。 @lsdsjy, @imccyu
- 支持将完整历史交会话复制为 Markdown，包含可用的原始日志路径。 @tianyicui
- 工作步骤收起后保留全部助手文字回复，可切换为仅最终回答。 @imccyu
- 新增日语、西班牙语、法语、德语、俄语和巴西葡萄牙语文案与界面配置。 @07akioni
- 自动化任务页支持确认后一次清除全部已结束任务，保留进行中的任务。 @Chinesezjc
- 新增实验性「`subagent_oar`工具」插件，可将独立任务交给本机 Codex 或 Claude CLI @tianyicui
- 新增实验性「个性化推荐」插件，按需在回答下方提供官方插件启用卡片或个性化页面创建卡片。 @ZiyaZhang
- 新增实验性「开发者工具 - 统计」插件，按轮次和步骤查看上下文、缓存、模型与工具耗时等统计。 @mektpoy
- 新增实验性「变更请求与工作树」：可在独立 Git 工作树中运行会话，查看关联 PR 的状态和代码差异。 @LegGasai, @tianyicui

#### 体验优化

- 改善手机和平板输入：减少自动弹出软键盘，发送后收起键盘，修正键盘平移页面时的光标滚动。 @Stevring
- 窄屏浏览器设置页采用全屏与横向导航，聚焦项自动完整滚入可见区；触屏任务文本输入使用 16px 字号。 @Stevring
- 触屏动作不再被悬停提示阻挡，工作区与归档结果操作直接可达；宽 Markdown 表格在局部容器中滚动。 @Stevring
- 窄会话栏中，溢出的头部状态入口会渐隐，避免遮挡“在应用中打开”等工具按钮。 @turtle2099
- 恢复窄窗口下输入框模型选择器自动折叠为图标的行为，完整模型名仍可在菜单中查看。 @LegGasai
- 修复手机及窄窗口下字体设置输入框挤压标题和说明的问题，字体输入行改为纵向排列，字号控件保留右对齐。 @EricMoin
- 同名工作区在选择器中显示最短区分路径后缀，窄屏优先保留后缀。 @turtle2099
- 共享描边按钮使用按 DPR 调整的内描边，改善 Safari 分数尺寸下的细线显示且不改变布局。 @Stevring
- 运行状态位于当前工作轮次尾部、待处理插话之前，方便区分运行中和排队中的消息，并改善界面布局抖动问题 @imccyu
- 会话列表支持插件图标，并改善键盘与触屏操作。 @LegGasai
- 侧栏会话悬浮卡显示工作目录，便于区分未分组或同名会话。 @turtle2099
- 优化侧栏空间布局，改善响应区域，平滑搜索框展开与收起。 @Yifffan
- 侧栏搜索支持不区分大小写的会话 ID 子串匹配。 @turtle2099
- 消息在宿主确认接收后才显示并清空草稿；发送期间输入框只读，发送失败时保留草稿、引用和附件。 @LegGasai
- 图片上传方式调整为进入输入框后立即上传，发送消息时复用已上传的图片。默认单张图片上限提高到 50 MiB。 @LegGasai
- 已回答的问题批次以消息气泡显示，原生与 PTC 调用的回答在过程折叠后仍可回看。 @Kaige-Gao
- 悬浮侧栏面板拖过屏幕边缘时有阻力，松手后弹回可见区域；窗口缩小时保持控件可达。 @yudshj
- 支持中键关闭右侧栏标签，关闭后台标签不改变当前选中项，并保留不可关闭的起始页。 @Kingwl
- 修复工作步骤展开和收起时的正文跳动、滚动回跳与空白间隙，保持运行状态可见。 @imccyu
- 点击聊天中的文件行号链接后，代码和文本预览以短暂高亮标出目标行并淡出。 @turtle2099
- Trajectory 结果页新增实时工具返回值的原始 JSON 查看，并与渲染结果上下展示 @kermanx
- Search 功能优先向模型提供 Search API 长摘要，默认每来源最多 800 字符；搜索卡片仍展示短摘录。 @yudshj
- 模型选择器默认勾选已配置模型，可一次添加或移除候选并保留自定义值；筛选后的全选只作用于可见候选。 @turtle2099
- 对通过 pi-ai 接入且不支持在对话中追加系统消息的模型，后续系统消息会在原位置作为提醒提供，不会移到最初的提示词中。 @Tuyixiang
- 支持在 DeepSeek 与 pi-ai 提供商内拖动或用方向键排序模型，保存后保留顺序及完整模型参数。 @Magolor
- 输入框统计读数被截断时，可通过提示气泡查看完整数值；会话统计也显示轮次与步骤数。 @turtle2099
- Auto 自动审核支持在连续工具调用之间更好地复用历史上下文缓存，减少重复处理。 @turtle2099
- 后台任务完成通知直接携带小体积输出，并减少已读取结果和子代理收尾消息的重复通知。 @turtle1999
- 子代理等待指引减少 sleep 和重复轮询：只有结果尚未返回时，结束当前轮次等待完成通知。 @Chinesezjc
- 远程连接默认启用 WebSocket 压缩，减少大量历史消息的传输量；可通过 `websocketCompression` 关闭。 @imccyu
- Web 静态资源支持 ETag 条件请求，未变化的资源返回 304，减少重复下载。 @imccyu
- Word 常规编辑在保存并核对内容与格式后即可交付，减少不必要的 ZIP、XML 与元数据检查。 @tianyicui
- 加快 Web 预览中源码编辑器等懒加载组件的首次打开。 @turtle2099
- 加快带固定目录前缀的文件查找，跳过无关目录，同时保持结果与排序规则不变。 @kermanx
- 支持拖动平移超出视口的图片，并通过应用内拖放或桌面原生拖放交付原始文件。 @std4453
- 手机和平板打开宿主文件后会提示操作已在其它设备执行；各端失败时显示错误提示，电脑端成功保持静默。 @Stevring

#### 问题修复

- 全局与项目 AGENTS.md 分别使用 maxBytes 预算，避免项目指令挤掉全局指令；同时包含两条链的消息总量最多为原配置的两倍。 @ZiyaZhang
- 切换到较小上下文模型前先用原模型压缩历史；失败时停止切换请求并保留原请求头。 @Dudu-0223
- 使用 Gemini 的 OpenAI 兼容 Chat Completions 接口时，工具调用会保留并在后续请求中带回所需的思考签名，避免因签名缺失导致请求拒绝。 @turtle2099
- 系统提示词未变化时，新一轮模型请求可继续复用已有上下文前缀缓存，避免不必要的缓存失效。 @mektpoy
- 缺少所需凭据时不向模型提供 Web 搜索工具；新版 Web API 的抓取工具也按凭据就绪状态提供。 @LegGasai
- 修复关闭应用时 Auto 会话权限意外变成完全访问的问题，保留已保存的权限与审批策略。 @tianyicui
- 等待后台任务输出时，用户插话可立即解除等待并返回当前输出，后台任务继续运行。 @mektpoy
- 修复预设往返切换后委派工具暂时缺失的问题，并让委派工具遵循当前 Agent 的工具限制。 @Dudu-0223
- 被阻塞的目标可从 Web 目标栏继续；已耗尽轮次上限时仍需先提高上限。 @turtle2099
- `sdk-minimal` 配置在请求模型或执行工具前保存会话恢复记录；保存失败时不会继续相关操作，提高短会话中断后的可恢复性。 @LogosVeritas
- 本地文件工具将开头的 ~ 或 ~/ 正确展开为宿主主目录，路径中间的 ~ 保持字面含义。 @turtle2099
- 修复多选问题有多个推荐选项时只预选第一项的问题，现在卡片打开时预选全部推荐项；单选和已回答卡片的行为保持不变。 @yudshj
- 聊天中的相对文件链接按点击时会话当前工作目录打开，进入 worktree 后不再误开原项目文件。 @turtle2099
- Markdown 中单个 ~ 保持字面显示，只有 ~~ 才形成删除线。 @turtle2099
- 修复跨行 $$ 数学块的渲染，保留首行公式内容及公式后的正文。 @Chinesezjc
- 本地 Markdown 图片被覆盖后，新消息和新打开的预览会显示当前文件，而不是复用旧图。 @turtle2099
- 修复裸 URL 将后续中文标点及正文一并识别为链接的问题 @turtle2099
- 修复 Markdown 中 Windows 文件路径的反斜杠被转义删除，导致链接或图片打开错误位置的问题。 @turtle2099
- 交付卡与收尾回复中的文件引用覆盖整轮，包括回复之后的交付与写入；present 说明等待用户回答前应先提供文件链接。 @yudshj
- 修复部分结构体代码高亮导致页面长时间卡死的问题。 @yudshj
- 修复输入框粘贴文件或文件夹路径时仅高亮目录前缀的问题。 @turtle2099
- 断线或重连期间暂停聊天运行计时，连接恢复后按轮次起点恢复显示。 @turtle2099
- 停止后补发的插话与新消息在轨迹中按日志顺序显示于助手输出之前，刷新和历史加载后仍保持一致。 @kermanx
- 侧栏原生拖动使用独立主题背景预览，避免混入后方消息内容并保留排序。 @Stevring
- 深色主题设置导航的悬停背景可见，选中态保持优先。 @turtle2099
- 长问题和选项说明可原地展开与收起，内容区滚动时导航与提交按钮保持可见。 @yudshj
- 修复 macOS 激活窗口时点击会话标题误触发重命名，正常双击重命名保持不变。 @turtle2099
- 切换、打开或关闭侧栏文件标签时，标签栏从原滚动位置继续，不再先跳回最左端。 @turtle2099
- 普通会话分支现在独立运行，不再被误识别为子智能体；真正子智能体仍保留创建者关系。 @Dudu-0223
- 安装自托管 Git 插件时，HTTPS 无法读取而 SSH 可用时改用 SSH。 @turtle2099
- 安装含 prepare 脚本的 Git 插件时，显示脚本授权和重试选项，不再仅报告未知错误。 @turtle2099
- 审批提示明确说明是否向用户请求授权，避免模型误解 never 策略。 @turtle2099
- 修复 macOS 持久 Bash 工具中感叹号被历史展开改写或导致命令超时的问题。 @grllll
- 明确告知模型：用户跳过提问后应继续，不重复追问，也不能把跳过当作授权。 @turtle2099
- 修复一个技能根目录读取失败导致其他目录中的技能也不可用的问题，保留可用技能并提示不完整的发现结果。 @Dudu-0223
- 配置项目按自身 ESM 规则解析插件依赖子路径、包内导入和自引用。 @shigma
- Web Fetch 可读取编码声明混含 UTF-8 的可读页面。 @Dudu-0223
- 修复工具调用因无歧义的可选参数而失败的问题：grep 接受空 include。 @turtle1999
- 修复以管理员权限运行 DSH 或在 Windows Sandbox 中使用时，受限沙箱命令无法启动的问题；文件写入和删除限制保持不变。 @huoyaoyuan
- Windows 已安装应用显示正确的发布者名称，卸载列表中的应用名称不再附带版本号。 @winewill
- 改善 Windows 安装器进度页绘制、拖动与窗口激活表现，恢复系统最小化动画，并让标题按钮在原区域松开时触发。 @winewill
- 桌面 Host 完成任务清理并确认关闭后立即退出，避免遗留事件循环句柄阻塞更新安装。 @turtle2099
- macOS 桌面更新在确认前等待退出全屏，安装失败后恢复工作区；退出全屏超时则保留任务并提示重试。 @winewill
- 桌面更新提示改为窗内视图，后台结果更新不再抬升原生子窗口；更新提示随应用浅色或暗色主题显示。 @winewill
- 修复 macOS 桌面端会话头部菜单与按钮之间出现过大空隙的问题。 @turtle2099
- 修复 macOS 原生目录选择框初次显示后灰显、目录无法点击的问题。 @EricMoin

#### 其他变更

- DSH 的最低 Node.js 版本提高至 24.9；使用旧版 Node.js 的用户需先升级运行时。 @tianyicui
- SDK 提供与 Web 模式一致的文件交付、问答、调度、技能和上下文能力，并支持问答回调与操作审批。 @koalazf99
- 修复会话创建、恢复和销毁期间的事件发布与清理顺序；初始化事件可实时订阅，取消时等待已取得资源完成清理。 @kermanx
- Session API 新增独立接口，可分别读取快照和持续订阅会话事件日志、运行状态以及事件投影数据。 @imccyu
- 自定义插件需迁移到异步会话投影句柄，旧注册释放函数与按 key 读取保留兼容和弃用提示；审批状态恢复要求组合提供 sessionProjections 并等待服务激活。 @kermanx, @Magolor
- 整单元 JSON 与 SQLite 存储支持读取领域明确声明的兼容旧版本，并以新版本格式写入。 @Magolor
- Web Fetch 不再拒绝非公网地址，可用于代理与内网，部署应自行限制网络访问。 @turtle2099
- Cordis Timer 实现同步上游，自定义插件需适配返回值 @shigma
- Cordis Fiber 提供统一的原始配置、候选配置解析和生效配置访问，设置编辑与热更新使用一致的配置来源。 @shigma
- 桌面启动故障可获取诊断报告，并附上有界的近期插件操作记录，便于排查问题。 @winewill
- macOS Computer Use 新增系统与应用权限引导，支持长按并改善应用启动；应用授权可跨重启保留。 @CreatixChu, @koalazf99
- Headless 支持实验性 Auto 自动审核 @tianyicui
- Ralph 循环与会话搜索继续随包分发，不再显示在实验性列表。 @ZiyaZhang
- 升级 pi-ai 至 1.3.0，并同步模型目录、端点与推理回放规则；完整工具参数格式错误会在执行任何工具前终止该次响应。 @tianyicui
- 未声明容量的自定义模型默认上下文与最大输出调整为十进制 1M/128K；较小端点应显式覆盖容量以避免延迟压缩。 @LegGasai
- Agent 在提示词组装与 pre-step 前固定本步模型，重试保留同一选择；插件应通过 agent.model 选择模型，agent/request 不再允许改路由。 @kermanx
- 「自定义插件市场」更名为「自定义插件索引」，发现页读取用户添加的索引文件，索引生成器排除标记为 private 的版本、标签与默认分支包。 @turtle2099, @turtle1999
- 官方组合包列表改由 @deepseek-ai/dsh-official-bundles 导出；自定义集成需更新原 app-boot 的相关导入。 @turtle2099
- 工具可按步骤条件启用，模型声明、PTC 绑定与执行准入保持一致；插件需迁移 tools.resolve/executable 与提示词组装接口。 @LegGasai
- Node PTC 新增 VM Script 模式，支持顶层 await、动态导入和表达式结果，可独立开启跨调用状态保留；默认仍逐次执行，脚本顶层不支持 return 或 using。 @kermanx
- 原生与 PTC 工具执行拆为按 Agent 作用域选择的插件；PTC 通过配置 overlay 启用，旧 tools.mode 与 DSH_TOOLS_MODE 需迁移。 @kermanx
- PTC Node 控制通道改用 birpc；自部署 bootstrap 与 SSH helper 必须同步升级，SSH 协议从 2 升为 3。 @kermanx
- PTC Mode 中由调用方取消的 run_code 改为返回 ABORTED，而非 CODE_RUN_FAILED；SDK 和 Session 消费方需更新取消分类。 @kermanx

#### New Features

- Show rich-text plugin details in the plugin manager and improve page layout and navigation. by @turtle1999, @turtle2099
- Support updating third-party plugin packages and attempt to restore the previous version if hot updates fail. by @turtle1999, @turtle2099
- Insert chat text as quotes in the composer and show compact previews after sending. by @lsdsjy, @imccyu
- Copy the complete conversation history as Markdown, including the original log path when available. by @tianyicui
- Keep all assistant text replies visible when work steps are collapsed, with an option to show only the final answer. by @imccyu
- Add Japanese, Spanish, French, German, Russian, and Brazilian Portuguese interface text and locale configuration. by @07akioni
- Clear all inactive automation tasks in one confirmed action while keeping active tasks. by @Chinesezjc
- Add the experimental `subagent_oar` tool plugin to delegate independent tasks to local Codex or Claude CLIs. by @tianyicui
- Add experimental Personalized recommendations, offering official-plugin activation or personalized-page creation cards below answers when relevant. by @ZiyaZhang
- Add experimental Developer tools — Statistics for per-turn and per-step context, cache, model, and tool measurements. by @mektpoy
- Add experimental Change requests and worktrees to run Sessions in separate Git worktrees and inspect linked PR status and code changes. by @LegGasai, @tianyicui

#### Improvements

- Improve mobile and tablet input with fewer automatic keyboard pop-ups, keyboard dismissal after sending, and corrected caret scrolling. by @Stevring
- Use fullscreen settings with horizontal navigation on narrow browsers, scroll focused tabs fully into view, and use 16px task text fields on touch devices. by @Stevring
- Keep touch actions free from hover tooltips, expose Workspace and archived-result controls, and scroll wide Markdown tables within their own containers. by @Stevring
- Fade overflowing header status actions in narrow conversation panes so utility buttons such as Open in app remain visible and clickable. by @turtle2099
- Restore automatic icon-only model selection in narrow composers while retaining the full model name in the menu. by @LegGasai
- Fix font settings crowding their labels and descriptions on phones and narrow windows by stacking font fields while keeping size controls right-aligned. by @EricMoin
- Distinguish same-named Workspaces with their shortest unique path suffix and prioritize that suffix on narrow screens. by @turtle2099
- Use DPR-aware inset outlines on shared buttons to stabilize fine borders at fractional sizes in Safari without changing layout. by @Stevring
- Place running status at the active turn tail before queued steering messages, distinguishing active and pending input and reducing layout jitter. by @imccyu
- Support plugin icons in the Session list and improve keyboard and touch interaction. by @LegGasai
- Show working directories on sidebar Session hover cards to distinguish ungrouped or similarly named Sessions. by @turtle2099
- Improve sidebar spacing and click targets, with smoother search-field expansion and collapse. by @Yifffan
- Find Sessions by case-insensitive ID substrings in sidebar search. by @turtle2099
- Show messages and clear drafts only after the host accepts them. Keep the composer read-only while sending and preserve drafts, quotes, and attachments on failure. by @LegGasai
- Upload images as soon as they enter the composer and reuse the uploaded images when sending messages. Raise the default per-image limit to 50 MiB. by @LegGasai
- Show answered question batches as message bubbles so answers from native and PTC calls remain visible after work steps collapse. by @Kaige-Gao
- Add resistance and spring-back when floating sidebar panels are dragged beyond screen edges, and keep their controls reachable when the window shrinks. by @yudshj
- Close right-sidebar tabs with the middle mouse button without selecting background tabs, while preserving the protected start tab. by @Kingwl
- Fix transcript jumps, scroll reversal, and blank gaps when expanding or folding work steps, while keeping running status visible. by @imccyu
- Briefly highlight and fade the target line in code and text previews after opening a file-line link from chat. by @turtle2099
- Add raw JSON views of live tool results to Trajectory, displayed above rendered results. by @kermanx
- Search prioritizes long Search API summaries for models, capped at 800 characters per source by default, while search cards retain short snippets. by @yudshj
- Start the model picker with configured models selected, add or remove candidates while preserving custom values, and apply select-all only to visible candidates. by @turtle2099
- For models accessed through pi-ai that cannot accept additional system messages during a conversation, keep later system messages in place as reminders rather than moving them into the initial prompt. by @Tuyixiang
- Reorder models within DeepSeek and pi-ai providers by dragging or using arrow keys, preserving order and complete model parameters when saved. by @Magolor
- Show full truncated composer statistics in tooltips and include turn and step counts in Session statistics. by @turtle2099
- Improve history-context cache reuse across consecutive tool calls in Auto review to reduce repeated processing. by @turtle2099
- Background-job completion notices include small outputs and reduce duplicate notifications for already-read results and subagent closing messages. by @turtle1999
- Reduce sleeping and repeated polling in subagent guidance: end the current turn when only a result remains pending and wait for its completion notification. by @Chinesezjc
- Enable WebSocket compression for remote connections by default to reduce transfers of large message histories; disable it with `websocketCompression`. by @imccyu
- Web static assets support ETag revalidation, returning 304 for unchanged files to avoid repeated downloads. by @imccyu
- Deliver ordinary Word edits after saving and checking content and formatting, without unnecessary ZIP, XML, or metadata inspection. by @tianyicui
- Speed up first-time loading of lazy components such as the source editor in the Web preview. by @turtle2099
- Speed up file searches with literal directory prefixes by skipping unrelated directories while preserving results and ordering. by @kermanx
- Pan images that exceed the viewport and transfer original files through in-app drag-and-drop or native desktop dragging. by @std4453
- Tell phone and tablet users when a file is opened on another device. Show failure notifications on all devices and keep successful desktop operations silent. by @Stevring

#### Bug Fixes

- Budget global and project AGENTS.md chains separately so project instructions do not evict global guidance; messages containing both chains can use up to twice maxBytes. by @ZiyaZhang
- Compact history with the previous model before switching to a smaller context window; stop the switch request and preserve its previous header if compaction fails. by @Dudu-0223
- Preserve the required thought signatures in Gemini tool calls over OpenAI-compatible Chat Completions and include them in subsequent requests to prevent rejection caused by missing signatures. by @turtle2099
- Reuse existing context-prefix caches for new model requests when the system prompt is unchanged, avoiding unnecessary cache invalidation. by @mektpoy
- Hide Web search tools when required credentials are missing; fetch tools using the newer Web API also follow credential readiness. by @LegGasai
- Preserve saved Auto permission and approval policy during application shutdown instead of unintentionally switching to Full access. by @tianyicui
- User steering now releases a background-output wait immediately and returns current output without stopping the job. by @mektpoy
- Fix delegation tools being temporarily unavailable after preset round trips and apply the current Agent’s tool restrictions to delegation. by @Dudu-0223
- Resume blocked goals from the Web goal bar; goals that have exhausted their round limit still require a higher limit first. by @turtle2099
- Save Session recovery records before model requests and tool execution in `sdk-minimal`. Stop related operations if saving fails to improve recovery after short Sessions are interrupted. by @LogosVeritas
- Expand leading ~ or ~/ in local file tools to the Host home directory while preserving literal tildes elsewhere in paths. by @turtle2099
- Preselect every recommended option in multiple-choice questions instead of only the first, while preserving single-choice and answered-card behavior. by @yudshj
- Resolve relative chat file links from the Session working directory at click time so worktree Sessions do not open the original checkout. by @turtle2099
- Keep single tildes literal in Markdown and require double tildes for strikethrough. by @turtle2099
- Fix multiline $$ math rendering so opening-line math and following prose are preserved. by @Chinesezjc
- Show the current local Markdown image in newly rendered messages and previews after the file is overwritten. by @turtle2099
- Fix bare URLs incorrectly including following Chinese punctuation and text in links. by @turtle2099
- Preserve backslash separators in Windows-path Markdown links and images so they resolve to the intended location. by @turtle2099
- Include whole-turn deliveries and writes in deliverable cards and closing-reply file links, even after the reply; present guidance tells agents to link files before waiting for user input. by @yudshj
- Fix prolonged page freezes caused by syntax highlighting of certain struct definitions. by @yudshj
- Fix pasted file and folder paths being highlighted only through their directory prefixes in the composer. by @turtle2099
- Pause the chat running clock during disconnection or reconnection and resume elapsed-time display after reconnecting. by @turtle2099
- Keep retained steering and follow-up input in log order before assistant output in Trajectory, including after refresh and history loading. by @kermanx
- Use isolated, theme-backed sidebar drag previews to avoid capturing content behind rows while preserving native reordering. by @Stevring
- Make settings-navigation hover visible in dark mode while retaining selected-state priority. by @turtle2099
- Expand and collapse long questions and option descriptions in place, with navigation and submission controls kept visible. by @yudshj
- Prevent a window-activating click on a Session title from accidentally opening rename on macOS, while preserving normal double-click rename. by @turtle2099
- Preserve the sidebar file-tab strip's scroll position when selecting, opening, or closing tabs instead of restarting from the left edge. by @turtle2099
- Run ordinary conversation forks independently instead of treating them as subagents, while preserving creator relationships for real subagents. by @Dudu-0223
- Use SSH for self-hosted Git plugin installation when HTTPS is unreadable and SSH is available. by @turtle2099
- Offer script approval and retry when installing Git plugins with prepare scripts instead of reporting only an unknown error. by @turtle2099
- Approval messages explicitly state whether user approval is requested, avoiding ambiguity around the never policy. by @turtle2099
- Prevent history expansion from rewriting exclamation marks or causing persistent Bash command timeouts on macOS. by @grllll
- Tell the model to continue after a skipped question without asking it again or treating the skip as permission. by @turtle2099
- Keep skills from healthy roots available when another skill root cannot be read, and report incomplete discovery. by @Dudu-0223
- Resolve configuration-project plugins using the project’s ESM rules for dependency subpaths, package imports, and self-references. by @shigma
- Allow Web Fetch to read valid UTF-8 pages whose encoding declarations contain multiple labels including UTF-8. by @Dudu-0223
- Fix tool calls failing on unambiguous optional arguments by accepting an empty grep include. by @turtle1999
- Fix restricted sandbox commands failing to start when DSH runs as administrator or in Windows Sandbox, while preserving file-write and deletion restrictions. by @huoyaoyuan
- Correct the Windows installed-app publisher and keep the application name separate from its version in uninstall listings. by @winewill
- Improve Windows installer progress rendering, dragging, and activation, restore native minimize transitions, and trigger caption buttons on release inside the original button. by @winewill
- Exit the Desktop Host immediately after acknowledging completed teardown so leftover event-loop handles do not block update installation. by @turtle2099
- Leave macOS fullscreen before Desktop update confirmation so failed installs recover the workspace; preserve tasks and show retry guidance if fullscreen exit times out. by @winewill
- Show desktop update prompts in-window without raising native child windows for background results, and match prompts to the app’s light or dark theme. by @winewill
- Keep conversation header menus close to their trigger buttons on macOS desktop. by @turtle2099
- Fix the native macOS directory picker initially appearing inactive and ignoring directory clicks. by @EricMoin

#### Chores

- Raise the minimum supported Node.js version to 24.9. Upgrade older Node.js runtimes before upgrading DSH. by @tianyicui
- Provide SDK file delivery, questions, scheduling, skills, and context capabilities consistent with Web mode, with question callbacks and operation approval. by @koalazf99
- Fix event publication and cleanup around Session creation, recovery, and disposal. Make initialization events available to live subscribers and wait for acquired resources to finish cleanup on cancellation. by @kermanx
- Add independent Session APIs to read snapshots and continuously subscribe to Session event logs, execution state, and event-projection data. by @imccyu
- Migrate custom plugins to asynchronous retained Session-projection handles. Legacy registration disposers and key-based reads retain compatibility with deprecation notices; approval-state recovery requires the composition to provide sessionProjections and await service activation. by @kermanx, @Magolor
- Allow whole-unit JSON and SQLite storage to read explicitly declared compatible older versions and write in the current version format. by @Magolor
- Allow Web Fetch to access non-public addresses for proxies and internal networks; deployments must restrict network access separately. by @turtle2099
- Synchronize Cordis Timer with its upstream implementation; custom plugins must adapt to changed return values. by @shigma
- Provide unified Cordis Fiber access to raw configuration, candidate resolution, and effective configuration, used consistently by settings and hot reload. by @shigma
- Retrieve diagnostic reports for desktop startup failures, including a bounded history of recent plugin operations to help troubleshooting. by @winewill
- Add system and application permission onboarding to macOS Computer Use, support long clicks, and improve application launching. Retain application permissions across restarts. by @CreatixChu, @koalazf99
- Support experimental Auto review in Headless. by @tianyicui
- Keep Ralph loop and Session search bundled, but no longer list them among experimental plugins. by @ZiyaZhang
- Upgrade pi-ai to 1.3.0 with updated model catalogs, endpoints, and reasoning replay rules; malformed completed tool arguments fail the response before any tool executes. by @tianyicui
- Default undeclared custom-model capacities to decimal 1M context and 128K output; smaller endpoints should set explicit capacities to avoid delayed compaction. by @LegGasai
- Capture the step model before prompt assembly and pre-step and retain it through retries; plugins should select through agent.model rather than changing routes in agent/request. by @kermanx
- Rename Custom plugin markets to Custom plugin indexes. Discover reads user-added index files, and index generation excludes private versions, tags, and default-branch packages. by @turtle2099, @turtle1999
- Official bundle lists are now exported by @deepseek-ai/dsh-official-bundles; custom integrations must update imports from app-boot. by @turtle2099
- Activate tools conditionally per step with consistent model declarations, PTC bindings, and execution admission. Plugins must migrate tools.resolve/executable and prompt-assembly integration. by @LegGasai
- Add a VM Script mode to Node PTC with top-level await, dynamic imports, and expression results, plus optional state retention across calls. Per-call execution remains the default; top-level return and using are unsupported. by @kermanx
- Split native and PTC tool execution into Agent-scoped plugins; enable PTC through configuration overlays and migrate tools.mode and DSH_TOOLS_MODE usage. by @kermanx
- Move the PTC Node control channel to birpc; upgrade self-deployed bootstraps and SSH helpers together, with SSH protocol increasing from 2 to 3. by @kermanx
- Report caller-cancelled run_code calls in PTC Mode as ABORTED rather than CODE_RUN_FAILED. SDK and Session consumers must update cancellation handling. by @kermanx

Full Changelog: [dsh-v0.2.1-rc.4...dsh-v0.2.2-alpha.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.4...dsh-v0.2.2-alpha.2)

## [0.1.40] - 2026-10-30

### 修复

- 兼容上游 DeepSeek Harness >= 0.2.2 将官方配置模板拆分至 `@deepseek-ai/dsh-official-bundles` 的变更，修复 `ensure-marketplace` 在新上游版本首次初始化 profile 时报错 `TypeError: Cannot read properties of undefined (reading 'web')` 的问题。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-rc.4` → `dsh-v0.2.1-rc.5`
- Commit：`b830ec950faba0a46dda564be3e2d854afed94f1`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.5)

#### 体验优化

- 优化对话中思考内容的展示效果。 @LegGasai

#### Improvements

- Improve how thinking content is displayed in conversations. by @LegGasai

Full Changelog: [dsh-v0.2.1-rc.4...dsh-v0.2.1-rc.5](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.4...dsh-v0.2.1-rc.5)

## [0.1.39] - 2026-10-28

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-rc.3` → `dsh-v0.2.1-rc.4`
- Commit：`504a01a9578abc2c6f1fb896b1dc322c9fe24f66`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.4)

#### 问题修复

- 修复 ACP 模式下诊断输出混入 stdout 的问题。 @LegGasai, @tianyicui

#### Bug Fixes

- Fix diagnostics leaking into stdout in ACP mode. by @LegGasai, @tianyicui

Full Changelog: [dsh-v0.2.1-rc.3...dsh-v0.2.1-rc.4](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.3...dsh-v0.2.1-rc.4)

## [0.1.38] - 2026-10-28

### 修复

- 修复桌面端重启导致用户设置（如自定义 API Provider、通用配置）丢失的问题。
- 重构托管策略解析逻辑，精准过滤托管条目并保留策略标记块内夹带的用户自定义配置。
- 支持历史内置插件（如 `dshmarket 1.66.40`）在应用更新时自动平滑升级至最新版本（`1.70.1`）。
- 启动流程增加日常快速直通检测，无配置或版本变更时不进行无意义的文件写入。
- 升级 `rustls-webpki` 与 `webpki-root-certs` 依赖，修复安全漏洞通告。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-rc.3`
- Commit：`1f81c047fc48fa190a683e469daa699857e9afe8`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.3)

#### 体验优化

- 新增左侧栏、会话视图和右侧栏的「更多」菜单，方便浏览和创建插件。 @Yifffan, @imccyu
- 修复切换会话后，点击「新会话」找不回未发送草稿的问题。 @imccyu

#### 其他变更

- DeepSeek API Key 适配器的模型列表更新方式与账号登录模式保持一致。 @LegGasai

#### Improvements

- Add More menus to the left sidebar, conversation views, and right sidebar for browsing and creating plugins. by @Yifffan, @imccyu
- Fix New Session losing an unsent draft after switching sessions. by @imccyu

#### Chores

- The DeepSeek API key adapter now updates its model list the same way as account sign-in. by @LegGasai

Full Changelog: [dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3)

## [0.1.37] - 2026-10-24

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-rc.2` → `dsh-v0.2.1-rc.3`
- Commit：`1f81c047fc48fa190a683e469daa699857e9afe8`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.3)

#### 体验优化

- 新增左侧栏、会话视图和右侧栏的「更多」菜单，方便浏览和创建插件。 @Yifffan, @imccyu
- 修复切换会话后，点击「新会话」找不回未发送草稿的问题。 @imccyu

#### 其他变更

- DeepSeek API Key 适配器的模型列表更新方式与账号登录模式保持一致。 @LegGasai

#### Improvements

- Add More menus to the left sidebar, conversation views, and right sidebar for browsing and creating plugins. by @Yifffan, @imccyu
- Fix New Session losing an unsent draft after switching sessions. by @imccyu

#### Chores

- The DeepSeek API key adapter now updates its model list the same way as account sign-in. by @LegGasai

Full Changelog: [dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3)

## [0.1.36] - 2026-10-18

### 修复

- 修复上游 workspace 依赖链接导致运行时打包递归复制开发依赖、耗尽 CI 磁盘的问题；在独立部署目录中补齐运行时依赖，避免错误借用源码依赖。
- 修复依赖扫描将 JavaScript 名称属性当作 YAML 插件声明，以及无新增依赖时重复扫描和输出大量日志的问题。
- 将 rustls 升级至 0.23.46，修复安全审计报告的 TLS 漏洞。
- 关闭更新器未使用的 ZIP 解压功能，移除存在漏洞的 zip 依赖；保留 Windows/Linux 原始安装包和 macOS tar.gz 更新支持。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.1-alpha.1` → `dsh-v0.2.1-rc.2`
- Commit：`687f282e8625c6b8d11ff58211a90524be2e4317`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.2)

#### 新增功能

- 适配 DeepSeek-V4.1-Flash-1017 上线 @LegGasai
- 适配 DeepSeek Search 与 Fetch API，可在网页搜索设置中开启 @yudshj, @LegGasai

#### New Features

- Add support for DeepSeek-V4.1-Flash-1017. by @LegGasai
- Add support for DeepSeek Search and Fetch APIs, which can be enabled in Web Search settings. by @yudshj, @LegGasai

Full Changelog: [dsh-v0.2.1-rc.1...dsh-v0.2.1-rc.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.1...dsh-v0.2.1-rc.2)

## [0.1.35] - 2026-10-03

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.0-rc.2` → `dsh-v0.2.1-alpha.1`
- Commit：`5badb15009ae1756c3afe0ae0cef1faafc290ccc`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.1)

#### ✨ 新增功能

- 新增实验性 Claude Code Mods 兼容层。目前阶段的主要目的是验证 Claude Code Mods API 功能大致为 DeepSeek Harness 插件的一个子集，而非为用户提供实际的完整兼容性。 @tianyicui
- 插件管理页新增「让 Agent 创建插件」入口，可保留草稿进入创造模式；发送需求后才开始执行。 @ZiyaZhang
- 新会话支持预填未发送的提示；恢复草稿或切换工作区时保留文件、目录和会话引用。 @imccyu
- Markdown 文件预览将 YAML 头部元数据显示为清晰的字段列表。 @turtle2099
- Web 支持通过 `--public-url` 指定显示、打开及提供给模型的对外访问地址，支持带路径前缀的反向代理入口。 @oraluben
- 新增可选的开发者工具组合包，提供会话原始日志、聊天分组与正文的双向定位，以及内嵌 Host 调试工具；内嵌 DevTools 目前使用英文界面。 @imccyu

#### 🐛 问题修复

- 目标编辑支持多行文本和 Shift+Enter 换行，并改善目标与排队消息编辑器的中文输入及宽度适配。 @turtle2099
- 修复目标任务停止、恢复并再次停止后，新消息滞留队列的问题。 @turtle2099
- 修复部分 Bash、PowerShell 和文件修改记录无法展开输出或差异的问题。 @turtle2099
- 关闭代码工作视图后仍可选择标准、创造和自定义模式；内置 PTC／极简默认值改为标准，已有会话保持原模式。 @ZiyaZhang
- 修复启停插件时其他插件的样式被移除、需要刷新页面才能恢复的问题。 @turtle2099
- 登录请求未收到响应时显示网络检查提示，便于区分连接问题与其他登录失败。 @lsdsjy
- 桌面端默认使用系统分配的端口，避免 Windows 保留端口范围导致应用无法启动。 @turtle2099
- 修复侧栏列表重排或重新显示后，会话加载动画不同步的问题。 @turtle2099
- 启用开发目录监听后，HMR 可刷新包入口和依赖映射配置，并正确重载仍在运行的原入口。 @imccyu
- 修复新组合包启用后找不到依赖，以及停用或卸载后残留依赖映射的问题；替换已安装包的版本仍需重启。 @imccyu

#### 🎨 体验优化

- 改善自动化任务详情在窄窗口中的布局，关联会话入口会按可用空间收起为图标。 @turtle2099
- 组合包详情页显示代码来源和当前版本，便于查看安装来源及重装所需的信息。 @turtle1999
- 工具调用在准备阶段即可显示已到达的命令说明、文件路径和内容生成进度。 @imccyu
- 加快大量会话的列表读取，同时继续为其他操作提供执行机会。 @turtle1999
- 插件安装结果显示实际安装版本；因新版本冷却策略安装较旧版本时，提供说明和精确版本安装方式。 @turtle2099

#### ⚠️ 其他变更

- 自动化任务改为 Web 内置能力，提醒工具按模式提供：标准、创造和 PTC 模式可用，极简模式和子代理不可用；旧实验组合包选择会自动清理，已有任务保留。 @Chinesezjc, @turtle1999
- 子路径插件不再读取独立的 `package.json`，显示文本和图标须通过对应子路径导出；插件开发模板同步补齐本地化信息与图标。 @turtle1999
- 破坏性变更：移除运行时 invariant 插件及各包的 `./invariant` 导出；依赖这些诊断入口的扩展和自定义 profile 需要调整。 @turtle2099
- 输入区统计扩展拆为 `activity` 和 `usage` 两个独立入口；覆盖旧 `stats` 整行的插件需要更新注册 ID。 @turtle1999

#### New Features

- Add an experimental Claude Code Mods compatibility layer. At this stage, the main goal is to verify that the Claude Code Mods API's capabilities are broadly a subset of what DeepSeek Harness plugins can do, rather than to offer users complete, practical compatibility. by @tianyicui
- Add a “Let Agent create a plugin” entry to plugin management. It opens Creator mode while preserving the draft and starts work only after the request is sent. by @ZiyaZhang
- Support unsent initial prompts for new sessions and preserve file, folder, and session references when restoring drafts or moving them between workspaces. by @imccyu
- Display YAML frontmatter as a readable field list in Markdown file previews. by @turtle2099
- Add `--public-url` for the Web address shown to users, opened in the browser, and supplied to the model, including reverse-proxy URLs with a path prefix. by @oraluben
- Add an optional Developer Tools bundle with raw session logs, bidirectional navigation between chat groups and the conversation, and embedded Host diagnostics. The embedded DevTools currently uses an English interface. by @imccyu

#### Bug Fixes

- Support multiline goal editing with Shift+Enter, and improve IME handling and resizing in goal and queued-message editors. by @turtle2099
- Fix new messages remaining queued after stopping, resuming, and stopping a goal-driven task again. by @turtle2099
- Fix some Bash, PowerShell, and file-mutation records failing to expand their output or diff. by @turtle2099
- Keep Standard, Creator, and custom modes available when coding view is disabled. Built-in PTC or Minimal defaults change to Standard, while existing sessions retain their mode. by @ZiyaZhang
- Fix toggling a plugin removing styles owned by other plugins until the page is refreshed. by @turtle2099
- Show a network-check message when a sign-in request receives no response, distinguishing connection problems from other sign-in failures. by @lsdsjy
- Let the operating system assign the Desktop port by default, avoiding startup failures caused by reserved port ranges on Windows. by @turtle2099
- Keep session loading animations synchronized after sidebar rows move or become visible again. by @turtle2099
- With development-directory watching enabled, refresh package-entry and dependency-mapping configuration while continuing to reload the entry that is already running. by @imccyu
- Fix missing dependencies after enabling a new bundle and stale dependency mappings after disabling or uninstalling bundles. Replacing an installed package version still requires a restart. by @imccyu

#### Improvements

- Improve Automation task details in narrow windows by collapsing the linked-session action to an icon when space is limited. by @turtle2099
- Show a bundle’s code source and current version in its details, making installation and reinstallation information easier to find. by @turtle1999
- Show available command descriptions, file paths, and content-generation progress while tool calls are still preparing. by @imccyu
- Speed up large session listings while periodically allowing other work to run. by @turtle1999
- Show the version actually installed and explain how to request an exact version when pnpm’s release-age policy selects an older release. by @turtle2099

#### Chores

- Make Automation tasks part of Web, with reminder tools scoped to Standard, Creator, and PTC modes. Minimal mode and subagents do not receive them. Retired experimental-bundle selections are cleaned up while existing tasks are preserved. by @Chinesezjc, @turtle1999
- Stop reading separate `package.json` files for subpath plugins; display text and icons must use the corresponding subpath exports. Plugin-development templates now include localized metadata and icons. by @turtle1999
- Breaking change: remove runtime invariant plugins and package `./invariant` exports. Extensions and custom profiles using these diagnostic entry points must be updated. by @turtle2099
- Split composer statistics into separate `activity` and `usage` extension entries. Plugins replacing the former `stats` row must update their registered IDs. by @turtle1999

Full Changelog: [dsh-v0.2.0-rc.2...dsh-v0.2.1-alpha.1](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.2...dsh-v0.2.1-alpha.1)

## [0.1.34] - 2026-10-02

### 修复

- 修复升级安装后旧市场插件残留在运行时目录、优先于新版加载并因兼容性检查被跳过的问题；启动时将旧副本移入可恢复的备份目录。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.0-rc.2`
- Commit：`639ed015397290b3745d163aafe02ffee4aa3f84`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)

#### ✨ 新增功能

- macOS／Windows 桌面端可在菜单栏中管理和安装 dsh 命令，支持管理插件，无需另装 Node 或 pnpm。 @tianyicui

#### 🐛 问题修复

- 修复新建终端菜单重复列出同名 shell 的问题。 @LegGasai
- 修复切换会话或返回对话后计划审阅无法打开、「查看全文」消失的问题。 @LegGasai
- 修复设置页关闭「显示代码工作视图」后无法调整 Agent 预设的限制。 @lsdsjy
- 修复持久 PowerShell 在完成状态后带有空格时无法正确识别命令结束、丢失退出码或泄露内部标记的问题。 @turtle2099
- 修复 macOS Intel 版桌面端内置 Node 的签名权限，避免 Office 技能命令启动时崩溃。 @07akioni
- 修复 macOS 和 Linux 从图形入口启动桌面端时缺少登录 shell 环境的问题，使工具路径、代理等用户环境配置可供会话使用。 @lsdsjy

#### 🎨 体验优化

- 模型选择器在模型较多时提供搜索，支持模糊匹配和键盘选择。 @MrCroxx
- 侧栏文件页可直接用本地应用打开当前文件夹，并记住应用选择。 @yudshj
- 优化聊天耗时、过程信息、字号和深色主题样式，优化动画运行开销。 @yixiangihsiang, @imccyu
- 精简插件安装引导，并区分已安装、不兼容和内置插件的升级提示。 @Yifffan, @turtle2099
- 自动化任务投递的提醒改为明确标注的用户定时消息，不再要求 Agent 仅将其作为不可信提醒内容转述。 @Chinesezjc
- 加强 Bash 与 PowerShell 的工具提示，提醒 Agent 在删除或移动前核对实际目标路径，以避免路径误判。 @turtle2099

#### ⚠️ 其他变更

- Windows 沙箱权限脚本改为经授权后一次完成诊断与修复，保留修改前备份和恢复命令。 @Elevator14B
- 更新第三方模型目录与兼容适配至 pi-ai 0.87.1；部分旧模型 ID 被移除，已保存的选择可能需要重新选择。 @tianyicui
- 实验性添加异步问答模式，需要手动配置开启：等待超时后 Agent 可继续独立工作，用户仍可稍后回答。 @Magolor

#### New Features

- Bundle the dsh command with macOS and Windows Desktop for plugin management, without requiring a separate Node or pnpm installation. The command needs to be installed with the "Manage dsh command" menu bar item. by @tianyicui

#### Bug Fixes

- Remove duplicate shell names from the new-terminal menu. by @LegGasai
- Fix plan reviews failing to open and losing their full-text action after switching sessions or returning to the conversation. by @LegGasai
- Fix Agent preset changes being unavailable in Settings when “Show coding view” is disabled. by @lsdsjy
- Fix persistent PowerShell failing to recognize command completion, losing exit codes, or exposing internal markers when completion status lines contain trailing spaces. by @turtle2099
- Fix signing permissions for the bundled Node runtime in Intel Mac builds to prevent Office skill commands from crashing at startup. by @07akioni
- Load the login-shell environment for graphical Desktop launches on macOS and Linux, making configured tool paths, proxies, and other user environment settings available to sessions. by @lsdsjy

#### Improvements

- Add search for longer model lists, with fuzzy matching and keyboard selection. by @MrCroxx
- Open the current folder in a local app directly from the Files sidebar, with the selected app remembered. by @yudshj
- Refine elapsed-time displays, process details, typography, and dark-theme styling, and reduce animation overhead. by @yixiangihsiang, @imccyu
- Simplify plugin installation guidance and distinguish upgrade advice for installed, incompatible, and bundled plugins. by @Yifffan, @turtle2099
- Frame delivered automation reminders as scheduled user messages, removing the instruction to treat them only as untrusted reminder content to relay. by @Chinesezjc
- Strengthen Bash and PowerShell tool guidance to remind the Agent to verify resolved target paths before deleting or moving files, helping prevent path mistakes. by @turtle2099

#### Chores

- Combine Windows sandbox permission diagnosis and repair in one authorized run, retaining pre-change backups and recovery commands. by @Elevator14B
- Update the third-party model catalog and compatibility integration to pi-ai 0.87.1. Some older model IDs have been removed, so saved selections may need to be reselected. by @tianyicui
- Add an experimental asynchronous question mode that requires manual configuration to enable: the Agent can continue independent work after the wait expires, while users can still answer later. by @Magolor

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2

## [0.1.33] - 2026-10-01

### 修复

- 插件商城存在客户端文件但缺少客户端声明，或 bundle patch 为空时，不再误判为已安装；启动前恢复完整的内置商城包。
- 旧 Profile 中仍声明安装商城但缺少 bundle 登记时完成迁移；暂停的旧版商城恢复时先执行兼容升级。
- 桌面自带旧版商城的 manifest 或 patch 损坏时，按独立 ownership 记录恢复并升级，不再因无法读取旧版本而只暂停商城。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.0-rc.2`
- Commit：`639ed015397290b3745d163aafe02ffee4aa3f84`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)

#### ✨ 新增功能

- macOS／Windows 桌面端可在菜单栏中管理和安装 dsh 命令，支持管理插件，无需另装 Node 或 pnpm。 @tianyicui

#### 🐛 问题修复

- 修复新建终端菜单重复列出同名 shell 的问题。 @LegGasai
- 修复切换会话或返回对话后计划审阅无法打开、「查看全文」消失的问题。 @LegGasai
- 修复设置页关闭「显示代码工作视图」后无法调整 Agent 预设的限制。 @lsdsjy
- 修复持久 PowerShell 在完成状态后带有空格时无法正确识别命令结束、丢失退出码或泄露内部标记的问题。 @turtle2099
- 修复 macOS Intel 版桌面端内置 Node 的签名权限，避免 Office 技能命令启动时崩溃。 @07akioni
- 修复 macOS 和 Linux 从图形入口启动桌面端时缺少登录 shell 环境的问题，使工具路径、代理等用户环境配置可供会话使用。 @lsdsjy

#### 🎨 体验优化

- 模型选择器在模型较多时提供搜索，支持模糊匹配和键盘选择。 @MrCroxx
- 侧栏文件页可直接用本地应用打开当前文件夹，并记住应用选择。 @yudshj
- 优化聊天耗时、过程信息、字号和深色主题样式，优化动画运行开销。 @yixiangihsiang, @imccyu
- 精简插件安装引导，并区分已安装、不兼容和内置插件的升级提示。 @Yifffan, @turtle2099
- 自动化任务投递的提醒改为明确标注的用户定时消息，不再要求 Agent 仅将其作为不可信提醒内容转述。 @Chinesezjc
- 加强 Bash 与 PowerShell 的工具提示，提醒 Agent 在删除或移动前核对实际目标路径，以避免路径误判。 @turtle2099

#### ⚠️ 其他变更

- Windows 沙箱权限脚本改为经授权后一次完成诊断与修复，保留修改前备份和恢复命令。 @Elevator14B
- 更新第三方模型目录与兼容适配至 pi-ai 0.87.1；部分旧模型 ID 被移除，已保存的选择可能需要重新选择。 @tianyicui
- 实验性添加异步问答模式，需要手动配置开启：等待超时后 Agent 可继续独立工作，用户仍可稍后回答。 @Magolor

#### New Features

- Bundle the dsh command with macOS and Windows Desktop for plugin management, without requiring a separate Node or pnpm installation. The command needs to be installed with the "Manage dsh command" menu bar item. by @tianyicui

#### Bug Fixes

- Remove duplicate shell names from the new-terminal menu. by @LegGasai
- Fix plan reviews failing to open and losing their full-text action after switching sessions or returning to the conversation. by @LegGasai
- Fix Agent preset changes being unavailable in Settings when “Show coding view” is disabled. by @lsdsjy
- Fix persistent PowerShell failing to recognize command completion, losing exit codes, or exposing internal markers when completion status lines contain trailing spaces. by @turtle2099
- Fix signing permissions for the bundled Node runtime in Intel Mac builds to prevent Office skill commands from crashing at startup. by @07akioni
- Load the login-shell environment for graphical Desktop launches on macOS and Linux, making configured tool paths, proxies, and other user environment settings available to sessions. by @lsdsjy

#### Improvements

- Add search for longer model lists, with fuzzy matching and keyboard selection. by @MrCroxx
- Open the current folder in a local app directly from the Files sidebar, with the selected app remembered. by @yudshj
- Refine elapsed-time displays, process details, typography, and dark-theme styling, and reduce animation overhead. by @yixiangihsiang, @imccyu
- Simplify plugin installation guidance and distinguish upgrade advice for installed, incompatible, and bundled plugins. by @Yifffan, @turtle2099
- Frame delivered automation reminders as scheduled user messages, removing the instruction to treat them only as untrusted reminder content to relay. by @Chinesezjc
- Strengthen Bash and PowerShell tool guidance to remind the Agent to verify resolved target paths before deleting or moving files, helping prevent path mistakes. by @turtle2099

#### Chores

- Combine Windows sandbox permission diagnosis and repair in one authorized run, retaining pre-change backups and recovery commands. by @Elevator14B
- Update the third-party model catalog and compatibility integration to pi-ai 0.87.1. Some older model IDs have been removed, so saved selections may need to be reselected. by @tianyicui
- Add an experimental asynchronous question mode that requires manual configuration to enable: the Agent can continue independent work after the wait expires, while users can still answer later. by @Magolor

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2

## [0.1.32] - 2026-10-01

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.0-rc.2`
- Commit：`639ed015397290b3745d163aafe02ffee4aa3f84`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)

#### ✨ 新增功能

- macOS／Windows 桌面端可在菜单栏中管理和安装 dsh 命令，支持管理插件，无需另装 Node 或 pnpm。 @tianyicui

#### 🐛 问题修复

- 修复新建终端菜单重复列出同名 shell 的问题。 @LegGasai
- 修复切换会话或返回对话后计划审阅无法打开、「查看全文」消失的问题。 @LegGasai
- 修复设置页关闭「显示代码工作视图」后无法调整 Agent 预设的限制。 @lsdsjy
- 修复持久 PowerShell 在完成状态后带有空格时无法正确识别命令结束、丢失退出码或泄露内部标记的问题。 @turtle2099
- 修复 macOS Intel 版桌面端内置 Node 的签名权限，避免 Office 技能命令启动时崩溃。 @07akioni
- 修复 macOS 和 Linux 从图形入口启动桌面端时缺少登录 shell 环境的问题，使工具路径、代理等用户环境配置可供会话使用。 @lsdsjy

#### 🎨 体验优化

- 模型选择器在模型较多时提供搜索，支持模糊匹配和键盘选择。 @MrCroxx
- 侧栏文件页可直接用本地应用打开当前文件夹，并记住应用选择。 @yudshj
- 优化聊天耗时、过程信息、字号和深色主题样式，优化动画运行开销。 @yixiangihsiang, @imccyu
- 精简插件安装引导，并区分已安装、不兼容和内置插件的升级提示。 @Yifffan, @turtle2099
- 自动化任务投递的提醒改为明确标注的用户定时消息，不再要求 Agent 仅将其作为不可信提醒内容转述。 @Chinesezjc
- 加强 Bash 与 PowerShell 的工具提示，提醒 Agent 在删除或移动前核对实际目标路径，以避免路径误判。 @turtle2099

#### ⚠️ 其他变更

- Windows 沙箱权限脚本改为经授权后一次完成诊断与修复，保留修改前备份和恢复命令。 @Elevator14B
- 更新第三方模型目录与兼容适配至 pi-ai 0.87.1；部分旧模型 ID 被移除，已保存的选择可能需要重新选择。 @tianyicui
- 实验性添加异步问答模式，需要手动配置开启：等待超时后 Agent 可继续独立工作，用户仍可稍后回答。 @Magolor

#### New Features

- Bundle the dsh command with macOS and Windows Desktop for plugin management, without requiring a separate Node or pnpm installation. The command needs to be installed with the "Manage dsh command" menu bar item. by @tianyicui

#### Bug Fixes

- Remove duplicate shell names from the new-terminal menu. by @LegGasai
- Fix plan reviews failing to open and losing their full-text action after switching sessions or returning to the conversation. by @LegGasai
- Fix Agent preset changes being unavailable in Settings when “Show coding view” is disabled. by @lsdsjy
- Fix persistent PowerShell failing to recognize command completion, losing exit codes, or exposing internal markers when completion status lines contain trailing spaces. by @turtle2099
- Fix signing permissions for the bundled Node runtime in Intel Mac builds to prevent Office skill commands from crashing at startup. by @07akioni
- Load the login-shell environment for graphical Desktop launches on macOS and Linux, making configured tool paths, proxies, and other user environment settings available to sessions. by @lsdsjy

#### Improvements

- Add search for longer model lists, with fuzzy matching and keyboard selection. by @MrCroxx
- Open the current folder in a local app directly from the Files sidebar, with the selected app remembered. by @yudshj
- Refine elapsed-time displays, process details, typography, and dark-theme styling, and reduce animation overhead. by @yixiangihsiang, @imccyu
- Simplify plugin installation guidance and distinguish upgrade advice for installed, incompatible, and bundled plugins. by @Yifffan, @turtle2099
- Frame delivered automation reminders as scheduled user messages, removing the instruction to treat them only as untrusted reminder content to relay. by @Chinesezjc
- Strengthen Bash and PowerShell tool guidance to remind the Agent to verify resolved target paths before deleting or moving files, helping prevent path mistakes. by @turtle2099

#### Chores

- Combine Windows sandbox permission diagnosis and repair in one authorized run, retaining pre-change backups and recovery commands. by @Elevator14B
- Update the third-party model catalog and compatibility integration to pi-ai 0.87.1. Some older model IDs have been removed, so saved selections may need to be reselected. by @tianyicui
- Add an experimental asynchronous question mode that requires manual configuration to enable: the Agent can continue independent work after the wait expires, while users can still answer later. by @Magolor

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2

## [0.1.31] - 2026-10-01

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.2.0-rc.2`
- Commit：`639ed015397290b3745d163aafe02ffee4aa3f84`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)

#### ✨ 新增功能

- macOS／Windows 桌面端可在菜单栏中管理和安装 dsh 命令，支持管理插件，无需另装 Node 或 pnpm。 @tianyicui

#### 🐛 问题修复

- 修复新建终端菜单重复列出同名 shell 的问题。 @LegGasai
- 修复切换会话或返回对话后计划审阅无法打开、「查看全文」消失的问题。 @LegGasai
- 修复设置页关闭「显示代码工作视图」后无法调整 Agent 预设的限制。 @lsdsjy
- 修复持久 PowerShell 在完成状态后带有空格时无法正确识别命令结束、丢失退出码或泄露内部标记的问题。 @turtle2099
- 修复 macOS Intel 版桌面端内置 Node 的签名权限，避免 Office 技能命令启动时崩溃。 @07akioni
- 修复 macOS 和 Linux 从图形入口启动桌面端时缺少登录 shell 环境的问题，使工具路径、代理等用户环境配置可供会话使用。 @lsdsjy

#### 🎨 体验优化

- 模型选择器在模型较多时提供搜索，支持模糊匹配和键盘选择。 @MrCroxx
- 侧栏文件页可直接用本地应用打开当前文件夹，并记住应用选择。 @yudshj
- 优化聊天耗时、过程信息、字号和深色主题样式，优化动画运行开销。 @yixiangihsiang, @imccyu
- 精简插件安装引导，并区分已安装、不兼容和内置插件的升级提示。 @Yifffan, @turtle2099
- 自动化任务投递的提醒改为明确标注的用户定时消息，不再要求 Agent 仅将其作为不可信提醒内容转述。 @Chinesezjc
- 加强 Bash 与 PowerShell 的工具提示，提醒 Agent 在删除或移动前核对实际目标路径，以避免路径误判。 @turtle2099

#### ⚠️ 其他变更

- Windows 沙箱权限脚本改为经授权后一次完成诊断与修复，保留修改前备份和恢复命令。 @Elevator14B
- 更新第三方模型目录与兼容适配至 pi-ai 0.87.1；部分旧模型 ID 被移除，已保存的选择可能需要重新选择。 @tianyicui
- 实验性添加异步问答模式，需要手动配置开启：等待超时后 Agent 可继续独立工作，用户仍可稍后回答。 @Magolor

#### New Features

- Bundle the dsh command with macOS and Windows Desktop for plugin management, without requiring a separate Node or pnpm installation. The command needs to be installed with the "Manage dsh command" menu bar item. by @tianyicui

#### Bug Fixes

- Remove duplicate shell names from the new-terminal menu. by @LegGasai
- Fix plan reviews failing to open and losing their full-text action after switching sessions or returning to the conversation. by @LegGasai
- Fix Agent preset changes being unavailable in Settings when “Show coding view” is disabled. by @lsdsjy
- Fix persistent PowerShell failing to recognize command completion, losing exit codes, or exposing internal markers when completion status lines contain trailing spaces. by @turtle2099
- Fix signing permissions for the bundled Node runtime in Intel Mac builds to prevent Office skill commands from crashing at startup. by @07akioni
- Load the login-shell environment for graphical Desktop launches on macOS and Linux, making configured tool paths, proxies, and other user environment settings available to sessions. by @lsdsjy

#### Improvements

- Add search for longer model lists, with fuzzy matching and keyboard selection. by @MrCroxx
- Open the current folder in a local app directly from the Files sidebar, with the selected app remembered. by @yudshj
- Refine elapsed-time displays, process details, typography, and dark-theme styling, and reduce animation overhead. by @yixiangihsiang, @imccyu
- Simplify plugin installation guidance and distinguish upgrade advice for installed, incompatible, and bundled plugins. by @Yifffan, @turtle2099
- Frame delivered automation reminders as scheduled user messages, removing the instruction to treat them only as untrusted reminder content to relay. by @Chinesezjc
- Strengthen Bash and PowerShell tool guidance to remind the Agent to verify resolved target paths before deleting or moving files, helping prevent path mistakes. by @turtle2099

#### Chores

- Combine Windows sandbox permission diagnosis and repair in one authorized run, retaining pre-change backups and recovery commands. by @Elevator14B
- Update the third-party model catalog and compatibility integration to pi-ai 0.87.1. Some older model IDs have been removed, so saved selections may need to be reselected. by @tianyicui
- Add an experimental asynchronous question mode that requires manual configuration to enable: the Agent can continue independent work after the wait expires, while users can still answer later. by @Magolor

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2

## [0.1.30] - 2026-10-01

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-rc.2` → `dsh-v0.2.0-rc.2`
- Commit：`639ed015397290b3745d163aafe02ffee4aa3f84`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)

#### ✨ 新增功能

- macOS／Windows 桌面端可在菜单栏中管理和安装 dsh 命令，支持管理插件，无需另装 Node 或 pnpm。 @tianyicui

#### 🐛 问题修复

- 修复新建终端菜单重复列出同名 shell 的问题。 @LegGasai
- 修复切换会话或返回对话后计划审阅无法打开、「查看全文」消失的问题。 @LegGasai
- 修复设置页关闭「显示代码工作视图」后无法调整 Agent 预设的限制。 @lsdsjy
- 修复持久 PowerShell 在完成状态后带有空格时无法正确识别命令结束、丢失退出码或泄露内部标记的问题。 @turtle2099
- 修复 macOS Intel 版桌面端内置 Node 的签名权限，避免 Office 技能命令启动时崩溃。 @07akioni
- 修复 macOS 和 Linux 从图形入口启动桌面端时缺少登录 shell 环境的问题，使工具路径、代理等用户环境配置可供会话使用。 @lsdsjy

#### 🎨 体验优化

- 模型选择器在模型较多时提供搜索，支持模糊匹配和键盘选择。 @MrCroxx
- 侧栏文件页可直接用本地应用打开当前文件夹，并记住应用选择。 @yudshj
- 优化聊天耗时、过程信息、字号和深色主题样式，优化动画运行开销。 @yixiangihsiang, @imccyu
- 精简插件安装引导，并区分已安装、不兼容和内置插件的升级提示。 @Yifffan, @turtle2099
- 自动化任务投递的提醒改为明确标注的用户定时消息，不再要求 Agent 仅将其作为不可信提醒内容转述。 @Chinesezjc
- 加强 Bash 与 PowerShell 的工具提示，提醒 Agent 在删除或移动前核对实际目标路径，以避免路径误判。 @turtle2099

#### ⚠️ 其他变更

- Windows 沙箱权限脚本改为经授权后一次完成诊断与修复，保留修改前备份和恢复命令。 @Elevator14B
- 更新第三方模型目录与兼容适配至 pi-ai 0.87.1；部分旧模型 ID 被移除，已保存的选择可能需要重新选择。 @tianyicui
- 实验性添加异步问答模式，需要手动配置开启：等待超时后 Agent 可继续独立工作，用户仍可稍后回答。 @Magolor

#### New Features

- Bundle the dsh command with macOS and Windows Desktop for plugin management, without requiring a separate Node or pnpm installation. The command needs to be installed with the "Manage dsh command" menu bar item. by @tianyicui

#### Bug Fixes

- Remove duplicate shell names from the new-terminal menu. by @LegGasai
- Fix plan reviews failing to open and losing their full-text action after switching sessions or returning to the conversation. by @LegGasai
- Fix Agent preset changes being unavailable in Settings when “Show coding view” is disabled. by @lsdsjy
- Fix persistent PowerShell failing to recognize command completion, losing exit codes, or exposing internal markers when completion status lines contain trailing spaces. by @turtle2099
- Fix signing permissions for the bundled Node runtime in Intel Mac builds to prevent Office skill commands from crashing at startup. by @07akioni
- Load the login-shell environment for graphical Desktop launches on macOS and Linux, making configured tool paths, proxies, and other user environment settings available to sessions. by @lsdsjy

#### Improvements

- Add search for longer model lists, with fuzzy matching and keyboard selection. by @MrCroxx
- Open the current folder in a local app directly from the Files sidebar, with the selected app remembered. by @yudshj
- Refine elapsed-time displays, process details, typography, and dark-theme styling, and reduce animation overhead. by @yixiangihsiang, @imccyu
- Simplify plugin installation guidance and distinguish upgrade advice for installed, incompatible, and bundled plugins. by @Yifffan, @turtle2099
- Frame delivered automation reminders as scheduled user messages, removing the instruction to treat them only as untrusted reminder content to relay. by @Chinesezjc
- Strengthen Bash and PowerShell tool guidance to remind the Agent to verify resolved target paths before deleting or moving files, helping prevent path mistakes. by @turtle2099

#### Chores

- Combine Windows sandbox permission diagnosis and repair in one authorized run, retaining pre-change backups and recovery commands. by @Elevator14B
- Update the third-party model catalog and compatibility integration to pi-ai 0.87.1. Some older model IDs have been removed, so saved selections may need to be reselected. by @tianyicui
- Add an experimental asynchronous question mode that requires manual configuration to enable: the Agent can continue independent work after the wait expires, while users can still answer later. by @Magolor

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2

## [0.1.29] - 2026-10-01

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-rc.2`
- Commit：`fb2c4b9e698e30edb738bca4cf0618587db7d203`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2)

#### 体验优化

- 优化反馈提交体验：点赞和点踩均通过弹窗确认后提交，提交失败时保留已填写内容并给出提示。@yixiangihsiang
- 优化交付文件卡片的排版和对话间距，更新代码文件图标，让文件更易辨认、界面更紧凑。@yixiangihsiang

## [0.1.28] - 2026-09-23

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-rc.2`
- Commit：`fb2c4b9e698e30edb738bca4cf0618587db7d203`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2)

#### 体验优化

- 优化反馈提交体验：点赞和点踩均通过弹窗确认后提交，提交失败时保留已填写内容并给出提示。@yixiangihsiang
- 优化交付文件卡片的排版和对话间距，更新代码文件图标，让文件更易辨认、界面更紧凑。@yixiangihsiang

## [0.1.27] - 2026-09-12

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-rc.1` → `dsh-v0.1.5-rc.2`
- Commit：`fb2c4b9e698e30edb738bca4cf0618587db7d203`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2)

#### 体验优化

- 优化反馈提交体验：点赞和点踩均通过弹窗确认后提交，提交失败时保留已填写内容并给出提示。@yixiangihsiang
- 优化交付文件卡片的排版和对话间距，更新代码文件图标，让文件更易辨认、界面更紧凑。@yixiangihsiang

## [0.1.26] - 2026-09-11

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-alpha.2` → `dsh-v0.1.5-rc.1`
- Commit：`183f08e9c6dde7e36cd2318eaee70b0da08fb35e`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.1)

作为 `0.1.5` 系列的首个候选版本，本版本汇总了自 `v0.1.2-rc.1` 以来的主要用户和开发者相关变更。

#### 新增功能

- DeepSeek 模型适配器新增 `DeepSeek-V41-Flash`（`deepseek-flash`）支持文本、图片及会话历史中的系统提示词更新。新会话默认使用该模型，配置文件显式指定模型时以配置值为准。 @LegGasai
- Web 支持上传任意类型的通用文件：文件与图片可在同一预览区混排，后台上传支持进度、取消与会话切换续显，模型可通过已保存路径使用现有文件工具按需读取。 @CreatixChu
- 可继续对话的子代理支持消息排队、编辑、删除、单条或全部 Steer 与停止操作；排队消息发送期间显示“发送中”，并暂不可编辑、删除或 Steer。 @Dudu-0223, @LegGasai
- 支持动态修改系统提示词且不破坏 KV Cache，模型需显式声明支持。 @tianyicui
- Web 右侧 Sidebar 支持多标签、分栏、全屏以及 Markdown、代码、HTML、PDF 和图片预览，包括子代理和未激活会话的文件；模型可显式交付文件，并可在 Sidebar 中预览、用默认应用打开或在文件管理器中定位。原 Detail 面板已移除。 @imccyu, @Yifffan, @yixiangihsiang, @CreatixChu, @yudshj
- 模型探测新增对自定义模型提供商 `models` 对象和 Anthropic 原生模型列表的支持，并支持回填模型名称、上下文窗口及最大输出 token 的回填。 @LegGasai
- 所有出站网络请求都会遵循启动环境中的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 与 `NO_PROXY` 配置。 @LegGasai
- Web 顶栏新增“在应用中打开”，可用已安装的编辑器、IDE、终端或文件管理器等打开 Workspace。 @yixiangihsiang
- 反馈可独立提交，无需继续对话；`/feedback` 命令支持提交明细反馈内容，提交时附带相关会话内容。 @tianyicui, @Chinesezjc, @CreatixChu

#### 体验优化

- Web 可直接显示顶层及 PTC 嵌套 `read_image` 的图片结果，以及模型回复中引用的 POSIX 绝对路径本地图片，包括工作区外截图；加载失败时显示替代文字或原路径。 @Chinesezjc, @kermanx
- Skill 选择器支持模糊搜索；优化聊天气泡中的的 Skill 和命令引用。 @LegGasai
- 调整会话内可点击链接的颜色、hover/focus 样式和分类图标，优化 Markdown 链接、文件引用、网页来源、产物链接与 Workflow 成员链接的辨识度。 @yixiangihsiang
- Windows 上的本地非终端子进程不再弹出控制台窗口。 @turtle1999
- Agent Team 的 `send_message` 统一采用 steer 语义，并在跨 Agent 和冷恢复投递中保留发送者归属与顺序。 @Dudu-0223
- 改善长会话打开、恢复和持续对话时的卡顿，降低内存占用。 @imccyu, @tianyicui, @Dudu-0223
- 引用较长会话时，模型可按需读取预览中未展示的内容。 @tianyicui
- 改善设置面板的标签、开关状态样式，改善浅色和深色主题下的显示效果，改善本地化与可访问性 @LegGasai, @turtle2099
- PTC 模式下支持展开查看命令及其输出。 @tianyicui
- 改善 Web 输入框的菜单层级、提示文字和间距；会话统计改为两个可展开的摘要，分别查看轮次与速度、精确 Token 用量与缓存命中。 @Yifffan
- 内置斜杠命令说明支持中文，并随界面语言即时更新；切换语言时保留已打开菜单和查询内容。 @Kaige-Gao

#### 问题修复

- 用户在 Web 中暂停目标会立即终止当前模型轮次，且模型不能自行恢复；恢复必须由用户触发，尚未激活的目标也显示恢复入口。 @mektpoy
- 修复 DeepSeek 流式工具调用的续传分片用空值覆盖调用 ID 或名称的问题，避免工具以空名称失败并写入无法重新打开的会话记录。 @LegGasai
- 修复 Python SDK 单文件 runtime 将 Bash 中以 `node` 开头的命令错误重写为 dsh runtime 的问题。 @imccyu
- 修复从会话搜索结果进入会话后仍停留在搜索界面的问题；目标会话会在所属 Workspace 中展开并滚动到可见位置。 @Dudu-0223
- 修复 Windows 盘符根目录 Workspace 的路径分隔符、标题与绝对路径校验，确保盘符根目录可以正常使用。 @turtle1999
- 修复 Web 断线后无法自动恢复的问题。 @LegGasai
- 修复发送消息或调整窗口后，聊天不再自动滚动到底部的问题。 @tianyicui
- 修复 Windows 上 Python SDK 运行时可能出现的启动崩溃。 @tianyicui
- 修复会话运行中发送按钮与 Enter 的行为不一致：两者均遵循“繁忙时的发送行为”设置，并明确提示排队或插话发送。 @lsdsjy
- 拒绝不含正文或附件的空消息及空白队列编辑，保留仅发送图片或文件的能力。 @turtle1999
- 修复查找项目根目录遇到权限或 I/O 错误时误用上级项目指令的问题，相关错误会直接报告。 @turtle1999
- 修复折叠的思考摘要直接显示 Markdown 加粗标记的问题，展开内容保持完整。 @turtle1999
- 修复模型目录变化后失效的 pi-ai 配置导致整个模型设置入口消失的问题；错误项保留诊断和修复入口 @LegGasai
- 在发现模型或创建自定义 provider 前校验并规范化 Base URL，并直接提示无效地址。 @turtle2099
- 修复 Windows Web 界面的原生文件夹选择器可能在其他窗口后方打开的问题。 @Elevator14B
- 修复在 Composer 中输入空白字符后占位提示仍然显示的问题。 @CreatixChu
- 修复工具筛选后的子代理仍收到不可用文件和 Web 工具指导的问题。 @koalazf99
- 拒绝 MCP 工具发现中的重复分页游标，避免启动或同步持续等待，并保留上一组可用工具。 @grllll

#### 其他变更

- **会话数据格式升级至 V3：** 受支持的旧日志通过版本迁移生成新版日志并保留原文件，升级后的会话不支持降级读取。自定义日志读取器需适配 V3，跨版本迁移细节见 [session-format-v2-to-v3/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.5-rc.1/packages/session/session-format-v2-to-v3/README.zh.md)。 @tianyicui, @Magolor, @imccyu
- **Session 生命周期变更：** Session persistence API 改为由生命周期持有的 `SessionHandle`；`agentLoop.create()` 改为异步，新增session锁，同一session至多被一个进程持有。 @turtle1999, @imccyu
- **默认工具调整：** SDK、Headless 和 ACP 默认使用 read、write、edit 编辑文件；Web `minimal` 与 Python `sdk-minimal` 默认仅提供持久 shell，`str_replace_editor` 需显式启用，持久 Bash 输出统一报告退出或超时状态。 @koalazf99
- 改善 Windows 和部分 Linux 环境下普通子进程的清理，减少任务停止后的后台进程残留；普通 subprocess handle 不再暴露 pid，终端 handle 不受影响。 @pku-xht
- 统一未观察文件写入与编辑失败的 `FS_NOT_OBSERVED` 诊断，保留文件路径、结构化错误码和原始原因。 @turtle1999
- Python SDK 新增 macOS x64 runtime wheel，可在 Intel 架构的 Mac 上安装并运行随包 runtime。 @koalazf99
- 升级 pi-ai 版本至 0.85.1 @tianyicui
- 可选子代理插件的内置运行时升级至 Codex 0.153.4 和 Claude Code 2.1.263；显式模型配置保持不变，未配置模型时 Codex 使用上游默认值。 @koalazf99
- 自定义 persona 配置拆分为前缀和后缀，旧配置及相关常量需要适配。 @tianyicui
- **插件 Agent API 调整：** 移除 `ctx.agent`，调用方需显式传递 Agent；同时修正可继续对话的子代理归属，避免它们被当作根会话参与定时调度。 @kermanx
- **Inbox API 调整：** `Inbox` 改为类型接口，不再导出可构造的运行时类；插件通过 `agent.inbox` 读写待处理消息，`hasPending` 与 `claim` 不再属于公共接口。 @kermanx
- **Web 插件面板 API 调整：** 插件可通过 `sidebar.panellist` 与 `main` 注册全局面板；原 `conversation` Slot 迁移为 `main` 的 `conversation` key @imccyu
- 实验性 Agent Teams 包现可从 npm 安装；用户需显式添加 profile，不默认启用 @imccyu

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.2-rc.1...dsh-v0.1.5-rc.1

## [0.1.25] - 2026-09-10

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.5-alpha.1` → `dsh-v0.1.5-alpha.2`
- Commit：`b2e3b2a0125854567a4a5fcba75782e42fe84901`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-alpha.2)

#### 新增功能

- 右侧 Sidebar 新增常见文档类型预览，支持 Markdown、代码高亮、HTML、PDF 、图片 @imccyu, @Yifffan, @yixiangihsiang, @CreatixChu, @yudshj
- 支持模型显式在会话中交付文件，并支持在右侧 Sidebar 预览、用默认应用打开、在文件管理器中定位 @yudshj, @CreatixChu
- `/feedback` 命令新增支持提交明细反馈内容 @CreatixChu

#### 问题修复

- 修复模型目录变化后失效的 pi-ai 配置导致整个模型设置入口消失的问题；错误项保留诊断和修复入口 @LegGasai
- 在发现模型或创建自定义 provider 前校验并规范化 Base URL，并直接提示无效地址。 @turtle2099
- 修复 Windows Web 界面的原生文件夹选择器可能在其他窗口后方打开的问题。 @Elevator14B
- 修复在 Composer 中输入空白字符后占位提示仍然显示的问题。 @CreatixChu
- 修复工具筛选后的子代理仍收到不可用文件和 Web 工具指导的问题。 @koalazf99
- 拒绝 MCP 工具发现中的重复分页游标，避免启动或同步持续等待，并保留上一组可用工具。 @grllll
- 修复 npm 安装需要依赖 `fs-ext` 本地编译的问题 @imccyu

#### 体验优化

- 改善设置界面的本地化与可访问性：设置入口补充本地化无障碍名称，中文显示对话模式与内置模型说明 @turtle2099

#### 其他变更

- Session 数据格式当前为 V3 版本，跨版本迁移细节见 [session-format-v2-to-v3/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.5-alpha.2/packages/session/session-format-v2-to-v3/README.zh.md) @tianyicui
- **Web 插件面板 API 调整：** 插件可通过 `sidebar.panellist` 与 `main` 注册全局面板；原 `conversation` Slot 迁移为 `main` 的 `conversation` key @imccyu
- **极简模式默认工具调整：** Web `minimal` 与 Python `sdk-minimal` 默认仅提供持久 shell，`str_replace_editor` 改为显式启用；持久 Bash 输出统一报告退出或超时状态 @koalazf99
- 实验性 Agent Teams 包现可从 npm 安装；用户需显式添加 profile，不默认启用 @imccyu

#### New Features

- Add previews for common document types in the right Sidebar, including Markdown, syntax-highlighted code, HTML, PDF, and images. by @imccyu, @Yifffan, @yixiangihsiang, @CreatixChu, @yudshj
- Let models explicitly deliver files in conversations, with right-Sidebar preview, default-app opening, and file-manager reveal. by @yudshj, @CreatixChu
- The `/feedback` command now supports detailed feedback submissions. by @CreatixChu

#### Bug Fixes

- Keep pi-ai model settings available when catalog changes invalidate an existing configuration, preserving diagnostics and repair controls. by @LegGasai
- Validate and normalize custom-provider Base URLs before model discovery or provider creation, with inline feedback for invalid addresses. by @turtle2099
- Fix the Windows native folder picker opening behind other windows in the Web app. by @Elevator14B
- Fix the Composer placeholder remaining visible after whitespace is entered. by @CreatixChu
- Keep filesystem and Web guidance aligned with each agent's visible tools, so filtered subagents are not instructed to use unavailable tools. by @koalazf99
- Reject repeated MCP tool-list pagination cursors instead of hanging startup or synchronization, while keeping the last valid tool set available. by @grllll
- Fix npm installations that previously required a local `fs-ext` build. by @imccyu

#### Improvements

- Improve Settings localization and accessibility by adding accessible names and localizing conversation display options and built-in model descriptions in Chinese. by @turtle2099

#### Chores

- The current Session data format is V3. See [session-format-v2-to-v3/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.5-alpha.2/packages/session/session-format-v2-to-v3/README.md) for cross-version migration details. by @tianyicui
- **Web plugin panel API changes:** Plugins can register global panels through `sidebar.panellist` and `main`; the former `conversation` slot moves to the `conversation` key under `main`. by @imccyu
- **Minimal-profile default tools:** Web `minimal` and Python `sdk-minimal` are shell-only by default, with `str_replace_editor` available by explicit opt-in; persistent Bash reports completion and timeout status consistently. by @koalazf99
- Publish installable experimental Agent Teams packages; users must explicitly add the profile, which is not enabled by default. by @imccyu

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.5-alpha.1...dsh-v0.1.5-alpha.2

## [0.1.24] - 2026-09-09

### 桌面端

- 无桌面壳代码变更；此版本用于同步上游 DeepSeek Harness。

### 内置 DeepSeek Harness

- 版本：`dsh-v0.1.3-alpha.2` → `dsh-v0.1.5-alpha.1`
- Commit：`5dda764ed3aa172535a7967b06ff95d9cbfe536a`
- [上游 Release Notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-alpha.1)

#### 新增功能

- 支持动态修改系统提示词且不破坏 KV Cache，模型需显式声明支持 @tianyicui
- 新增实验性右侧 Sidebar，支持多标签、分栏与全屏；聊天文件链接和产出文件支持 Sidebar 打开，并移除原 Detail 面板 @imccyu

#### 体验优化

- 改善 Web 输入框的菜单层级、提示文字和间距；会话统计改为两个可展开的摘要，分别查看轮次与速度、精确 Token 用量与缓存命中。 @Yifffan
- 内置斜杠命令说明支持中文，并随界面语言即时更新；切换语言时保留已打开菜单和查询内容。 @Kaige-Gao
- 可选子代理插件的内置运行时升级至 Codex 0.153.4 和 Claude Code 2.1.263；显式模型配置保持不变，未配置模型时 Codex 使用上游默认值。 @koalazf99

#### 问题修复

- 修复会话运行中发送按钮与 Enter 的行为不一致：两者均遵循“繁忙时的发送行为”设置，并明确提示排队或插话发送。 @lsdsjy
- 修复模型可自行恢复用户已暂停目标的问题；暂停后须由用户恢复，尚未激活的目标也会显示恢复入口。 @mektpoy
- 修复聊天中本地图片路径无法显示的问题，支持模型回复引用的 POSIX 绝对路径图片，包括工作区外截图；加载失败时显示替代文字或原路径。 @kermanx
- 拒绝不含正文或附件的空消息及空白队列编辑，保留仅发送图片或文件的能力。 @turtle1999
- 修复查找项目根目录遇到权限或 I/O 错误时误用上级项目指令的问题，相关错误会直接报告。 @turtle1999
- 修复折叠的思考摘要直接显示 Markdown 加粗标记的问题，展开内容保持完整。 @turtle1999
- 修复 macOS 和 Linux 依赖 `fs-ext` 需要本地编译的问题 @imccyu

#### 其他变更

- **会话格式升级至 V3：** 恢复受支持的历史会话时生成新版日志并保留原文件，系统提示词纳入消息历史，旧 PTC 事件与 `code` 预设引用自动迁移。自定义日志读取器需适配新格式；升级后的会话不支持降级读取。 @tianyicui
- **插件 Agent API 调整：** 移除 `ctx.agent`，调用方需显式传递 Agent；同时修正可继续对话的子代理归属，避免它们被当作根会话参与定时调度。 @kermanx
- **Inbox API 调整：** `Inbox` 改为类型接口，不再导出可构造的运行时类；插件通过 `agent.inbox` 读写待处理消息，`hasPending` 与 `claim` 不再属于公共接口。 @kermanx

#### New Features

- Support dynamic system prompt updates without invalidating KV Cache when the configured model explicitly declares support. by @tianyicui
- Add an experimental right Sidebar with tabs, split panes, and fullscreen. Chat file links and produced files can open in the Sidebar, and the Detail panel is removed. by @imccyu

#### Improvements

- Improve Web composer menu layering, placeholder text, and spacing. Present session statistics in two compact summaries for turn counts and speed, and detailed token usage and cache hits. by @Yifffan
- Localize built-in slash command descriptions into Chinese and update them when the interface language changes, preserving open menus and queries. by @Kaige-Gao
- Update the optional subagent plugins to Codex 0.153.4 and Claude Code 2.1.263. Explicit model settings remain unchanged; Codex uses its upstream default when no model is configured. by @koalazf99

#### Bug Fixes

- Make the Send button follow the same busy-session setting as Enter, with labels that identify queue or steer delivery. by @lsdsjy
- Prevent the model from resuming a goal paused by the user. Resuming requires a user action, and inactive goals show a resume control. by @mektpoy
- Fix local images referenced by absolute POSIX paths in assistant messages, including screenshots outside registered workspaces. Failed loads show the alt text or original path. by @kermanx
- Reject messages with neither non-whitespace text nor an attachment, and reject blank queue edits. Image-only and file-only messages remain supported. by @turtle1999
- Report permission and I/O errors during project-root discovery instead of loading instructions from an ancestor project. by @turtle1999
- Remove literal Markdown bold markers from collapsed thinking summaries while preserving the full expanded content. by @turtle1999
- Fix the local compilation requirement introduced by `fs-ext` on macOS and Linux. by @imccyu

#### Chores

- **Session format V3:** Upgrade supported historical sessions into new log files while preserving the originals, record system prompts in message history, and migrate legacy PTC events and `code` preset references. Custom log readers must adapt to V3; downgrade reads are not supported. by @tianyicui
- **Agent plugin API changes:** Remove `ctx.agent` and require callers to pass the Agent explicitly. Correct ownership of continuable subagents so root-only scheduling excludes them. by @kermanx
- **Inbox API changes:** Make `Inbox` a type-only interface instead of an exported runtime class. Plugins access pending messages through `agent.inbox`; `hasPending` and `claim` are no longer public API. by @kermanx

Full Changelog: https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.3-alpha.2...dsh-v0.1.5-alpha.1

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

[0.1.23]: https://github.com/314857493/dsh-desktop/compare/v0.1.22...v0.1.23

[0.1.24]: https://github.com/314857493/dsh-desktop/compare/v0.1.23...v0.1.24

[0.1.25]: https://github.com/314857493/dsh-desktop/compare/v0.1.24...v0.1.25

[0.1.26]: https://github.com/314857493/dsh-desktop/compare/v0.1.25...v0.1.26

[0.1.27]: https://github.com/314857493/dsh-desktop/compare/v0.1.26...v0.1.27

[0.1.28]: https://github.com/314857493/dsh-desktop/compare/v0.1.27...v0.1.28

[0.1.29]: https://github.com/314857493/dsh-desktop/compare/v0.1.28...v0.1.29

[0.1.30]: https://github.com/314857493/dsh-desktop/compare/v0.1.29...v0.1.30

[0.1.31]: https://github.com/314857493/dsh-desktop/compare/v0.1.30...v0.1.31

[0.1.32]: https://github.com/314857493/dsh-desktop/compare/v0.1.31...v0.1.32

[0.1.33]: https://github.com/314857493/dsh-desktop/compare/v0.1.32...v0.1.33

[0.1.34]: https://github.com/314857493/dsh-desktop/compare/v0.1.33...v0.1.34

[0.1.35]: https://github.com/314857493/dsh-desktop/compare/v0.1.34...v0.1.35

[0.1.36]: https://github.com/314857493/dsh-desktop/compare/v0.1.35...v0.1.36

[0.1.37]: https://github.com/314857493/dsh-desktop/compare/v0.1.36...v0.1.37

[0.1.38]: https://github.com/314857493/dsh-desktop/compare/v0.1.37...v0.1.38

[0.1.39]: https://github.com/314857493/dsh-desktop/compare/v0.1.38...v0.1.39

[0.1.40]: https://github.com/314857493/dsh-desktop/compare/v0.1.39...v0.1.40

[Unreleased]: https://github.com/314857493/dsh-desktop/compare/v0.1.41...HEAD
[0.1.41]: https://github.com/314857493/dsh-desktop/compare/v0.1.40...v0.1.41
