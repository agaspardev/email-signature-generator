import { registerCategory, getCategories, resolveVariant } from '../core/registry.ts';
import { render } from '../core/render.ts';
import type { RenderResult, SignatureData } from '../core/types.ts';
import { duocCategory } from '../templates/duoc.ts';
import { innobyteCategory } from '../templates/innobyte.ts';
import { personalCategory } from '../templates/personal.ts';
import { copecCategory } from '../templates/copec.ts';
import { renderForm } from './form.ts';
import { renderPreview } from './preview.ts';
import { copySignatureHtml } from '../export/clipboard.ts';
import { downloadSignatureHtm } from '../export/download.ts';
import { mountGalleryPicker } from '../gallery/ui.ts';
import type { GalleryCategory } from '../gallery/api.ts';

// Registration lives here (UI bootstrap), not as an import side-effect in the
// template modules themselves — keeps src/templates/ pure data.
registerCategory(duocCategory);
registerCategory(innobyteCategory);
registerCategory(personalCategory);
registerCategory(copecCategory);

// DUOC and Personal both use the Blob-backed photo gallery. Innobyte and
// Copec use fixed brand assets committed to the repo (no per-instance photo).
// Only DUOC has the default/custom personal-site toggle — Personal's site
// link is always fixed (no ambiguity to resolve, unlike Innobyte's
// multi-employee case).
const CATEGORIES_WITH_PHOTO = new Set<GalleryCategory>(['duoc', 'personal']);
const CATEGORIES_WITH_PERSONAL_SITE_TOGGLE = new Set(['duoc']);

function isGalleryCategory(id: string): id is GalleryCategory {
  return CATEGORIES_WITH_PHOTO.has(id as GalleryCategory);
}

