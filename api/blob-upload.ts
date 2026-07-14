import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

// @vercel/blob's server operations pull in Node.js-only modules internally
// (undici, node:stream, etc.) — Node.js runtime only, NOT Edge (the default
// here is Node.js; do not add `runtime: 'edge'`).

const ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * Issues a scoped, short-lived client-upload token for the gallery. Every
 * request must include the gallery password (set via the GALLERY_PASSWORD
 * env var) in `clientPayload` — without this check, anyone who finds this
 * endpoint could upload arbitrary files to the project's Blob store.
 */
export default async function handler(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

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

    return Response.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return Response.json({ error: message }, { status: 400 });
  }
}
