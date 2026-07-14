import { table, row, cell, text, img } from '../core/builder.ts';
import type { Category, SignatureData, Variant } from '../core/types.ts';
import { resolveImage } from '../config/images.ts';

// Every text line uses the same uniform gray; visual hierarchy comes from
// bold/size, not color. Font is Trebuchet MS — a common pre-installed system
// font on Windows, so it can render as intended without needing @font-face.
const TEXT_GRAY = '#808080';
const FONT_FAMILY = "'Trebuchet MS', Helvetica, Arial, sans-serif";
const FIXED_ADDRESS = 'Isidora Goyenechea 2915, Las Condes';

// Layout: [logo COPEC] | [(nombre+cargo, stacked) + planet badge, vertically
// AND horizontally centered against BOTH lines] / subgerencia / gerencia / dirección.
function renderCopec(data: SignatureData): string {
  const logoCell = cell(img(resolveImage('copecLogo'), 'Copec', { width: '110px' }, { hideOnError: true }), {
    padding: '4px 20px 4px 0',
    verticalAlign: 'middle',
  });

  const infoRows: string[] = [];

  const nameCargoRows: string[] = [];
  const nombre = data.nombre?.trim();
  if (nombre) {
    nameCargoRows.push(
      row([cell(text(nombre, { fontSize: '16px', fontWeight: 'bold', color: TEXT_GRAY, whiteSpace: 'nowrap' }))]),
    );
  }
  const cargo = data.cargo?.trim();
  if (cargo) {
    nameCargoRows.push(
      row([cell(text(cargo, { fontSize: '12px', fontWeight: 'bold', color: TEXT_GRAY, whiteSpace: 'nowrap' }))]),
    );
  }

  if (nameCargoRows.length > 0) {
    infoRows.push(
      row([
        cell(table(nameCargoRows), { padding: '0 16px 0 0', verticalAlign: 'middle' }),
        cell(
          img(
            resolveImage('copecPlanet'),
            '',
            { width: '48px', height: '48px', borderRadius: '24px' },
            { hideOnError: true },
          ),
          { width: '60px', textAlign: 'center', verticalAlign: 'middle' },
        ),
      ]),
    );
  }

  const subgerencia = data.subgerencia?.trim();
  if (subgerencia) {
    infoRows.push(
      row([cell(text(subgerencia, { fontSize: '13px', fontWeight: 'bold', color: TEXT_GRAY, whiteSpace: 'nowrap' }))]),
    );
  }

  const gerencia = data.gerencia?.trim();
  if (gerencia) {
    infoRows.push(row([cell(text(gerencia, { fontSize: '12px', color: TEXT_GRAY, whiteSpace: 'nowrap' }))]));
  }

  infoRows.push(row([cell(text(FIXED_ADDRESS, { fontSize: '12px', color: TEXT_GRAY, whiteSpace: 'nowrap' }))]));

  const infoCell = cell(table(infoRows), { padding: '4px 0', verticalAlign: 'middle' });

  return table([row([logoCell, infoCell])], { style: { fontFamily: FONT_FAMILY } });
}

const copecDefault: Variant = {
  id: 'default',
  label: 'Copec',
  fields: [
    { key: 'nombre', label: 'Nombre', required: false, format: 'capitalize', group: 'Identidad' },
    { key: 'cargo', label: 'Cargo', required: false, group: 'Identidad' },
    {
      key: 'subgerencia',
      label: 'Subgerencia',
      required: false,
      defaultValue: 'Subgerencia Tecnología y Negocios',
      group: 'Organización',
    },
    {
      key: 'gerencia',
      label: 'Gerencia',
      required: false,
      defaultValue: 'Gerencia de Tecnología',
      group: 'Organización',
    },
  ],
  render: renderCopec,
};

export const copecCategory: Category = {
  id: 'copec',
  label: 'Copec',
  variants: [copecDefault],
};
