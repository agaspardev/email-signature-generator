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
import { createCustomSelect } from './customSelect.ts';
import { showMessage } from './messageModal.ts';
import {
  computeFingerprint,
  findDuplicate,
  saveSignature,
  deleteSignature,
  getSavedSignatures,
  type SavedSignature,
} from '../signatures/storage.ts';

// Registration lives here (UI bootstrap), not as an import side-effect in the
// template modules themselves — keeps src/templates/ pure data. Registration
// order determines dropdown order and the default selection — Personal is
// first, so it's the main view when the app loads.
registerCategory(personalCategory);
registerCategory(duocCategory);
registerCategory(innobyteCategory);
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

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const header = document.createElement('header');
  header.className = 'app-header';

  const brandMark = document.createElement('div');
  brandMark.className = 'brand-mark';
  brandMark.textContent = 'ES';

  const headerText = document.createElement('div');
  const kicker = document.createElement('p');
  kicker.className = 'app-kicker';
  kicker.textContent = 'Generador de firmas';
  const title = document.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'Email Signature Studio';
  headerText.append(kicker, title);

  header.append(brandMark, headerText);

  const layout = document.createElement('div');
  layout.className = 'app-layout';

  const controlsPanel = document.createElement('section');
  controlsPanel.className = 'panel panel-controls';

  const outputPanel = document.createElement('section');
  outputPanel.className = 'panel panel-output';

  const controlsTitle = document.createElement('h2');
  controlsTitle.className = 'panel-title';
  controlsTitle.textContent = 'Datos';
  controlsPanel.appendChild(controlsTitle);

  const selectorLabel = document.createElement('div');
  selectorLabel.className = 'field';
  const selectorSpan = document.createElement('span');
  selectorSpan.textContent = 'Categoría';
  const categorySelect = createCustomSelect(
    categories.map((category) => ({ value: category.id, label: category.label })),
    categories[0].id,
    () => onCategoryChange(),
  );
  selectorLabel.append(selectorSpan, categorySelect.element);

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

  const siteToggleRow = document.createElement('div');
  siteToggleRow.className = 'toggle-row';

  const siteToggleSwitch = document.createElement('label');
  siteToggleSwitch.className = 'toggle-switch';
  const siteToggleCheckbox = document.createElement('input');
  siteToggleCheckbox.type = 'checkbox';
  const siteToggleSlider = document.createElement('span');
  siteToggleSlider.className = 'toggle-slider';
  siteToggleSwitch.append(siteToggleCheckbox, siteToggleSlider);

  const siteToggleLabelText = document.createElement('span');
  siteToggleLabelText.className = 'toggle-text';
  siteToggleLabelText.textContent = 'Usar otra web (por defecto: antoniogaspar.dev)';

  siteToggleRow.append(siteToggleSwitch, siteToggleLabelText);

  const siteCustomUrlInput = document.createElement('input');
  siteCustomUrlInput.type = 'url';
  siteCustomUrlInput.placeholder = 'https://...';
  siteCustomUrlInput.style.display = 'none';

  siteToggleWrap.append(siteToggleSpan, siteToggleRow, siteCustomUrlInput);

  const formSection = document.createElement('section');
  formSection.className = 'form-section';

  const previewTitle = document.createElement('h2');
  previewTitle.className = 'panel-title';
  previewTitle.textContent = 'Vista previa';

  const previewSection = document.createElement('section');
  previewSection.className = 'preview-section';

  const exportSection = document.createElement('section');
  exportSection.className = 'export-section';

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'btn btn-primary';
  copyButton.textContent = 'Copiar (Gmail / Outlook Web)';

  const downloadButton = document.createElement('button');
  downloadButton.type = 'button';
  downloadButton.className = 'btn btn-secondary';
  downloadButton.textContent = 'Descargar .htm (Outlook Desktop)';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'btn btn-secondary';
  saveButton.textContent = 'Guardar firma';

  const statusEl = document.createElement('p');
  statusEl.className = 'export-status';

  exportSection.append(copyButton, downloadButton, saveButton, statusEl);

  const savedTitle = document.createElement('h2');
  savedTitle.className = 'panel-title';
  savedTitle.textContent = 'Firmas guardadas';

  const savedListEl = document.createElement('div');
  savedListEl.className = 'saved-list';

  controlsPanel.append(selectorLabel, photoLabel, formSection, siteToggleWrap);
  outputPanel.append(previewTitle, previewSection, exportSection, savedTitle, savedListEl);
  layout.append(controlsPanel, outputPanel);
  shell.append(header, layout);
  root.appendChild(shell);

  let currentData: SignatureData = {};
  let currentResult: RenderResult | undefined;

  function setButtonsEnabled(enabled: boolean): void {
    copyButton.disabled = !enabled;
    downloadButton.disabled = !enabled;
    saveButton.disabled = !enabled;
  }

  function renderSavedEntry(entry: SavedSignature): HTMLElement {
    const item = document.createElement('div');
    item.className = 'saved-item';

    const info = document.createElement('div');
    info.className = 'saved-item-info';
    const label = document.createElement('p');
    label.className = 'saved-item-label';
    label.textContent = `${entry.categoryLabel} — ${entry.label}`;
    const date = document.createElement('p');
    date.className = 'saved-item-date';
    date.textContent = new Date(entry.savedAt).toLocaleString();
    info.append(label, date);

    const actions = document.createElement('div');
    actions.className = 'saved-item-actions';

    const copyEntryButton = document.createElement('button');
    copyEntryButton.type = 'button';
    copyEntryButton.className = 'btn btn-small btn-secondary';
    copyEntryButton.textContent = 'Copiar';
    copyEntryButton.addEventListener('click', () => {
      copySignatureHtml(entry.html)
        .then(() => {
          statusEl.textContent = 'Copiado al portapapeles.';
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'error desconocido';
          statusEl.textContent = `Error al copiar: ${message}`;
        });
    });

    const deleteEntryButton = document.createElement('button');
    deleteEntryButton.type = 'button';
    deleteEntryButton.className = 'btn btn-small btn-danger';
    deleteEntryButton.textContent = 'Eliminar';
    deleteEntryButton.addEventListener('click', () => {
      deleteSignature(entry.id);
      refreshSavedList();
    });

    actions.append(copyEntryButton, deleteEntryButton);
    item.append(info, actions);
    return item;
  }

  function refreshSavedList(): void {
    const saved = getSavedSignatures();
    savedListEl.innerHTML = '';
    if (saved.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'saved-list-empty';
      empty.textContent = 'Todavía no hay firmas guardadas.';
      savedListEl.appendChild(empty);
      return;
    }
    saved.forEach((entry) => savedListEl.appendChild(renderSavedEntry(entry)));
  }

  function resetPersonalSiteToggle(): void {
    siteToggleCheckbox.checked = false;
    siteCustomUrlInput.value = '';
    siteCustomUrlInput.style.display = 'none';
    delete currentData.personalSiteUrl;
  }

  function update(): void {
    const category = categories.find((c) => c.id === categorySelect.value);
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
    const category = categories.find((c) => c.id === categorySelect.value);
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
      // Merge, don't replace — `data` only tracks this variant's own fields,
      // so replacing currentData outright would drop photoUrl/personalSiteUrl
      // (set outside the form, by the gallery picker / site toggle).
      currentData = { ...currentData, ...data };
      update();
    });
    update();
  }

  function onSiteModeChange(): void {
    const useCustom = siteToggleCheckbox.checked;
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

  siteToggleCheckbox.addEventListener('change', onSiteModeChange);
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
    downloadSignatureHtm(currentResult.html, `firma-${categorySelect.value}.htm`);
    statusEl.textContent = 'Descarga iniciada.';
  });

  saveButton.addEventListener('click', () => {
    if (!currentResult?.ok) return;
    const category = categories.find((c) => c.id === categorySelect.value);
    if (!category) return;

    const fingerprint = computeFingerprint(currentData);
    const duplicate = findDuplicate(category.id, fingerprint);
    if (duplicate) {
      void showMessage('Firma ya guardada', 'Esta firma ya existe en tus firmas guardadas — todos los campos y la foto coinciden con una guardada anteriormente.');
      return;
    }

    const label = currentData.nombre || new Date().toLocaleDateString();
    saveSignature({
      categoryId: category.id,
      categoryLabel: category.label,
      label,
      html: currentResult.html,
      fingerprint,
    });
    refreshSavedList();
    statusEl.textContent = 'Firma guardada.';
  });

  onCategoryChange();
  refreshSavedList();
}
