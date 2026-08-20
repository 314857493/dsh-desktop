# Changelog

DSH Desktop 的重要变更记录在此文件中。版本号属于桌面端；每个版本同时记录其内置的
DeepSeek Harness 上游版本，以便复现构建和排查兼容性问题。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 桌面端

- 新增上游 DeepSeek Harness 版本监控、自动构建和发布流程。
- 自动同步桌面端版本、上游固定状态、GitHub Release Notes 与应用内更新说明。

## [0.1.8] - 2026-08-19

### 修复

- 规范化 GitHub updater 附件名称，修复文件名包含空格时生成的下载地址。

[Unreleased]: https://github.com/314857493/dsh-desktop/compare/v0.1.8...HEAD
[0.1.8]: https://github.com/314857493/dsh-desktop/releases/tag/v0.1.8
