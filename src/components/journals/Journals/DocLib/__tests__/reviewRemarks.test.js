import { render } from '@testing-library/react';
import path from 'path';
import postcss from 'postcss';
import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import FolderTreeNode from '@/components/journals/Journals/DocLib/FolderTreePanel/FolderTreeNode';
import FolderTreePanel from '@/components/journals/Journals/DocLib/FolderTreePanel/FolderTreePanel';
import DocLibToolbar from '@/components/journals/Journals/DocLib/Toolbar/DocLibToolbar';
import { DISPLAY_MODES } from '@/components/journals/Journals/DocLib/constants';
import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const DOCLIB = 'src/components/journals/Journals/DocLib';
const TREE_SCSS = path.join(ROOT, DOCLIB, 'FolderTreePanel/FolderTreePanel.scss');
const FILES_SCSS = path.join(ROOT, DOCLIB, 'Files/FilesArea.scss');
const TOOLBAR_SCSS = path.join(ROOT, DOCLIB, 'Toolbar/DocLibToolbar.scss');
const DROPDOWN_SCSS = path.join(ROOT, 'src/components/common/form/Dropdown/Dropdown.scss');
const BTN_SCSS = path.join(ROOT, 'src/components/common/btns/Btn/Btn.scss');
const GRID_SCSS = path.join(ROOT, 'src/components/common/grid/Grid/Grid.scss');
const HEADER_FORMATTER_SCSS = path.join(ROOT, 'src/components/common/grid/formatters/header/HeaderFormatter/HeaderFormatter.scss');

