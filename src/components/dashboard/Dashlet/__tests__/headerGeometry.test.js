import path from 'path';

import { ROOT, cascade, compileScss, element } from '@/testUtils/cssCascade';

const DASHLET_SCSS = path.join(ROOT, 'src/components/dashboard/Dashlet/Dashlet.scss');
const TREE_SCSS = path.join(ROOT, 'src/plugins/ecos-ui-hierarchical-tree-widget-plugin/Widget/style.scss');
const DOCLIB_PANEL_SCSS = path.join(ROOT, 'src/components/journals/Journals/DocLib/FolderTreePanel/FolderTreePanel.scss');
const DOCLIB_FILES_SCSS = path.join(ROOT, 'src/components/journals/Journals/DocLib/Files/FilesArea.scss');

/** `<div.dashlet> <div.dashlet__header-wrapper> <div.dashlet__header> <span.dashlet__caption>` */
const dashletHeader = ({ noCollapser = false } = {}) => {
  const dashlet = element('dashlet');
  const wrapper = element('ecos-panel__head dashlet__header-wrapper');
  const header = element('dashlet__header');
  const caption = element(`dashlet__caption${noCollapser ? ' dashlet__caption_no-collapser' : ''}`, {}, 'span');

  header.appendChild(caption);
  wrapper.appendChild(header);
  dashlet.appendChild(wrapper);

  return { wrapper, caption };
};

/** `<div.ecos-hierarchical-tree-widget> <div.ecos-hierarchical-tree-widget-header>` */
const treeHeader = () => {
  const widget = element('ecos-hierarchical-tree-widget');
  const header = element('ecos-hierarchical-tree-widget-header');

  widget.appendChild(header);

  return header;
};

/**
 * The declared `padding-<side>` of an element: the longhand when one is declared, otherwise the
 * side pulled out of the `padding` shorthand (both headers write their horizontal insets as a
 * shorthand, which `cascade` — a plain declaration lookup — does not expand on its own).
 */
const paddingSide = (el, sheets, side) => {
  const longhand = cascade(el, sheets, `padding-${side}`);

  if (longhand !== null) {
    return longhand;
  }

  const shorthand = cascade(el, sheets, 'padding');

  if (shorthand === null) {
    return null;
  }

  const [top, right = top, bottom = top, left = right] = shorthand.trim().split(/\s+/);

  return { top, right, bottom, left }[side];
};

/**
 * Every widget header must look like the same header. The tree widget (wiki "Categories") is the
 * only widget in the product that draws its own header instead of reusing `Dashlet`, and it drifted
 * to 46px next to the shared 36px — the wiki dashboard showed two visibly different header heights
 * side by side (COREDEV-482). The geometry now comes from the shared constants in
 * `styles/constants.scss`, and this test is what keeps the two headers from drifting apart again.
 */
