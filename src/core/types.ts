// Core domain types for the signature template engine.

/** Opaque, hosting-agnostic stable URL. Never base64 (Outlook Desktop strips it). */
export type ImageRef = string;

export interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  /** Live input formatting, applied by the UI layer as the user types. */
  format?: 'rut' | 'capitalize';
  /** Pre-fills the form input on category selection; still fully editable. */
  defaultValue?: string;
  /** Groups consecutive fields under a subsection heading in the form (e.g. "Identidad", "Institución"). */
  group?: string;
  /** HTML input type — enables native browser validation/keyboard (e.g. 'email'). Defaults to 'text'. */
  inputType?: 'text' | 'email';
}

export type FieldSchema = FieldDef[];

/**
 * Raw form values, keyed by FieldDef.key. Values are plain strings; templates escape as needed.
 * Two reserved, non-schema keys:
 * - `photoUrl`: the currently selected profile photo, sourced from the
 *   Blob-backed gallery (src/gallery/) for categories that support one. A
 *   real, permanent URL — safe to use directly in the exported signature.
 * - `personalSiteUrl`: overrides a template's fixed personal-site link. Safe
 *   to carry into export — an `<a href>` has no hosting constraint, it's
 *   just a link the recipient's client follows on click.
 */
export interface SignatureData {
  [fieldKey: string]: string | undefined;
  photoUrl?: string;
  personalSiteUrl?: string;
}

export type RenderResult = { ok: true; html: string } | { ok: false; missing: string[] };

export interface Variant {
  id: string;
  label: string;
  fields: FieldSchema;
  /** Pure function: data -> nested-table inline-style HTML. Assumes data already validated against `fields`. */
  render(data: SignatureData): string;
}

export interface Category {
  id: string;
  label: string;
  /** Single-variant category = array of length 1 (spec: Category-Variant-Template Model). */
  variants: Variant[];
}
