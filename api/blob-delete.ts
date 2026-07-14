import { del } from '@vercel/blob';

// @vercel/blob's server operations (list/del/put) pull in Node.js-only
// modules internally (undici, node:stream, etc.) — Node.js runtime only,
// NOT Edge (the default here is Node.js; do not add `runtime: 'edge'`).

/** Requires the gallery password — deletion is destructive and must not be public. */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { url, password } = (await request.json()) as { url?: string; password?: string };

  if (!process.env.GALLERY_PASSWORD || password !== process.env.GALLERY_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!url) {
    return Response.json({ error: 'Missing url' }, { status: 400 });
  }

  await del(url);
  return Response.json({ ok: true });
}
