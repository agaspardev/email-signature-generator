import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// @vercel/blob's server operations pull in Node.js-only modules internally
// (undici, node:stream, etc.) — Node.js runtime only, NOT Edge (the default
// here is Node.js; do not add `runtime: 'edge'`).

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

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

/**
 * Issues a scoped, short-lived client-upload token for the gallery. Every
 * request must include the gallery password (set via the GALLERY_PASSWORD
 * env var) in `clientPayload` — without this check, anyone who finds this
 * endpoint could upload arbitrary files to the project's Blob store.
 */
export default async function handler(req: NodeApiRequest, res: NodeApiResponse): Promise<void> {
  const rawBody = await readBody(req);
  const body = JSON.parse(rawBody) as HandleUploadBody;

  // @vercel/blob's handleUpload() reads headers off a Fetch API Request —
  // Node.js runtime hands us a classic req, so reconstruct one.
  const request = new Request(`https://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, {
    method: req.method ?? 'POST',
    headers: Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') acc[key] = value;
      return acc;
    }, {}),
  });

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const password = clientPayload ? (JSON.parse(clientPayload) as { password?: string }).password : undefined;
        if (!process.env.GALLERY_PASSWORD || password !== process.env.GALLERY_PASSWORD) {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          tokenPayload: pathname,
        };
      },
      onUploadCompleted: async () => {
        // No server-side follow-up needed — the client receives the blob URL directly.
      },
    });

    sendJson(res, 200, jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    sendJson(res, 400, { error: message });
  }
}
