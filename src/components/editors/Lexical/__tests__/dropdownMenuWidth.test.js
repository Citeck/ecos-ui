import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

/**
 * The DOM DropdownPreview renders for a toolbar menu of the editor: the Lexical wrapper, then the
 * reactstrap menu carrying the generic `ecos-dropdown__menu_new` classes, then the `ul` of items.
 */
const toolbarMenu = () => {
  const wrapper = element('citeck-lexical-editor__dropdown');
  const menu = element('dropdown-menu show ecos-dropdown__menu ecos-dropdown__menu_new dropdown');
  const list = document.createElement('ul');

  wrapper.appendChild(menu);
  menu.appendChild(list);

  return { menu, list };
};

describe('Lexical toolbar dropdown menu width (COREDEV-455)', () => {
  let sheets;

  beforeAll(() => {
    sheets = [
      compileScss(path.join(ROOT, 'src/components/common/form/Dropdown/Dropdown.scss')),
      compileScss(path.join(ROOT, 'src/components/editors/Lexical/index.scss'))
    ];
  });

  it('the generic dropdown really caps a `_new` menu at 200px (the premise of the override below)', () => {
    const menu = element('dropdown-menu ecos-dropdown__menu ecos-dropdown__menu_new');

    expect(cascade(menu, sheets, 'max-width')).toBe('200px');
  });

  // The items of the toolbar menus are fixed-width buttons (`.item.wide` is 248px, plus 8px margins),
  // so a 200px cap on the menu leaves the shortcut column hanging outside the white container.
  it('lifts the cap from the menu and from its list so the menu sizes to its items', () => {
    const { menu, list } = toolbarMenu();

    expect(cascade(menu, sheets, 'max-width')).toBe('none');
    expect(cascade(list, sheets, 'max-width')).toBe('none');
  });

  it('keeps the item width that the menu now has to fit', () => {
    const { list } = toolbarMenu();
    const item = element('item wide', {}, 'button');

    list.appendChild(item);

    expect(cascade(item, sheets, 'width')).toBe('248px');
  });
});
