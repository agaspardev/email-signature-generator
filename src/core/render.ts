import type { RenderResult, SignatureData, Variant } from './types.ts';
import { assertEmailSafe } from './guard.ts';

/**
 * Validates required fields (if any), then requires at least one field to be
 * populated at all (progressive building — a variant with all-optional
 * fields, like DUOC UC, would otherwise render an empty shell the instant
 * a category is selected, before the user has typed anything). Renders via
 * the variant's template, then runs the email-safety guard. Never returns
 * partial/invalid HTML.
 */
export function render(variant: Variant, data: SignatureData): RenderResult {
  const missing = variant.fields
    .filter((field) => field.required)
    .filter((field) => !data[field.key]?.trim())
    .map((field) => field.key);

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  const hasAnyData = variant.fields.some((field) => data[field.key]?.trim());
  if (!hasAnyData) {
    return { ok: false, missing: [] };
  }

  const html = variant.render(data);
  assertEmailSafe(html);
  return { ok: true, html };
}
