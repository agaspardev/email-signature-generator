import { upload } from '@vercel/blob/client';

export type GalleryCategory = 'duoc' | 'personal';

export interface GalleryImage {
  url: string;
  pathname: string;
  uploadedAt: string;
}

export async function uploadGalleryImage(
  category: GalleryCategory,
  file: File,
  password: string,
): Promise<GalleryImage> {
  const blob = await upload(`signatures-gallery/${category}/${Date.now()}-${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob-upload',
    clientPayload: JSON.stringify({ password }),
  });
  return { url: blob.url, pathname: blob.pathname, uploadedAt: new Date().toISOString() };
}

export async function listGalleryImages(category: GalleryCategory): Promise<GalleryImage[]> {
  const response = await fetch(`/api/blob-list?category=${category}`);
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('La galería no está disponible en este entorno (requiere estar desplegado en Vercel).');
  }
  const data = (await response.json()) as { images: GalleryImage[] };
  return data.images;
}

export async function deleteGalleryImage(url: string, password: string): Promise<void> {
  const response = await fetch('/api/blob-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, password }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo eliminar la imagen.');
  }
}
