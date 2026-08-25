# Third-party notices

DSH Desktop installers bundle software maintained by other projects. Those
components remain under their own licenses and are not relicensed by this
repository.

| Component | Project | License |
| --- | --- | --- |
| DeepSeek Harness | <https://github.com/deepseek-ai/deepseek-harness> | MIT |
| Node.js | <https://github.com/nodejs/node> | MIT and bundled third-party notices |
| pnpm | <https://github.com/pnpm/pnpm> | MIT |
| dshmarket | <https://github.com/dsh-market/dsh-market> | MIT |
| Tauri and Rust dependencies | <https://github.com/tauri-apps/tauri> and the crates recorded in `src-tauri/Cargo.lock` | Per-package licenses |

The release pipeline preserves the license files shipped with the bundled
Node.js runtime and deployed packages. Consult the installed package trees and
their package metadata for the complete dependency-level notices applicable to
a particular release.
