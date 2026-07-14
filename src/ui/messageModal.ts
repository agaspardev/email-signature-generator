/** Shows an informational modal (title + message, single "Entendido" button). Resolves when dismissed. */
export function showMessage(title: string, message: string): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const titleEl = document.createElement('p');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;

    const messageEl = document.createElement('p');
    messageEl.className = 'modal-message';
    messageEl.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'btn btn-primary';
    okButton.textContent = 'Entendido';

    actions.appendChild(okButton);
    modal.append(titleEl, messageEl, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close(): void {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', onKeydown);
      resolve();
    }

    function onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Enter' || event.key === 'Escape') close();
    }

    okButton.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);

    okButton.focus();
  });
}
