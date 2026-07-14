import type { GalleryCategory, GalleryImage } from './api.ts';
import { uploadGalleryImage, listGalleryImages, deleteGalleryImage } from './api.ts';
import { getSelectedImage, setSelectedImage } from './storage.ts';

/**
 * Renders a thumbnail picker backed by the Blob gallery for one category.
 * Selecting or uploading an image calls `onSelect` with the new URL (or
 * `undefined` if the selected image was deleted) — that URL is a real,
 * permanent Blob URL, safe to use directly in the exported signature.
 */
export function mountGalleryPicker(
  container: HTMLElement,
  category: GalleryCategory,
  onSelect: (url: string | undefined) => void,
): void {
  container.innerHTML = '';
  container.className = 'gallery-picker';

  const grid = document.createElement('div');
  grid.className = 'gallery-grid';

  const uploadButton = document.createElement('button');
  uploadButton.type = 'button';
  uploadButton.className = 'gallery-upload-btn';
  uploadButton.textContent = '+ Subir nueva';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  const statusEl = document.createElement('p');
  statusEl.className = 'gallery-status';

  container.append(grid, uploadButton, fileInput, statusEl);

  let images: GalleryImage[] = [];

  function renderGrid(): void {
    grid.innerHTML = '';
    const selected = getSelectedImage(category);

    images.forEach((image) => {
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'gallery-thumb-wrap';

      const thumb = document.createElement('img');
      thumb.src = image.url;
      thumb.className = image.url === selected ? 'gallery-thumb selected' : 'gallery-thumb';
      thumb.addEventListener('click', () => {
        setSelectedImage(category, image.url);
        onSelect(image.url);
        renderGrid();
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'gallery-delete-btn';
      deleteButton.title = 'Eliminar';
      deleteButton.textContent = '×';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        void handleDelete(image, selected);
      });

      thumbWrap.append(thumb, deleteButton);
      grid.appendChild(thumbWrap);
    });
  }

  async function handleDelete(image: GalleryImage, selected: string | undefined): Promise<void> {
    const password = window.prompt('Contraseña para eliminar:');
    if (!password) return;
    try {
      await deleteGalleryImage(image.url, password);
      if (image.url === selected) onSelect(undefined);
      await refresh();
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : 'Error al eliminar la imagen.';
    }
  }

  async function refresh(): Promise<void> {
    try {
      images = await listGalleryImages(category);
      statusEl.textContent = '';
      renderGrid();
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : 'Error al cargar imágenes.';
    }
  }

  uploadButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    void handleUpload(file);
  });

  async function handleUpload(file: File): Promise<void> {
    const password = window.prompt('Contraseña para subir:');
    if (!password) return;

    statusEl.textContent = 'Subiendo...';
    try {
      const image = await uploadGalleryImage(category, file, password);
      setSelectedImage(category, image.url);
      onSelect(image.url);
      await refresh();
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : 'Error al subir la imagen.';
    }
  }

  onSelect(getSelectedImage(category));
  void refresh();
}
