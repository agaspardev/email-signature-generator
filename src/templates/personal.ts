import { table, row, cell, text, img, link } from '../core/builder.ts';
import type { Category, SignatureData, Variant } from '../core/types.ts';
import { PERSONAL_SITE_URL, PERSONAL_SITE_LABEL } from '../config/personalSite.ts';

// Deliberately minimal — this is a personal-email signature, not tied to any
// institution, so no employer brand colors apply. One neutral accent only.
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6b7280';
const ACCENT = '#194163'; // navy accent — professional, not corporate-specific
const LINKEDIN_URL = 'https://www.linkedin.com/in/antoniogasparr/';
const LINKEDIN_LABEL = 'LinkedIn';

// Privacy-conscious by design: no phone, no address, no RUT, no employer.
// Just identity + two professional links.
function renderPersonal(data: SignatureData): string {
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
                { width: '80px', height: '80px', borderRadius: '40px' },
                { hideOnError: true },
              ),
            ),
          ]),
        ]),
        { padding: '4px 16px 4px 0', verticalAlign: 'middle' },
      )
    : '';

  const infoRows: string[] = [];

  const nombre = data.nombre?.trim();
  if (nombre) {
    infoRows.push(
      row([cell(text(nombre, { fontSize: '16px', fontWeight: 'bold', color: TEXT_DARK, whiteSpace: 'nowrap' }))]),
    );
  }

  const tagline = data.tagline?.trim();
  if (tagline) {
    infoRows.push(
      row([cell(text(tagline, { fontSize: '12px', color: TEXT_MUTED, whiteSpace: 'nowrap' }))]),
    );
  }

  infoRows.push(
    row([
      cell(link(PERSONAL_SITE_URL, PERSONAL_SITE_LABEL, { fontSize: '12px', fontWeight: 'bold', color: ACCENT }), {
        padding: '2px 0 0 0',
      }),
    ]),
    row([cell(link(LINKEDIN_URL, LINKEDIN_LABEL, { fontSize: '12px', fontWeight: 'bold', color: ACCENT }))]),
  );

  const infoCell = cell(table(infoRows), {
    padding: photoSrc ? '4px 0 4px 16px' : '4px 0',
    borderLeft: photoSrc ? `2px solid ${ACCENT}` : undefined,
    verticalAlign: 'middle',
  });

  return table([row(photoSrc ? [photoCell, infoCell] : [infoCell])]);
}

const personalDefault: Variant = {
  id: 'default',
  label: 'Personal',
  fields: [
    { key: 'nombre', label: 'Nombre', required: false, format: 'capitalize' },
    { key: 'tagline', label: 'Rol profesional (ej. Ingeniero de Software)', required: false },
  ],
  render: renderPersonal,
};

export const personalCategory: Category = {
  id: 'personal',
  label: 'Personal',
  variants: [personalDefault],
};