export function mountApp(root: HTMLElement): void {
  const categories = getCategories();
  if (categories.length === 0) {
    throw new Error('No categories registered.');
  }

  root.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'app-layout';

  const selectorLabel = document.createElement('label');
  selectorLabel.className = 'field';
  const selectorSpan = document.createElement('span');
  selectorSpan.textContent = 'Categoría';
  const select = document.createElement('select');
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.label;
    select.appendChild(option);
  });
  selectorLabel.append(selectorSpan, select);

  const photoLabel = document.createElement('div');
  photoLabel.className = 'field';
  const photoSpan = document.createElement('span');
  photoSpan.textContent = 'Foto';
  const photoGallery = document.createElement('div');
  photoLabel.append(photoSpan, photoGallery);

  // Personal-site toggle: default (fixed) vs. a custom URL for this signature.
  const siteToggleWrap = document.createElement('div');
  siteToggleWrap.className = 'field site-toggle';
  const siteToggleSpan = document.createElement('span');
  siteToggleSpan.textContent = 'Web personal';

  const siteRadioGroup = document.createElement('div');
  siteRadioGroup.className = 'radio-group';

  const siteRadioDefault = document.createElement('input');
  siteRadioDefault.type = 'radio';
  siteRadioDefault.name = 'personal-site-mode';
  siteRadioDefault.id = 'personal-site-default';
  siteRadioDefault.value = 'default';
  siteRadioDefault.checked = true;
  const siteRadioDefaultLabel = document.createElement('label');
  siteRadioDefaultLabel.htmlFor = siteRadioDefault.id;
  siteRadioDefaultLabel.textContent = 'Por defecto (antoniogaspar.dev)';

  const siteRadioCustom = document.createElement('input');
  siteRadioCustom.type = 'radio';
  siteRadioCustom.name = 'personal-site-mode';
  siteRadioCustom.id = 'personal-site-custom';
  siteRadioCustom.value = 'custom';
  const siteRadioCustomLabel = document.createElement('label');
  siteRadioCustomLabel.htmlFor = siteRadioCustom.id;
  siteRadioCustomLabel.textContent = 'Otra';

  siteRadioGroup.append(
    siteRadioDefault,
    siteRadioDefaultLabel,
    siteRadioCustom,
    siteRadioCustomLabel,
  );

  const siteCustomUrlInput = document.createElement('input');
  siteCustomUrlInput.type = 'url';
  siteCustomUrlInput.placeholder = 'https://...';
  siteCustomUrlInput.style.display = 'none';

  siteToggleWrap.append(siteToggleSpan, siteRadioGroup, siteCustomUrlInput);

  const formSection = document.createElement('section');
  formSection.className = 'form-section';

  const previewSection = document.createElement('section');
  previewSection.className = 'preview-section';

  const exportSection = document.createElement('section');
  exportSection.className = 'export-section';

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copiar (Gmail / Outlook Web)';

  const downloadButton = document.createElement('button');
  downloadButton.type = 'button';
  downloadButton.textContent = 'Descargar .htm (Outlook Desktop)';

  const statusEl = document.createElement('p');
  statusEl.className = 'export-status';

  exportSection.append(copyButton, downloadButton, statusEl);

  layout.append(selectorLabel, photoLabel, formSection, siteToggleWrap, previewSection, exportSection);
  root.appendChild(layout);

  let currentData: SignatureData = {};
  let currentResult: RenderResult | undefined;

  function setButtonsEnabled(enabled: boolean): void {
    copyButton.disabled = !enabled;
    downloadButton.disabled = !enabled;
  }

  function resetPersonalSiteToggle(): void {
    siteRadioDefault.checked = true;
    siteRadioCustom.checked = false;
    siteCustomUrlInput.value = '';
    siteCustomUrlInput.style.display = 'none';
    delete currentData.personalSiteUrl;
  }

  function update(): void {
    const category = categories.find((c) => c.id === select.value);
    // Single-variant categories only in v1 (Phase 5.3) — resolveVariant()
    // auto-resolves without a variantId when a category has exactly one.
    const variant = category && resolveVariant(category.id);
    if (!variant) return;

    currentResult = render(variant, currentData);
    setButtonsEnabled(currentResult.ok);
    statusEl.textContent = '';
    renderPreview(previewSection, currentResult);
  }

  function onCategoryChange(): void {
    const category = categories.find((c) => c.id === select.value);
    const variant = category && resolveVariant(category.id);
    if (!variant) return;

    currentData = {};
    resetPersonalSiteToggle();

    if (category && isGalleryCategory(category.id)) {
      photoLabel.style.display = '';
      mountGalleryPicker(photoGallery, category.id, (url) => {
        if (url) {
          currentData.photoUrl = url;
        } else {
          delete currentData.photoUrl;
        }
        update();
      });
    } else {
      photoLabel.style.display = 'none';
      photoGallery.innerHTML = '';
      delete currentData.photoUrl;
    }

    siteToggleWrap.style.display =
      category && CATEGORIES_WITH_PERSONAL_SITE_TOGGLE.has(category.id) ? '' : 'none';

    renderForm(formSection, variant.fields, currentData, (data) => {
      currentData = data;
      update();
    });
    update();
  }

  function onSiteModeChange(): void {
    const useCustom = siteRadioCustom.checked;
    siteCustomUrlInput.style.display = useCustom ? '' : 'none';
    if (!useCustom) {
      delete currentData.personalSiteUrl;
      update();
    } else {
      applyCustomSiteUrl();
    }
  }

  function applyCustomSiteUrl(): void {
    // Only apply once it's a well-formed URL (native <input type=url> validation) —
    // otherwise fall back to the default rather than emit a broken href.
    if (siteCustomUrlInput.value.trim() && siteCustomUrlInput.checkValidity()) {
      currentData.personalSiteUrl = siteCustomUrlInput.value.trim();
    } else {
      delete currentData.personalSiteUrl;
    }
    update();
  }

  siteRadioDefault.addEventListener('change', onSiteModeChange);
  siteRadioCustom.addEventListener('change', onSiteModeChange);
  siteCustomUrlInput.addEventListener('input', applyCustomSiteUrl);

  copyButton.addEventListener('click', () => {
    // Spec: "Copy blocked by incomplete form" — action is disabled when invalid, so this only runs on valid state.
    if (!currentResult?.ok) return;
    copySignatureHtml(currentResult.html)
      .then(() => {
        statusEl.textContent = 'Copiado al portapapeles.';
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'error desconocido';
        statusEl.textContent = `Error al copiar: ${message}`;
      });
  });

  downloadButton.addEventListener('click', () => {
    if (!currentResult?.ok) return;
    downloadSignatureHtm(currentResult.html, `firma-${select.value}.htm`);
    statusEl.textContent = 'Descarga iniciada.';
  });

  select.addEventListener('change', onCategoryChange);
  onCategoryChange();
}
