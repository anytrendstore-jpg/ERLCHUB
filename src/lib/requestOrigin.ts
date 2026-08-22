import type { NextRequest } from 'next/server';

/**
 * `request.nextUrl.origin` refleja el header `Host` que Next.js recibió, y
 * algunos túneles/reverse proxies (cloudflared, ngrok) reescriben ese header
 * al host interno (`localhost:3000`) en vez de conservar el dominio público.
 * Por eso preferimos `x-forwarded-host`/`x-forwarded-proto` cuando existen.
 */
export function publicOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    || request.nextUrl.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')
    || request.nextUrl.host;
  return `${proto}://${host}`;
}
