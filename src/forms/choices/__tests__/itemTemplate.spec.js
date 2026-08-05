import Choices from '../index';

import { t } from '@/helpers/util';

/**
 * D-B-8: choices.js 8.0.0 hardcodes the English "Remove item" in its item template — its own source
 * marks it as a TODO and offers no option for it. The patch lives on the shared module every
 * component imports the library through, so a `new Choices(...)` anywhere gets the localized label;
 * it used to be copy-pasted into two components and any third call site silently got English back.
 */
describe('Choices item template', () => {
  const classNames = {
    item: 'choices__item',
    button: 'choices__button',
    highlightedState: 'is-highlighted',
    itemSelectable: 'choices__item--selectable',
    placeholder: 'choices__placeholder'
  };

  const renderItem = (data, removeItemButton = true) =>
    Choices.defaults.templates.item.call(null, classNames, { active: true, disabled: false, ...data }, removeItemButton);

  it('localizes the remove button label and its accessible name', () => {
    const element = renderItem({ id: 1, value: 'Договор', label: 'Договор', choiceId: 1, groupId: -1 });
    const button = element.querySelector('[data-button]');
    const label = t('select.remove-item');

    expect(button.textContent).toBe(label);
    expect(button.textContent).not.toBe('Remove item');
    expect(button.getAttribute('aria-label')).toBe(`${label}: 'Договор'`);
  });

  it('names an object value by its label instead of printing [object Object]', () => {
    // EcosSelect compares values with `_.isEqual` precisely because they can be objects
    const element = renderItem({
      id: 2,
      value: { id: 'emodel/type@contract', disp: 'Договор' },
      label: '<span class="tag">Договор</span>',
      choiceId: 2,
      groupId: -1
    });
    const ariaLabel = element.querySelector('[data-button]').getAttribute('aria-label');

    expect(ariaLabel).not.toContain('[object Object]');
    expect(ariaLabel).toBe(`${t('select.remove-item')}: 'Договор'`);
  });

  it('falls back to the bare label when no name can be derived', () => {
    const element = renderItem({ id: 3, value: {}, label: '', choiceId: 3, groupId: -1 });

    expect(element.querySelector('[data-button]').getAttribute('aria-label')).toBe(t('select.remove-item'));
  });

  it('renders no button at all when the item is not removable', () => {
    const element = renderItem({ id: 4, value: 'Договор', label: 'Договор', choiceId: 4, groupId: -1 }, false);

    expect(element.querySelector('[data-button]')).toBeNull();
  });
});
