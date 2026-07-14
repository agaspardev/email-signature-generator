/**
 * Copies rendered signature HTML to the clipboard as `text/html` (+ `text/plain`
 * fallback) — the same implementation works for both Gmail and Outlook Web.
 */
export async function copySignatureHtml(html: string): Promise<void> {
  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([html], { type: 'text/plain' });
  await navigator.clipboard.write([
    new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
  ]);
}
