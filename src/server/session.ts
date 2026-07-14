// Shared between middleware.ts (verifies the session cookie on every
// request) and api/login.ts (issues it after a correct password). Both run
// on Vercel's Edge runtime, so this only uses Web Crypto (no Node APIs).

export const SESSION_COOKIE = 'site_session';

/**
 * A token derived from the site password via HMAC-SHA256 — not the password
 * itself, and not guessable without knowing SITE_PASSWORD. Deterministic
 * (same password -> same token) so middleware can recompute and compare it
 * without needing separate server-side session storage.
 */
export async function computeSessionToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode('site-session'));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}
