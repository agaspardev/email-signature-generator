import { table, row, cell, text, img, link } from '../core/builder.ts';
import type { Category, SignatureData, Variant } from '../core/types.ts';
import { resolveImage } from '../config/images.ts';
import { PERSONAL_SITE_URL, PERSONAL_SITE_LABEL } from '../config/personalSite.ts';

// Colors, font stack, sizes, and weights match the brand's existing Gmail
// signature template. One deliberate deviation: that template's right-column
// lines use `display:flex`, which the email-safety guard forbids (Outlook
// Desktop's Word engine ignores it anyway) — each line has a single child, so
// flex vs block makes no visual difference here; omitted safely.
const AZUL = '#194163'; // rgb(25,65,99) — nombre, teléfono/correo links
const CELESTE = '#49b6bd'; // rgb(73,182,189) — separator gradient start
const CELESTE2 = '#2d6a7e'; // rgb(45,106,126) — innobyte.net / personal site links
const MUTED_TEXT = '#717182'; // rgb(113,113,130) — cargo
const ADDRESS_GRAY = '#444444'; // rgb(68,68,68) — dirección (NOT black, NOT a brand color)
const FONT_FAMILY = 'Nunito, "Segoe UI", Arial, sans-serif';
const BASE_FONT_SIZE = '13px';
const LINE_HEIGHT = '1.5';
const INNOBYTE_URL = 'https://www.innobyte.net/';
const INNOBYTE_LABEL = 'Innobyte.net';
// Two explicit lines rather than one auto-wrapped string, so the break point
// is always predictable regardless of available width in the email client.
const FIXED_ADDRESS_LINE_1 = 'Tabancura 1515, Oficina 122';
const FIXED_ADDRESS_LINE_2 = 'Vitacura, Santiago';

// WhatsApp deep link (wa.me needs digits only — no `+`, spaces, or dashes) —
// opens a direct chat with the recipient instead of dialing a call.
function whatsappHref(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}`;
}

function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

// Layout: logo | nombre/cargo/web fija/web personal | gradient separator | teléfono/correo/dirección.
function renderInnobyte(data: SignatureData): string {
  const logoCell = cell(
    img(resolveImage('innobyteLogo'), 'Innobyte', { height: '104px', width: 'auto' }, { hideOnError: true }),
    { padding: '0 20px 0 0', verticalAlign: 'middle' },
  );

  // All variable fields optional — progressive building, same pattern as DUOC
  // (core/render.ts guarantees this only runs once at least one has data).
  const middleRows: string[] = [];

  const nombre = data.nombre?.trim();
  if (nombre) {
    middleRows.push(
      row([cell(text(nombre, { fontSize: '16px', fontWeight: 'bold', color: AZUL }))]),
    );
  }

  const cargo = data.cargo?.trim();
  if (cargo) {
    middleRows.push(row([cell(text(cargo, { color: MUTED_TEXT }))]));
  }

  // Kept as a real clickable link — more useful than static text, and this
  // is the only innobyte.net reference in the signature (no duplication).
  middleRows.push(
    row([cell(link(INNOBYTE_URL, INNOBYTE_LABEL, { fontWeight: 600, color: CELESTE2, textDecoration: 'none' }))]),
  );

  const sitioPersonal = PERSONAL_SITE_URL;
  middleRows.push(
    row([
      cell(
        link(sitioPersonal, PERSONAL_SITE_LABEL, { fontWeight: 600, color: CELESTE2, textDecoration: 'none' }),
      ),
    ]),
  );

  const middleCell = cell(table(middleRows), { padding: '0 24px 0 0', verticalAlign: 'middle', whiteSpace: 'nowrap' });

  // Dedicated gradient separator (matches source exactly), not a cell border.
  const separatorCell = cell(
    `<span style="width:2px;height:72px;background:linear-gradient(${CELESTE},${AZUL});border-radius:2px;display:block"></span>`,
    { padding: '0 24px 0 0', verticalAlign: 'middle' },
  );

  // Deliberately not repeating the innobyte.net link in this column — it
  // already appears once in the middle column.
  const rightRows: string[] = [];

  // Always reserves this line's height, even with no phone entered — a
  // non-breaking space keeps the right column's row count (and therefore
  // its visual symmetry against the middle column) stable regardless of
  // whether a phone is provided.
  const telefono = data.telefono?.trim();
  rightRows.push(
    row([
      cell(
        telefono
          ? link(whatsappHref(telefono), telefono, { color: AZUL, textDecoration: 'none' })
          : text(' ', { color: AZUL }), // non-breaking space — a plain ' ' can collapse to zero height in table layout
      ),
    ]),
  );

  const email = data.email?.trim();
  if (email) {
    rightRows.push(row([cell(link(mailtoHref(email), email, { color: AZUL, textDecoration: 'none' }))]));
  }

  rightRows.push(
    row([cell(text(FIXED_ADDRESS_LINE_1, { color: ADDRESS_GRAY }))]),
    row([cell(text(FIXED_ADDRESS_LINE_2, { color: ADDRESS_GRAY }))]),
  );

  const rightCell = cell(table(rightRows), { padding: '0', verticalAlign: 'middle', whiteSpace: 'nowrap' });

  return table([row([logoCell, middleCell, separatorCell, rightCell])], {
    style: { fontFamily: FONT_FAMILY, fontSize: BASE_FONT_SIZE, lineHeight: LINE_HEIGHT, color: '#333333' },
  });
}

const innobyteDefault: Variant = {
  id: 'default',
  label: 'Innobyte',
  fields: [
    { key: 'nombre', label: 'Nombre', required: false, format: 'capitalize', group: 'Identidad' },
    { key: 'cargo', label: 'Cargo', required: false, group: 'Identidad' },
    { key: 'telefono', label: 'Teléfono', required: false, group: 'Contacto' },
    { key: 'email', label: 'Correo', required: false, group: 'Contacto', inputType: 'email' },
  ],
  render: renderInnobyte,
};

export const innobyteCategory: Category = {
  id: 'innobyte',
  label: 'Innobyte',
  variants: [innobyteDefault],
};