// The toolbar only needs its own markup here: the search field and the tooltips carry no styles of
// this test's concern, and ViewTabs / the create dialog drag in the journals store and the records
// API. The create button itself (IcoBtn) stays real — it is what is under test.
jest.mock('@/components/common', () => ({
  Search: () => null,
  Tooltip: ({ children }) => children
}));
jest.mock('@/components/journals/Journals/ViewTabs', () => () => null);
jest.mock('@/components/journals/Journals/DocLib/hooks/useCreateDialog', () => ({
  useCreateDialog: () => ({ openCreateForm: () => {} })
}));

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
  let headerFormatterCss;

  beforeAll(() => {
    treeCss = compileScss(TREE_SCSS);
    filesCss = compileScss(FILES_SCSS);
    toolbarCss = compileScss(TOOLBAR_SCSS);
    dropdownCss = compileScss(DROPDOWN_SCSS);
    btnCss = compileScss(BTN_SCSS);
    gridCss = compileScss(GRID_SCSS);
    headerFormatterCss = compileScss(HEADER_FORMATTER_SCSS);
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

  describe('p. 1 (re-check): the toolbar create button is a plain plus', () => {
    const STATE_ID = '[page-tab-1]-[news-journal]-[ws]';
    const toolbar = () => {
      const store = createStore(state => state, {
        documentLibrary: { [STATE_ID]: { createVariants: [{ key: 'file', name: 'File' }], searchText: '' } }
      });

      return render(
        <Provider store={store}>
          <DocLibToolbar stateId={STATE_ID} isMobile={false} displayMode={DISPLAY_MODES.LIST} setDisplayMode={() => {}} />
        </Provider>
      ).container;
    };

    it('carries the glyph alone and keeps the caption as its label', () => {
      const btn = toolbar().querySelector('.citeck-doclib-toolbar__create-btn');

      expect(btn).not.toBeNull();
      expect(btn.querySelector('.ecos-btn__i')).not.toBeNull();
      expect(btn.querySelector('.ecos-btn__text')).toBeNull();
      expect(btn.textContent).toBe('');
      expect(btn.getAttribute('title')).toBeTruthy();
      expect(btn.getAttribute('aria-label')).toBe(btn.getAttribute('title'));
    });

    it('is a square of the toolbar button height, on desktop as on mobile', () => {
      const btn = element('ecos-btn citeck-doclib-toolbar__create-btn', {}, 'button');
      const mobile = element('ecos-btn citeck-doclib-toolbar__create-btn citeck-doclib-toolbar__create-btn_mobile', {}, 'button');
      const sheets = [btnCss, toolbarCss];

      expect(cascade(btn, sheets, 'width')).toBe(cascade(btn, sheets, 'height'));
      expect(cascade(btn, sheets, 'padding')).toBe('0');
      expect(cascade(mobile, sheets, 'padding')).toBe(cascade(btn, sheets, 'padding'));
    });

    it('the empty folder keeps its call to action captioned', () => {
      const cta = element('ecos-btn citeck-doclib-empty__create-btn', {}, 'button');

      expect(cascade(cta, [filesCss], 'width')).toBeNull();
      expect(horizontalPadding(cascade(cta, [filesCss], 'padding'))).not.toBe('0');
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

    // re-check: the chevron used to answer the hover with a 24x24 grey square, which reads as a
    // second control next to the tree rows; it answers with its color only, like the tree toggle
    it('the collapse chevron answers a hover with its color, not with a grey square', () => {
      const btnHover = declarationsOf(treeCss, '.citeck-doclib-panel__collapse-btn:hover');
      const toggleHover = declarationsOf(treeCss, '.citeck-doclib-tree__toggle:hover');

      expect(btnHover.background).toBeUndefined();
      expect(btnHover['background-color']).toBeUndefined();
      expect(btnHover.color).toBe(toggleHover.color);
    });
  });

  describe('9 (re-check). the folder tree highlights like the file list', () => {
    /** `<div.citeck-doclib-tree__row[.…_selected]> <i.citeck-doclib-tree__folder-icon>` */
    const treeRow = ({ selected = false } = {}) => {
      const row = element(`citeck-doclib-tree__row${selected ? ' citeck-doclib-tree__row_selected' : ''}`);
      const icon = element('citeck-doclib-tree__folder-icon', {}, 'i');

      row.appendChild(icon);

      return { row, icon };
    };

    it('a hovered folder draws the file list lines and no fill', () => {
      const treeHover = declarationsOf(treeCss, '.citeck-doclib-tree__row:hover');
      const listHover = declarationsOf(filesCss, '.citeck-doclib-files__row:hover');

      expect(listHover['box-shadow']).toBeTruthy();
      expect(treeHover['box-shadow']).toBe(listHover['box-shadow']);
      expect(treeHover.background).toBeUndefined();
      expect(treeHover['background-color']).toBeUndefined();
    });

    it('a selected folder fills with the journal selection color, like a list row', () => {
      const { row } = treeRow({ selected: true });
      const listRow = element('citeck-doclib-files__row citeck-doclib-files__row_selected');
      const journalRow = journalSelectedRow();

      expect(cascade(row, [treeCss], 'background')).toBe(cascade(journalRow, [gridCss], 'background'));
      expect(cascade(row, [treeCss], 'background')).toBe(cascade(listRow, [filesCss], 'background'));
    });

    // the hover no longer declares a background, so the yellow of a selected row survives a hover
    // and only the lines are added on top of it
    it('the selection survives a hover', () => {
      expect(declarationsOf(treeCss, '.citeck-doclib-tree__row:hover').background).toBeUndefined();
      expect(declarationsOf(treeCss, '.citeck-doclib-tree__row_selected:hover').background).toBeUndefined();
    });

    it('a selected folder keeps the plain text and folder icon colors', () => {
      const selected = treeRow({ selected: true });
      const plain = treeRow();

      expect(cascade(selected.row, [treeCss], 'color')).toBe(cascade(plain.row, [treeCss], 'color'));
      expect(cascade(selected.icon, [treeCss], 'color')).toBe(cascade(plain.icon, [treeCss], 'color'));
    });
  });

  // QA return of 2026-09-09: the colors were right, but the highlight was a rounded box stopping
  // 8px short of the panel border on both sides — the 8px horizontal padding of the panel body plus
  // the row's own radius. A list row and a journal row light up from border to border, square.
  describe('9 (return of 2026-09-09). the tree highlight runs from border to border', () => {
    const treeItem = (id, extra) => ({ id, title: id, hasChildren: false, isUnfolded: false, isChildrenLoading: false, ...extra });

    const renderNode = level =>
      render(
        <FolderTreeNode
          item={treeItem(`folder-${level}`)}
          level={level}
          isSelected={false}
          onSelect={() => {}}
          onUnfold={() => {}}
          onFold={() => {}}
        />
      ).container.querySelector('.citeck-doclib-tree__row');

    it('the tree row is square, like a list row', () => {
      const row = element('citeck-doclib-tree__row');
      const listRow = element('citeck-doclib-files__row');

      expect(cascade(listRow, [filesCss], 'border-radius')).toBeNull();
      expect(cascade(row, [treeCss], 'border-radius')).toBeNull();
      expect(declarationsOf(treeCss, '.citeck-doclib-tree__row')['border-radius']).toBeUndefined();
    });

    it('the panel body has no horizontal padding, the same as the file area', () => {
      const bodyPadding = declarationsOf(treeCss, '.citeck-doclib-panel__body').padding;
      const areaPadding = declarationsOf(filesCss, '.citeck-doclib-files-area').padding;

      expect(horizontalPadding(areaPadding)).toBe('0');
      expect(horizontalPadding(bodyPadding)).toBe(horizontalPadding(areaPadding));
    });

    it('the row itself carries the inset, at every level', () => {
      expect(renderNode(0).style.paddingLeft).toBe('16px');
      expect(renderNode(1).style.paddingLeft).toBe('32px');
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

    // re-check: the opaque backing used to span the full row height and paint over the 1px hover
    // lines at its right end — the journal insets its own inline tools by the same 1px
    // (`.ecos-inline-tools-actions`: `margin-top: 2px; height: calc(40px - 2px)`)
    it('the row action backing stays inside the hover lines', () => {
      const actions = element('citeck-doclib-files__row-actions');

      expect(cascade(actions, [filesCss], 'top')).toBe('1px');
      expect(cascade(actions, [filesCss], 'height')).toBe('calc(100% - 2px)');
      expect(cascade(actions, [filesCss], 'right')).toBe('0');
    });

    it('the tile action strip is untouched by that inset — it is in flow', () => {
      const cardActions = element('citeck-doclib-files__card-actions');

      expect(cascade(cardActions, [filesCss], 'top')).toBeNull();
      expect(cascade(cardActions, [filesCss], 'height')).toBeNull();
    });
  });

  describe('11. the list column head reads like a journal column head', () => {
    it('the head has the size of .ecos-th, not a hardcoded one of its own', () => {
      const head = element('citeck-doclib-files__head');
      const th = element('ecos-th');

      expect(cascade(th, [headerFormatterCss], 'font-size')).toBeTruthy();
      expect(cascade(head, [filesCss], 'font-size')).toBe(cascade(th, [headerFormatterCss], 'font-size'));
      expect(cascade(head, [filesCss], 'font-weight')).toBe(cascade(th, [headerFormatterCss], 'font-weight'));
    });
  });
});
