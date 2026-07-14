// Output guard (design: "Render-layer safety", layer 2).
// The builder makes forbidden markup structurally hard to produce; this is the
// runtime backstop that catches it anyway and fails loud — there is no test
// runner, so this assertion IS the spec's "no flex/grid/link/@import" scenario.

const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'display:flex', pattern: /display\s*:\s*flex/i },
  { name: 'display:grid', pattern: /display\s*:\s*grid/i },
  { name: '<link>', pattern: /<link[\s>]/i },
  { name: '@import', pattern: /@import/i },
  { name: 'class attribute', pattern: /\sclass\s*=/i },
  { name: '<style>', pattern: /<style[\s>]/i },
];

export class EmailUnsafeMarkupError extends Error {
  constructor(violations: string[]) {
    super(`Generated signature HTML contains email-unsafe markup: ${violations.join(', ')}`);
    this.name = 'EmailUnsafeMarkupError';
  }
}

/** Throws EmailUnsafeMarkupError if `html` contains any forbidden token. Called by every render(). */
export function assertEmailSafe(html: string): void {
  const violations = FORBIDDEN_PATTERNS.filter(({ pattern }) => pattern.test(html)).map(
    ({ name }) => name,
  );
  if (violations.length > 0) {
    throw new EmailUnsafeMarkupError(violations);
  }
}
