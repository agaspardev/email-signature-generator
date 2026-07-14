import { SESSION_COOKIE, computeSessionToken } from '../src/server/session.ts';

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
