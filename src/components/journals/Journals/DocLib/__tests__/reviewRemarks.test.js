import { render } from '@testing-library/react';
import path from 'path';
import postcss from 'postcss';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import FolderTreePanel from '@/components/journals/Journals/DocLib/FolderTreePanel/FolderTreePanel';
import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const DOCLIB = 'src/components/journals/Journals/DocLib';
const TREE_SCSS = path.join(ROOT, DOCLIB, 'FolderTreePanel/FolderTreePanel.scss');
const FILES_SCSS = path.join(ROOT, DOCLIB, 'Files/FilesArea.scss');
const TOOLBAR_SCSS = path.join(ROOT, DOCLIB, 'Toolbar/DocLibToolbar.scss');
const DROPDOWN_SCSS = path.join(ROOT, 'src/components/common/form/Dropdown/Dropdown.scss');
const BTN_SCSS = path.join(ROOT, 'src/components/common/btns/Btn/Btn.scss');
const GRID_SCSS = path.join(ROOT, 'src/components/common/grid/Grid/Grid.scss');

/** Declarations of every rule with a selector ending in `selector` (nesting prefixes ignored). */
const declarationsOf = (css, selector) => {
  const found = {};

  postcss.parse(css).walkRules(rule => {
    if (rule.selectors.some(s => s.endsWith(selector))) {
      rule.walkDecls(decl => {
        found[decl.prop] = decl.value;
      });
    }
  });

  return found;
};

/** `<div.ecos-grid> <tr.ecos-grid__row.ecos-grid__tr_selected>` — a selected journal table row. */
const journalSelectedRow = () => {
  const grid = element('ecos-grid');
  const row = element('ecos-grid__row ecos-grid__row_new ecos-grid__tr_selected', {}, 'tr');

  grid.appendChild(row);

  return row;
};

/** The horizontal component of a `padding` shorthand ('8px 0' → '0', '0 12px' → '12px'). */
const horizontalPadding = shorthand => {
  const parts = String(shorthand).trim().split(/\s+/);

  return parts.length === 1 ? parts[0] : parts[1];
};

/**
 * Review remarks on the rewritten document library (COREDEV-355, the QA comment): the create menu
 * type is tiny, the left tile touches the border, the tile action bar spills over the tile on a
 * white pill, the collapsed folder panel grows a vertical title and lights up on hover, and rows
 * highlight in a blue that is neither the journal's hover nor its selection.
 */
