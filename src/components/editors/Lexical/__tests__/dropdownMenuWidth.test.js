import { render } from '@testing-library/react';
import path from 'path';
import React from 'react';

import { DropdownPreview } from '@/components/common/form';
import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

/** A toolbar menu the way BlockFormat / TextFormat / AlignFormat build it: fixed-width button items. */
const Item = ({ item, onClick }) => (
  <button className="item wide" onClick={() => onClick(item.value)}>
    <span className="text">{item.label}</span>
    <span className="shortcut">Ctrl+Alt+Q</span>
  </button>
);

const renderToolbarMenu = () => {
  const { container } = render(
    <DropdownPreview
      source={[{ value: 'quote', label: 'Quote' }]}
      valueField="value"
      titleField="label"
      CustomItem={Item}
      menuClassName="dropdown"
    />
  );
  const menu = container.querySelector('.citeck-lexical-editor__dropdown .dropdown-menu');

  return { menu, list: menu.querySelector('ul'), item: menu.querySelector('button.item.wide') };
};

describe('Lexical toolbar dropdown menu width (COREDEV-455)', () => {
  let sheets;

  beforeAll(() => {
    sheets = [
      compileScss(path.join(ROOT, 'src/components/common/form/Dropdown/Dropdown.scss')),
      compileScss(path.join(ROOT, 'src/components/editors/Lexical/index.scss'))
    ];
  });

  it('the generic dropdown really caps a `_new` menu at 200px (what the preview menu has to avoid)', () => {
    const menu = element('dropdown-menu ecos-dropdown__menu ecos-dropdown__menu_new');

    expect(cascade(menu, sheets, 'max-width')).toBe('200px');
  });

  // The items are 248px buttons (plus 8px margins); a capped menu leaves the shortcut column hanging
  // outside the white container.
  it('renders the preview menu without the text-row cap, so it sizes to its items', () => {
    const { menu, list, item } = renderToolbarMenu();

    expect(menu.classList.contains('ecos-dropdown__menu')).toBe(true);
    expect(menu.classList.contains('ecos-dropdown__menu_new')).toBe(false);
    expect(cascade(menu, sheets, 'max-width')).toBeNull();
    expect(cascade(list, sheets, 'max-width')).toBeNull();
    expect(cascade(item, sheets, 'width')).toBe('248px');
  });

  it('keeps the rest of the shared menu styling', () => {
    const { menu } = renderToolbarMenu();

    expect(menu.classList.contains('dropdown')).toBe(true);
    expect(cascade(menu, sheets, 'border-radius')).not.toBeNull();
  });
});
