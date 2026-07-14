import { del } from '@vercel/blob';

// @vercel/blob's server operations (list/del/put) pull in Node.js-only
// modules internally (undici, node:stream, etc.) — Node.js runtime only,
// NOT Edge (the default here is Node.js; do not add `runtime: 'edge'`).

async function readBody(req: NodeApiRequest): Promise<string> {
  const decoder = new TextDecoder();
  let result = '';
  for await (const chunk of req) result += decoder.decode(chunk, { stream: true });
  result += decoder.decode();
  return result;
}

function sendJson(res: NodeApiResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Requires the gallery password — deletion is destructive and must not be public. */
export default async function handler(req: NodeApiRequest, res: NodeApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const { url, password } = JSON.parse(await readBody(req)) as { url?: string; password?: string };

  if (!process.env.GALLERY_PASSWORD || password !== process.env.GALLERY_PASSWORD) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return;
  }
  if (!url) {
    sendJson(res, 400, { error: 'Missing url' });
    return;
  }

  await del(url);
  sendJson(res, 200, { ok: true });
}
