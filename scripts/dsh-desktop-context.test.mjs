import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DSH_DESKTOP_HOME_PROMPT,
  apply,
  inject,
  name,
} from '../src-tauri/resources/dsh-desktop-context.mjs'

test('desktop context registers stable DSH_HOME guidance', () => {
  let registered
  apply({
    systemPrompt: {
      section(section) {
        registered = section
      },
    },
  })

  assert.equal(name, 'dsh-desktop-context')
  assert.deepEqual(inject, ['systemPrompt'])
  assert.deepEqual(registered, {
    name: 'deployment:dsh-desktop-home',
    order: 10,
    text: DSH_DESKTOP_HOME_PROMPT,
  })
  assert.match(DSH_DESKTOP_HOME_PROMPT, /\$DSH_HOME.*authoritative root/)
  assert.match(DSH_DESKTOP_HOME_PROMPT, /defaults to `~\/\.dsh-desktop`.*may be overridden/)
  assert.match(DSH_DESKTOP_HOME_PROMPT, /do not assume `~\/\.dsh`/)
  assert.match(DSH_DESKTOP_HOME_PROMPT, /`dsh-desktop\.json` is separate/)
})
