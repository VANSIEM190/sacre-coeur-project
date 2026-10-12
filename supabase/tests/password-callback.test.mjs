import test from 'node:test'
import assert from 'node:assert/strict'

let importVersion = 0
async function captureCallback(hash) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: hash === null ? undefined : { location: { hash } },
  })
  try {
    // Each case represents a fresh page load before Supabase consumes its URL.
    return await import('../../packages/data-access/src/supabase/password-callback.ts?test=' + ++importVersion)
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else delete globalThis.window
  }
}

for (const type of ['invite', 'recovery']) {
  test('recognizes a complete ' + type + ' callback for password setup', async () => {
    const callback = await captureCallback('#type=' + type + '&access_token=test-token&refresh_token=test-refresh')
    assert.equal(callback.hasPasswordSetupCallback(), true)
  })
}

for (const hash of ['', '#type=invite', '#type=invite&access_token=test-token', '#type=signin&access_token=test-token&refresh_token=test-refresh']) {
  test('ordinary or incomplete URL does not enable password setup: ' + (hash || '(empty)'), async () => {
    const callback = await captureCallback(hash)
    assert.equal(callback.hasPasswordSetupCallback(), false)
  })
}

test('completed password setup cannot reuse the in-memory callback marker', async () => {
  const callback = await captureCallback('#type=invite&access_token=test-token&refresh_token=test-refresh')
  callback.consumePasswordSetupCallback()
  assert.equal(callback.hasPasswordSetupCallback(), false)
})

test('a server import without window does not claim a password callback', async () => {
  const callback = await captureCallback(null)
  assert.equal(callback.hasPasswordSetupCallback(), false)
})
