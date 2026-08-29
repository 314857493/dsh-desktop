/**
 * Fetch a loopback DSH route through either the legacy unauthenticated web
 * server or the token-exchange flow used by newer runtimes.
 */
export async function authenticatedWebFetch(launchUrl, pathname, init = {}, request = fetch) {
  const ready = new URL(launchUrl)
  const headers = new Headers(init.headers)

  if (ready.searchParams.has('token')) {
    const exchange = await request(ready, {
      redirect: 'manual',
      signal: init.signal,
    })
    const setCookie = exchange.headers.get('set-cookie')
    if (exchange.status !== 303 || setCookie === null) {
      throw new Error(`dsh web authentication returned HTTP ${exchange.status}`)
    }
    headers.set('cookie', setCookie.split(';', 1)[0])
  }

  return request(new URL(pathname, `${ready.origin}/`), { ...init, headers })
}
