import assert from 'node:assert/strict'
import test from 'node:test'
import { authenticatedWebFetch } from './boot-test-auth.mjs'

test('legacy DSH web routes are fetched directly from the ready origin', async () => {
  const requests = []
  const response = new Response('{}')
  const result = await authenticatedWebFetch(
    'http://127.0.0.1:3000',
    '/dsh-market/status',
    {},
    async (url, init) => {
      requests.push({ url: String(url), init })
      return response
    },
  )

  assert.equal(result, response)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, 'http://127.0.0.1:3000/dsh-market/status')
  assert.equal(requests[0].init.headers.has('cookie'), false)
})

test('tokenized DSH web URLs are exchanged for an authenticated route cookie', async () => {
  const requests = []
  const result = await authenticatedWebFetch(
    'http://127.0.0.1:3000/?token=launch-token',
    '/dsh-market/status',
    {},
    async (url, init) => {
      requests.push({ url: String(url), init })
      if (requests.length === 1) {
        return new Response(null, {
          status: 303,
          headers: { 'set-cookie': 'dsh_web=authority; HttpOnly; SameSite=Strict' },
        })
      }
      return new Response('{}')
    },
  )

  assert.equal(result.status, 200)
  assert.equal(requests.length, 2)
  assert.equal(requests[0].url, 'http://127.0.0.1:3000/?token=launch-token')
  assert.equal(requests[0].init.redirect, 'manual')
  assert.equal(requests[1].url, 'http://127.0.0.1:3000/dsh-market/status')
  assert.equal(requests[1].init.headers.get('cookie'), 'dsh_web=authority')
})

test('a failed token exchange stops before the protected route request', async () => {
  let requests = 0
  await assert.rejects(
    authenticatedWebFetch(
      'http://127.0.0.1:3000/?token=stale',
      '/dsh-market/status',
      {},
      async () => {
        requests += 1
        return new Response('unauthorized', { status: 401 })
      },
    ),
    /authentication returned HTTP 401/,
  )
  assert.equal(requests, 1)
})
