/** Wraps rendered signature HTML in a full document and triggers a `.htm` download (for Outlook Desktop's Signatures folder). */
export function downloadSignatureHtm(html: string, filename: string): void {
  const doc = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
