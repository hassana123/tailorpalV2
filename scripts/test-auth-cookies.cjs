/* global Buffer, Headers, Response, console, process */
const assert = require('node:assert/strict')
const { createBrowserClient, createServerClient } = require('@supabase/ssr')
const { serialize, parse } = require('cookie')

async function run() {
  const jar = new Map()
  const userStore = new Map()
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated',
    role: 'authenticated', email: 'test@example.com', app_metadata: {},
    user_metadata: { large_oauth_profile: 'x'.repeat(24000) }, identities: [] }
  const payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.test-signature`
  const requests = []
  const fetchUser = async (_url, options) => {
    requests.push(new Headers(options.headers).get('authorization'))
    return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const cookies = {
    encode: 'tokens-only',
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: entries => entries.forEach(({ name, value, options }) => {
      assert.equal(parse(serialize(name, value, options))[name], value)
      if (options.maxAge === 0) jar.delete(name)
      else jar.set(name, value)
    }),
  }
  const browser = createBrowserClient('https://test.supabase.co', 'test-anon-key', {
    isSingleton: false, cookies, global: { fetch: fetchUser },
    auth: { userStorage: { getItem: key => userStore.get(key) ?? null,
      setItem: (key, value) => userStore.set(key, value), removeItem: key => userStore.delete(key) } },
  })
  const { error } = await browser.auth.setSession({ access_token: token, refresh_token: 'test-refresh-token' })
  assert.ifError(error)
  const bytes = Buffer.byteLength([...jar].map(([name, value]) => `${name}=${value}`).join('; '))
  assert.ok(bytes < 2000, `Cookie headers unexpectedly large: ${bytes}`)
  assert.ok(![...jar.values()].join('').includes('large_oauth_profile'))
  const { data: sessionData, error: sessionError } = await browser.auth.getSession()
  assert.ifError(sessionError)
  assert.equal(sessionData.session.user.id, user.id)
  const server = createServerClient('https://test.supabase.co', 'test-anon-key', {
    cookies, global: { fetch: fetchUser },
  })
  const { data, error: serverError } = await server.auth.getUser()
  assert.ifError(serverError)
  assert.equal(data.user.id, user.id)
  assert.ok(requests.every(value => value === `Bearer ${token}`))
  await browser.auth.signOut({ scope: 'local' })
  assert.equal(jar.size, 0)
  console.log(`Compact session round trip passed (${bytes} header bytes with 24KB user metadata); server user verification and signout passed.`)
}
run().catch(error => { console.error(error); process.exitCode = 1 })
