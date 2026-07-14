import type { GalleryCategory } from './api.ts';

const STORAGE_PREFIX = 'signature-image:';

/** Remembers which uploaded image is currently selected for a category, across sessions. */
export function getSelectedImage(category: GalleryCategory): string | undefined {
  return localStorage.getItem(STORAGE_PREFIX + category) ?? undefined;
}

export function setSelectedImage(category: GalleryCategory, url: string): void {
  localStorage.setItem(STORAGE_PREFIX + category, url);
}

export function clearSelectedImage(category: GalleryCategory): void {
  localStorage.removeItem(STORAGE_PREFIX + category);
}