describe('doclib review remarks (COREDEV-355)', () => {
  let treeCss;
  let filesCss;
  let toolbarCss;
  let dropdownCss;
  let btnCss;
  let gridCss;

  beforeAll(() => {
    treeCss = compileScss(TREE_SCSS);
    filesCss = compileScss(FILES_SCSS);
    toolbarCss = compileScss(TOOLBAR_SCSS);
    dropdownCss = compileScss(DROPDOWN_SCSS);
    btnCss = compileScss(BTN_SCSS);
    gridCss = compileScss(GRID_SCSS);
  });

  describe('1. the create menu reads at the library type size', () => {
    /** `<div.ecos-dropdown__menu.ecos-dropdown__menu_new[.extra]> <ul> <li>` — an open Dropdown menu. */
    const menuItem = extra => {
      const menu = element(`ecos-dropdown__menu ecos-dropdown__menu_new dropdown-menu show ${extra || ''}`);
      const ul = element('', {}, 'ul');
      const li = element('', {}, 'li');

      ul.appendChild(li);
      menu.appendChild(ul);

      return li;
    };

    it('a plain Dropdown menu item is smaller than a tree row (the premise)', () => {
      const li = menuItem();
      const row = element('citeck-doclib-tree__row');

      expect(cascade(li, [dropdownCss], 'font-size')).toBeTruthy();
      expect(cascade(li, [dropdownCss], 'font-size')).not.toBe(cascade(row, [treeCss], 'font-size'));
    });

    it('the doclib create menu item reads like a tree row', () => {
      const li = menuItem('citeck-doclib-toolbar__create-menu');
      const row = element('citeck-doclib-tree__row');

      expect(cascade(li, [dropdownCss, toolbarCss], 'font-size')).toBe(cascade(row, [treeCss], 'font-size'));
    });
  });

  describe('6. the tile grid keeps the list inset from the area border', () => {
    it('the grid has the horizontal padding of a list row', () => {
      const grid = element('citeck-doclib-files citeck-doclib-files_grid');
      const row = element('citeck-doclib-files__row');
      const rowInset = horizontalPadding(cascade(row, [filesCss], 'padding'));

      expect(rowInset).not.toBe('0');
      expect(horizontalPadding(cascade(grid, [filesCss], 'padding'))).toBe(rowInset);
    });
  });

  describe('7. tile actions sit in a strip of the tile instead of floating over it', () => {
    it('the action bar is laid out in flow, without a backing of its own', () => {
      const actions = element('citeck-doclib-files__card-actions');

      expect(cascade(actions, [filesCss], 'position')).not.toBe('absolute');
      expect(cascade(actions, [filesCss], 'background')).toBeNull();
      expect(cascade(actions, [filesCss], 'background-color')).toBeNull();
    });

    it('the action bar is inset from the tile edges', () => {
      const actions = element('citeck-doclib-files__card-actions');

      expect(horizontalPadding(cascade(actions, [filesCss], 'padding'))).not.toBe('0');
    });

    it('eight inline actions fit the narrowest tile', () => {
      const card = element('citeck-doclib-files__card');
      const actions = element('citeck-doclib-files__card-actions');
      const btn = element('ecos-btn ecos-inline-tools-btn ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10', {}, 'button');

      actions.appendChild(btn);
      card.appendChild(actions);

      const sheets = [btnCss, filesCss];
      // a citeck glyph button paints about 2px wider than its font size (16px → 18px in the list row)
      const buttonWidth = parseInt(cascade(btn, sheets, 'font-size'), 10) + 2 + (parseInt(cascade(btn, sheets, 'margin-right'), 10) || 0);
      const gap = parseInt(cascade(actions, sheets, 'gap'), 10) || 0;
      const inset = parseInt(horizontalPadding(cascade(actions, sheets, 'padding')), 10) || 0;
      const narrowest = parseInt(
        cascade(element('citeck-doclib-files citeck-doclib-files_grid'), sheets, 'grid-template-columns').match(/minmax\((\d+)px/)[1],
        10
      );

      expect(8 * buttonWidth + 7 * gap + 2 * inset).toBeLessThanOrEqual(narrowest);
    });
  });

  describe('9. the collapsed folder panel is a plain strip', () => {
    const STATE_ID = '[page-tab-1]-[news-journal]-[ws]';
    const store = createStore(state => state, {
      documentLibrary: { [STATE_ID]: { sidebar: { isReady: true, hasError: false, items: [] }, folderId: null } }
    });

    it('renders the expand control and no vertical title', () => {
      const { container } = render(
        <Provider store={store}>
          <FolderTreePanel stateId={STATE_ID} isMobile={false} isCollapsed onToggleCollapsed={() => {}} />
        </Provider>
      );

      expect(container.querySelector('.citeck-doclib-panel_collapsed')).not.toBeNull();
      expect(container.querySelector('.citeck-doclib-panel__collapse-btn')).not.toBeNull();
      expect(container.querySelector('.citeck-doclib-panel__collapsed-title')).toBeNull();
      expect(container.textContent).toBe('');
    });

    it('does not light up on hover', () => {
      expect(declarationsOf(treeCss, '.citeck-doclib-panel_collapsed:hover')).toEqual({});
    });
  });

  describe('10. rows and tiles highlight like journal rows', () => {
    it('a journal row hover draws lines and a selection fills yellow (the premise)', () => {
      const hover = declarationsOf(gridCss, '.ecos-grid__row:hover td');
      const selected = journalSelectedRow();

      expect(hover['border-top-color']).toBeTruthy();
      expect(cascade(selected, [gridCss], 'background')).toBeTruthy();
    });

    it('a hovered row draws the journal lines and keeps its background', () => {
      const lineColor = declarationsOf(gridCss, '.ecos-grid__row:hover td')['border-top-color'];
      const hover = declarationsOf(filesCss, '.citeck-doclib-files__row:hover');

      expect(hover['box-shadow']).toContain(lineColor);
      expect(hover.background).toBeUndefined();
      expect(hover['background-color']).toBeUndefined();
    });

    it('a selected row fills with the journal selection color', () => {
      const row = element('citeck-doclib-files__row citeck-doclib-files__row_selected');
      const journalRow = journalSelectedRow();

      expect(cascade(row, [filesCss], 'background')).toBe(cascade(journalRow, [gridCss], 'background'));
    });

    it('the row action backing follows the selection color', () => {
      const row = element('citeck-doclib-files__row citeck-doclib-files__row_selected');
      const actions = element('citeck-doclib-files__row-actions');
      const journalRow = journalSelectedRow();

      row.appendChild(actions);

      expect(cascade(actions, [filesCss], 'background')).toContain(cascade(journalRow, [gridCss], 'background'));
    });

    it('a selected tile fills with the journal selection color too', () => {
      const card = element('citeck-doclib-files__card citeck-doclib-files__card_selected');
      const journalRow = journalSelectedRow();

      expect(cascade(card, [filesCss], 'background')).toBe(cascade(journalRow, [gridCss], 'background'));
    });
  });
});
