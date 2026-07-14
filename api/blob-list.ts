import { list } from '@vercel/blob';

export const config = { runtime: 'edge' };

const GALLERY_PREFIX = 'signatures-gallery';

/** Public read — returns already-public Blob URLs, so listing them adds no real exposure. */
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const prefix = category ? `${GALLERY_PREFIX}/${category}/` : `${GALLERY_PREFIX}/`;

  const { blobs } = await list({ prefix });
  return Response.json({
    images: blobs.map((blob) => ({ url: blob.url, pathname: blob.pathname, uploadedAt: blob.uploadedAt })),
  });
}
