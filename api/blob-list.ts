import { list } from '@vercel/blob';

// @vercel/blob's server operations (list/del/put) pull in Node.js-only
// modules internally (undici, node:stream, etc.) — Node.js runtime only,
// NOT Edge (the default here is Node.js; do not add `runtime: 'edge'`).

const GALLERY_PREFIX = 'signatures-gallery';

function sendJson(res: NodeApiResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Public read — returns already-public Blob URLs, so listing them adds no real exposure. */
export default async function handler(req: NodeApiRequest, res: NodeApiResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `https://${req.headers.host ?? 'localhost'}`);
  const category = url.searchParams.get('category');
  const prefix = category ? `${GALLERY_PREFIX}/${category}/` : `${GALLERY_PREFIX}/`;

  const { blobs } = await list({ prefix });
  sendJson(res, 200, {
    images: blobs.map((blob) => ({ url: blob.url, pathname: blob.pathname, uploadedAt: blob.uploadedAt })),
  });
}
