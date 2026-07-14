import { table, row, cell, text, img, iconText, iconLink } from '../core/builder.ts';
import type { Category, SignatureData, Variant } from '../core/types.ts';
import { domainLabel } from '../core/format.ts';
import { PERSONAL_SITE_URL, PERSONAL_SITE_LABEL } from '../config/personalSite.ts';

// No separate "DUOC logo" image exists — brand identity is this color + icons
// only. Domain (duoc.cl) and personal site are fixed, not form fields —
// neither varies between signature generations.
const BRAND_COLOR = '#004AAD';
const MUTED_TEXT = '#6b6375';
const HEADING_TEXT = '#08060d';
const DUOC_URL = 'https://www.duoc.cl/';

function renderDuoc(data: SignatureData): string {
  // `data.photoUrl` comes from the Blob-backed gallery (src/gallery/) — a
  // real, permanent URL, safe to use directly in the exported signature.
  // Omitted entirely when no image has been selected yet.
  const photoSrc = data.photoUrl?.trim();
  const photoCell = photoSrc
    ? cell(
        table([
          row([
            cell(
              img(
                photoSrc,
                'Foto de perfil',
                { width: '88px', height: '88px', borderRadius: '44px' },
                { hideOnError: true },
              ),
            ),
          ]),
        ]),
        { padding: '4px 12px 4px 0', verticalAlign: 'middle' },
      )
    : '';

  // All fields optional — the signature builds up progressively as each is
  // filled; empty ones are omitted entirely rather than rendering a
  // labeled-but-blank line. `render()` (core/render.ts) guarantees this only
  // runs once at least one field has data, so the fixed institute/personal-
  // site rows below are safe to always include.
  const infoRows: string[] = [];

  const nombre = data.nombre?.trim();
  if (nombre) {
    infoRows.push(
      row([cell(text(nombre, { fontSize: '15px', fontWeight: 'bold', color: BRAND_COLOR }))]),
    );
  }

  const rut = data.rut?.trim();
  if (rut) {
    infoRows.push(row([cell(text(`RUT: ${rut}`, { fontSize: '12px', color: MUTED_TEXT }))]));
  }

  infoRows.push(
    row([
      cell(
        text('Instituto Profesional DUOC UC', {
          fontSize: '13px',
          fontWeight: 'bold',
          color: HEADING_TEXT,
        }),
        { padding: '4px 0' },
      ),
    ]),
  );

  const carrera = data.carrera?.trim();
  if (carrera) {
    infoRows.push(row([iconText('🎓', `Carrera: ${carrera}`, { fontSize: '12px', color: MUTED_TEXT })]));
  }

  const escuela = data.escuela?.trim();
  if (escuela) {
    infoRows.push(row([iconText('💻', `Escuela: ${escuela}`, { fontSize: '12px', color: MUTED_TEXT })]));
  }

  const jornada = data.jornada?.trim();
  const sede = data.sede?.trim();
  if (jornada || sede) {
    const parts = [jornada && `Jornada: ${jornada}`, sede && `Sede: ${sede}`].filter(Boolean).join(' | ');
    infoRows.push(row([iconText('🕐', parts, { fontSize: '12px', color: MUTED_TEXT })]));
  }

  // `data.personalSiteUrl` (set via the app's "otra web" toggle) overrides the
  // fixed default — safe to use directly in export, unlike `photoUrl` (see types.ts).
  const customSite = data.personalSiteUrl?.trim();
  const personalUrl = customSite || PERSONAL_SITE_URL;
  const personalLabel = customSite ? domainLabel(customSite) : PERSONAL_SITE_LABEL;

  infoRows.push(
    row([iconLink('🌐', DUOC_URL, 'duoc.cl', { fontSize: '12px', color: BRAND_COLOR })]),
    row([iconLink('🔗', personalUrl, personalLabel, { fontSize: '12px', color: MUTED_TEXT })]),
  );

  const infoCell = cell(table(infoRows), {
    padding: photoSrc ? '4px 0 4px 12px' : '4px 0',
    borderLeft: photoSrc ? `2px solid ${BRAND_COLOR}` : undefined,
    verticalAlign: 'middle',
  });

  return table([row(photoSrc ? [photoCell, infoCell] : [infoCell])]);
}

// Single variant. All fields optional — render() enforces "at least one
// field populated" instead of a fixed required set.
const duocDefault: Variant = {
  id: 'default',
  label: 'Duoc UC',
  fields: [
    { key: 'nombre', label: 'Nombre', required: false, format: 'capitalize', group: 'Identidad' },
    { key: 'rut', label: 'RUT', required: false, format: 'rut', group: 'Identidad' },
    { key: 'carrera', label: 'Carrera', required: false, group: 'Institución' },
    { key: 'escuela', label: 'Escuela', required: false, group: 'Institución' },
    { key: 'jornada', label: 'Jornada', required: false, group: 'Institución' },
    { key: 'sede', label: 'Sede', required: false, group: 'Institución' },
  ],
  render: renderDuoc,
};

export const duocCategory: Category = {
  id: 'duoc',
  label: 'Duoc UC',
  variants: [duocDefault],
};
