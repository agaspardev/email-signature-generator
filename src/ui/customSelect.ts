export interface SelectItem {
  value: string;
  label: string;
}

export interface CustomSelect {
  element: HTMLElement;
  readonly value: string;
}

/**
 * A styled dropdown replacing native `<select>` — browsers don't let CSS
 * reach the native option-list popup (it's OS chrome), so a `<select>`
 * always looks inconsistent once opened, no matter how the closed box is
 * styled. This is a plain button + absolutely-positioned option list instead.
 */
export function createCustomSelect(
  items: SelectItem[],
  initialValue: string,
  onChange: (value: string) => void,
): CustomSelect {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';

  const triggerLabel = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'custom-select-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.append(triggerLabel, chevron);

  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  menu.hidden = true;

  let currentValue = initialValue;

  function renderMenu(): void {
    menu.innerHTML = '';
    items.forEach((item) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className =
        item.value === currentValue ? 'custom-select-option selected' : 'custom-select-option';
      option.textContent = item.label;
      option.addEventListener('click', () => {
        currentValue = item.value;
        triggerLabel.textContent = item.label;
        closeMenu();
        onChange(currentValue);
      });
      menu.appendChild(option);
    });
  }

  function onOutsideClick(event: MouseEvent): void {
    if (!wrapper.contains(event.target as Node)) closeMenu();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') closeMenu();
  }

  function openMenu(): void {
    renderMenu();
    menu.hidden = false;
    wrapper.classList.add('open');
    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeydown);
  }

  function closeMenu(): void {
    menu.hidden = true;
    wrapper.classList.remove('open');
    document.removeEventListener('click', onOutsideClick);
    document.removeEventListener('keydown', onKeydown);
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  triggerLabel.textContent = items.find((item) => item.value === initialValue)?.label ?? '';
  wrapper.append(trigger, menu);

  return {
    element: wrapper,
    get value() {
      return currentValue;
    },
  };
}
