// Constrained table/inline-style builder (design: "Render-layer safety").
// Templates NEVER write raw HTML strings — only these typed helpers exist,
// so flex/grid layout, external fonts, class-based CSS and icon fonts are
// structurally unrepresentable, not just discouraged.

/** Allowlisted CSS properties only — no `display: flex|grid`, no way to reference a class or id. */
export interface InlineStyle {
  display?: 'block' | 'inline-block' | 'inline' | 'table' | 'table-cell' | 'table-row' | 'none';
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  padding?: string;
  margin?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRadius?: string;
  borderCollapse?: 'collapse' | 'separate';
  backgroundColor?: string;
  /** For gradients (`linear-gradient(...)`) — plain colors should use `backgroundColor` instead. */
  background?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold' | number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'right' | 'center';
  textDecoration?: string;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  whiteSpace?: 'nowrap' | 'normal';
  lineHeight?: string;
  overflow?: 'hidden' | 'visible';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function styleToCss(style?: InlineStyle): string {
  if (!style) return '';
  const decls = Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([prop, value]) => {
      const kebab = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${kebab}:${value}`;
    });
  return decls.join(';');
}

function styleAttr(style?: InlineStyle): string {
  const css = styleToCss(style);
  return css ? ` style="${escapeHtml(css)}"` : '';
}

export interface TableAttrs {
  cellpadding?: number;
  cellspacing?: number;
  border?: number;
  width?: string;
  role?: string;
  style?: InlineStyle;
}

/** Root/nested table wrapper. Rows must be produced by `row()`. */
export function table(rows: string[], attrs: TableAttrs = {}): string {
  const { cellpadding = 0, cellspacing = 0, border = 0, width, role = 'presentation' } = attrs;
  const widthAttr = width ? ` width="${escapeHtml(width)}"` : '';
  return `<table cellpadding="${cellpadding}" cellspacing="${cellspacing}" border="${border}" role="${role}"${widthAttr}${styleAttr(attrs.style)}>${rows.join('')}</table>`;
}

/** A `<tr>` containing one or more `<td>` produced by `cell()`. */
export function row(cells: string[], style?: InlineStyle): string {
  return `<tr${styleAttr(style)}>${cells.join('')}</tr>`;
}

/** A `<td>` containing already-built content (nested table, text, img, svgIcon). */
export function cell(content: string, style?: InlineStyle): string {
  return `<td${styleAttr(style)}>${content}</td>`;
}

/** Escaped text node — the only way user-provided field data enters the output. */
export function text(value: string, style?: InlineStyle): string {
  if (!style) return escapeHtml(value);
  return `<span${styleAttr(style)}>${escapeHtml(value)}</span>`;
}

/**
 * `<img>` with an opaque, externally-resolved URL (never base64 — see config/images.ts).
 * `hideOnError` hides the element via `onerror` if the URL fails to load — mainly
 * useful in this app's own live preview (e.g. before a deploy makes the URL live);
 * most email clients strip inline event-handler attributes, so it's a no-op there.
 */
export function img(
  src: string,
  alt: string,
  style?: InlineStyle,
  opts?: { hideOnError?: boolean },
): string {
  const onerror = opts?.hideOnError ? ` onerror="this.style.display='none'"` : '';
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${styleAttr(style)}${onerror}>`;
}

/** Inline SVG icon — the only icon path; icon fonts (`<i class="...">`) are unrepresentable. */
export function svgIcon(pathData: string, style?: InlineStyle): string {
  const size = style?.width ?? '12px';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${escapeHtml(size)}" height="${escapeHtml(size)}"${styleAttr(style)}><path d="${escapeHtml(pathData)}" fill="currentColor"/></svg>`;
}

/**
 * Icon + label pair that must stay on one line (Outlook Web wraps an
 * inline-block icon and following text without this). Always groups both in a single `<td>`.
 */
export function iconText(icon: string, label: string, style?: InlineStyle): string {
  return cell(`${icon}<span style="margin-left:4px">${escapeHtml(label)}</span>`, {
    ...style,
    whiteSpace: 'nowrap',
  });
}

/**
 * A clickable `<a href>` — escaped href and label. No `<link>`/`@import`, so guard-safe.
 * Opens in a new tab (`target="_blank"`) so clicking it doesn't navigate the
 * recipient away from their inbox; `rel="noopener noreferrer"` is mandatory
 * alongside `target="_blank"` — without it the opened page gets a live
 * `window.opener` handle back into the original tab (tabnabbing risk).
 */
export function link(href: string, label: string, style?: InlineStyle): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${styleAttr(style)}>${escapeHtml(label)}</a>`;
}

/** Same grouping/nowrap guarantee as `iconText()`, but the label is a clickable link. */
export function iconLink(icon: string, href: string, label: string, style?: InlineStyle): string {
  return cell(`${icon}<span style="margin-left:4px">${link(href, label)}</span>`, {
    ...style,
    whiteSpace: 'nowrap',
  });
}
