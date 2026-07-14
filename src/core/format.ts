/** Groups digits into 3s from the right, joined by `.` — no regex backtracking risk. */
function groupThousands(digits: string): string {
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  return groups.join('.');
}

/** Formats Chilean RUT digits as `XX.XXX.XXX-K` while typing. Strips anything but digits/K. */
export function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${groupThousands(body)}-${dv}`;
}

/** Capitalizes each word while typing (e.g. "jane doe" -> "Jane Doe"). Unicode-aware (handles á, ñ, etc). */
export function capitalizeWords(raw: string): string {
  return raw.replace(/\p{L}+/gu, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/** Strips protocol/`www.` for a clean display label from a full URL (e.g. custom personal site). */
export function domainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