describe('widget header geometry is shared between the dashlet header and the tree widget header', () => {
  let dashletCss;
  let treeCss;

  beforeAll(() => {
    dashletCss = compileScss(DASHLET_SCSS);
    treeCss = compileScss(TREE_SCSS);
  });

  it('both headers are the same height', () => {
    const { wrapper } = dashletHeader();
    const dashletHeight = cascade(wrapper, [dashletCss], 'height');

    expect(dashletHeight).toMatch(/^\d+(\.\d+)?px$/);
    expect(cascade(treeHeader(), [treeCss], 'height')).toBe(dashletHeight);
  });

  it('the tree header counts its bottom border inside that height', () => {
    expect(cascade(treeHeader(), [treeCss], 'box-sizing')).toBe('border-box');
  });

  it('both headers keep their action icons on the same right inset', () => {
    const { wrapper } = dashletHeader();
    const dashletRight = paddingSide(wrapper, [dashletCss], 'right');

    expect(dashletRight).toMatch(/^\d+(\.\d+)?px$/);
    expect(paddingSide(treeHeader(), [treeCss], 'right')).toBe(dashletRight);
  });

  it('the tree caption starts where a non-collapsible dashlet caption starts', () => {
    const { wrapper, caption } = dashletHeader({ noCollapser: true });
    const px = value => parseFloat(value);

    const expected = px(paddingSide(wrapper, [dashletCss], 'left')) + px(cascade(caption, [dashletCss], 'padding-left'));

    expect(expected).toBeGreaterThan(0);
    expect(px(paddingSide(treeHeader(), [treeCss], 'left'))).toBe(expected);
  });

  it('a collapsible dashlet caption gets no extra inset — the chevron already fills it', () => {
    const { caption } = dashletHeader();

    expect(cascade(caption, [dashletCss], 'padding-left')).toBeNull();
  });

  it('the tree action icons keep the shared gap and the shared 1px lift (as margins, not a transform)', () => {
    const actions = element('ecos-hierarchical-tree-widget__structure-actions');
    const widget = element('ecos-hierarchical-tree-widget');

    widget.appendChild(actions);

    // `.dashlet__header-actions > :nth-child(n) { margin-left: 5px }` — same optical spacing
    expect(cascade(actions, [treeCss], 'gap')).toBe('5px');
    // see the comment on `.dashlet__header-actions`: a transform would trap dropdowns (COREDEV-468)
    expect(cascade(actions, [treeCss], 'transform')).toBeNull();
    expect(cascade(actions, [treeCss], 'margin-top')).toBe('-1px');
    expect(cascade(actions, [treeCss], 'margin-bottom')).toBe('1px');
  });

  it('the tree title has the same line box as the dashlet caption (inherited line-height, 1px border)', () => {
    const { caption } = dashletHeader({ noCollapser: true });
    const header = treeHeader();
    const title = element('', {}, 'h4');

    header.appendChild(title);

    // the caption declares no line-height of its own — it inherits the body's; the <h4> must not
    // keep bootstrap's heading line-height, or its text sits 1px lower than the caption next to it
    expect(cascade(caption, [dashletCss], 'line-height')).toBeNull();
    expect(cascade(title, [treeCss], 'line-height')).toBe('inherit');
    expect(cascade(title, [treeCss], 'border')).toBe(cascade(caption, [dashletCss], 'border'));
    expect(cascade(title, [treeCss], 'font-size')).toBe(cascade(caption, [dashletCss], 'font-size'));
  });

  it('a tree action button centres its glyph like the shared header button does', () => {
    const btn = element('ecos-hierarchical-tree-widget__structure-actions_btn');
    const actions = element('ecos-hierarchical-tree-widget__structure-actions');
    const widget = element('ecos-hierarchical-tree-widget');

    actions.appendChild(btn);
    widget.appendChild(actions);

    expect(cascade(btn, [treeCss], 'display')).toBe('inline-flex');
    expect(cascade(btn, [treeCss], 'align-items')).toBe('center');
  });

  /**
   * The document library draws two more headers of its own — the folder panel caption and the file
   * list column head — inside panels that stand next to widgets on the same page. They were 47px and
   * 40px against the shared 36px (COREDEV-355, QA p. 12), so they join the rule here.
   */
  describe('the document library headers', () => {
    let panelCss;
    let filesCss;

    beforeAll(() => {
      panelCss = compileScss(DOCLIB_PANEL_SCSS);
      filesCss = compileScss(DOCLIB_FILES_SCSS);
    });

    /** `<div.citeck-doclib-panel> <div.citeck-doclib-panel__header>` */
    const folderPanelHeader = () => {
      const panel = element('citeck-doclib-panel');
      const header = element('citeck-doclib-panel__header');

      panel.appendChild(header);

      return header;
    };

    /** `<div.citeck-doclib-files.citeck-doclib-files_list> <div.citeck-doclib-files__head>` */
    const fileListHead = () => {
      const files = element('citeck-doclib-files citeck-doclib-files_list');
      const head = element('citeck-doclib-files__head');

      files.appendChild(head);

      return head;
    };

    it.each([
      ['the folder panel header', () => [folderPanelHeader(), panelCss]],
      ['the file list column head', () => [fileListHead(), filesCss]]
    ])('%s is as high as a widget header', (_name, subject) => {
      const [header, css] = subject();
      const { wrapper } = dashletHeader();
      const dashletHeight = cascade(wrapper, [dashletCss], 'height');

      expect(dashletHeight).toMatch(/^\d+(\.\d+)?px$/);
      expect(cascade(header, [css], 'height')).toBe(dashletHeight);
    });

    it.each([
      ['the folder panel header', () => [folderPanelHeader(), panelCss]],
      ['the file list column head', () => [fileListHead(), filesCss]]
    ])('%s counts its bottom border inside that height', (_name, subject) => {
      const [header, css] = subject();

      expect(cascade(header, [css], 'box-sizing')).toBe('border-box');
    });

    // Both headers sit inside a 1px panel border, so that border cancels out: the title must land on
    // the same 17px from the outer edge. What the shared header spends on the caption's own padding
    // and transparent border, the doclib header spends on the padding of the header itself.
    it('the folder panel title starts where a widget caption starts', () => {
      const { wrapper, caption } = dashletHeader({ noCollapser: true });
      const px = value => parseFloat(value);
      const captionBorder = px(cascade(caption, [dashletCss], 'border'));

      const expected = px(paddingSide(wrapper, [dashletCss], 'left')) + px(cascade(caption, [dashletCss], 'padding-left')) + captionBorder;

      expect(expected).toBeGreaterThan(0);
      expect(px(paddingSide(folderPanelHeader(), [panelCss], 'left'))).toBe(expected);
    });

    it('the folder panel title has no line-height of its own to push the header', () => {
      const title = element('citeck-doclib-panel__title', {}, 'span');
      const lineHeight = cascade(title, [panelCss], 'line-height');

      expect(lineHeight === null || lineHeight === 'inherit').toBe(true);
    });
  });
});
