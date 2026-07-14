import type { RenderResult } from '../core/types.ts';

/** Spec scenario "Invalid/incomplete form": show a clear indicator instead of broken/partial HTML. */
export function renderPreview(container: HTMLElement, result: RenderResult): void {
  container.innerHTML = '';

  if (result.ok) {
    const frame = document.createElement('div');
    frame.className = 'preview-frame';
    // Safe: result.html comes exclusively from the constrained builder +
    // assertEmailSafe() guard (core/render.ts) — never raw/unvalidated input.
    frame.innerHTML = result.html;
    container.appendChild(frame);
    return;
  }

  const msg = document.createElement('p');
  msg.className = 'preview-incomplete';
  msg.textContent =
    result.missing.length > 0
      ? `Completá los campos requeridos: ${result.missing.join(', ')}`
      : 'Ingresá al menos un dato para ver la firma.';
  container.appendChild(msg);
}
