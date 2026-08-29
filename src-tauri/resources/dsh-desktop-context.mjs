/**
 * Desktop-owned deployment context for every non-complete DSH agent prompt.
 *
 * The native launcher embeds this file and materializes it beside a generated
 * `--patch` overlay in the writable app cache. Keeping the guidance in an
 * ordinary host-plane plugin lets it compose with every agent preset without
 * editing the user's home-level patches or instruction files.
 */

export const name = 'dsh-desktop-context'
export const inject = ['systemPrompt']

export const DSH_DESKTOP_HOME_PROMPT = 'DSH Desktop runtime: `$DSH_HOME` is the authoritative root for DeepSeek Harness configuration and user data. It defaults to `~/.dsh-desktop` in the desktop launcher but may be overridden. Resolve `settings.yaml`, `cordis.patch.yml`, `profiles/`, `skills/`, and other Harness-managed files from `$DSH_HOME`; do not assume `~/.dsh` or derive this root from the current workspace. The desktop launcher\'s `dsh-desktop.json` is separate from Harness-managed configuration.'

export function apply(ctx) {
  ctx.systemPrompt.section({
    name: 'deployment:dsh-desktop-home',
    order: 10,
    text: DSH_DESKTOP_HOME_PROMPT,
  })
}
