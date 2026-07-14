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

/**
 * Public read — returns already-public Blob URLs, so listing them adds no
 * real exposure. One shared pool for every category that supports a photo.
 */
export default async function handler(_req: NodeApiRequest, res: NodeApiResponse): Promise<void> {
  const { blobs } = await list({ prefix: `${GALLERY_PREFIX}/` });
  sendJson(res, 200, {
    images: blobs.map((blob) => ({ url: blob.url, pathname: blob.pathname, uploadedAt: blob.uploadedAt })),
  });
}
