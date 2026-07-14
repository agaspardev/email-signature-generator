// Duplicated in middleware.ts rather than imported from a shared local module —
// Vercel's Edge bundler mis-bundles local files shared between middleware.ts
// and an api/ Edge Function (each is built as an independent Edge bundle),
// producing a false "referencing unsupported modules" build failure.
const SESSION_COOKIE = 'site_session';

async function computeSessionToken(secret: string): Promise<string> {
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

// No Node-specific dependency here (unlike the Blob routes) — Web Crypto is
// available on Edge, so this can safely use the Fetch API Request/Response.
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await request.formData();
  const password = formData.get('password');
  const secret = process.env.SITE_PASSWORD;

  if (!secret || password !== secret) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?error=1' },
    });
  }

  const token = await computeSessionToken(secret);
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      // No Max-Age/Expires — session-only cookie, cleared when the browser closes.
      'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}
