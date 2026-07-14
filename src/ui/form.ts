import type { FieldDef, FieldSchema, SignatureData } from '../core/types.ts';
import { formatRut, capitalizeWords } from '../core/format.ts';

function applyFormat(field: FieldDef, value: string): string {
  if (field.format === 'rut') return formatRut(value);
  if (field.format === 'capitalize') return capitalizeWords(value);
  return value;
}

/**
 * Renders a schema-driven form via DOM APIs (no innerHTML+interpolation —
 * avoids any injection risk from field data, even though this app has a
 * single trusted user). Calls `onChange` with a full copy of the current
 * data on every keystroke.
 */
export function renderForm(
  container: HTMLElement,
  schema: FieldSchema,
  initialData: SignatureData,
  onChange: (data: SignatureData) => void,
): void {
  container.innerHTML = '';
  const data: SignatureData = { ...initialData };

  // Pre-fill any field that has a `defaultValue` and wasn't already seeded
  // by the caller (e.g. Copec's Subgerencia/Gerencia) — still fully editable.
  let seededDefault = false;
  schema.forEach((field) => {
    if (data[field.key] === undefined && field.defaultValue !== undefined) {
      data[field.key] = field.defaultValue;
      seededDefault = true;
    }
  });

  schema.forEach((field) => {
    const label = document.createElement('label');
    label.className = 'field';

    const span = document.createElement('span');
    span.textContent = field.required ? `${field.label} *` : field.label;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = data[field.key] ?? '';
    input.addEventListener('input', () => {
      const value = applyFormat(field, input.value);
      if (value !== input.value) input.value = value;
      data[field.key] = value;
      onChange({ ...data });
    });

    label.append(span, input);
    container.appendChild(label);
  });

  if (seededDefault) {
    onChange({ ...data });
  }
}
