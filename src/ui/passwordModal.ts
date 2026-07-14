/**
 * Shows a modal asking for a password (hidden by default, with a show/hide
 * toggle). Resolves with the entered password, or `null` if cancelled.
 */
export function askPassword(promptText: string): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const title = document.createElement('p');
    title.className = 'modal-title';
    title.textContent = promptText;

    const inputWrap = document.createElement('div');
    inputWrap.className = 'modal-input-wrap';

    const input = document.createElement('input');
    input.type = 'password';
    input.className = 'modal-input';
    input.placeholder = 'Contraseña';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'modal-eye-btn';
    toggleButton.textContent = '👁';
    toggleButton.setAttribute('aria-label', 'Mostrar contraseña');
    toggleButton.addEventListener('click', () => {
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      toggleButton.textContent = hidden ? '🙈' : '👁';
      toggleButton.setAttribute('aria-label', hidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
      input.focus();
    });

    inputWrap.append(input, toggleButton);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.textContent = 'Cancelar';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'btn btn-primary';
    confirmButton.textContent = 'Confirmar';

    actions.append(cancelButton, confirmButton);
    modal.append(title, inputWrap, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup(): void {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', onKeydown);
    }

    function confirm(): void {
      const value = input.value;
      cleanup();
      resolve(value || null);
    }

    function cancel(): void {
      cleanup();
      resolve(null);
    }

    function onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Enter') confirm();
      if (event.key === 'Escape') cancel();
    }

    cancelButton.addEventListener('click', cancel);
    confirmButton.addEventListener('click', confirm);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) cancel();
    });
    document.addEventListener('keydown', onKeydown);

    input.focus();
  });
}
