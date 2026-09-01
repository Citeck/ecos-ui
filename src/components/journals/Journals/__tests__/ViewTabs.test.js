// `@/components/common` (Tooltip) ends at `Orgstruct.jsx`, which calls `new OrgStructApi()` at
// module scope inside an import cycle. Stubbing that leaf keeps the cycle harmless here.
jest.mock('@/components/common/Orgstruct', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/form/SelectOrgstruct', () => ({ __esModule: true, default: () => null }));

import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import Folder from '@/components/common/icons/Folder';
import HierarchyTree from '@/components/common/icons/HierarchyTree';
import Kanban from '@/components/common/icons/Kanban';
import List from '@/components/common/icons/List';
import PreviewList from '@/components/common/icons/PreviewList';
import WidgetsPreview from '@/components/common/icons/WidgetsPreview';
import ViewTabs, { VIEW_TAB_ICON_BOX } from '@/components/journals/Journals/ViewTabs';

const STATE_ID = 'journal-state';

const storeWithEveryViewMode = () =>
  configureStore([])({
    view: { isMobile: false },
    journals: { [STATE_ID]: { viewMode: 'table', url: {}, widgetsConfig: {} } },
    documentLibrary: { [STATE_ID]: { isEnabled: true } },
    kanban: { [STATE_ID]: { isEnabled: true } },
    previewList: { [STATE_ID]: { isEnabled: true } },
    hierarchy: { [STATE_ID]: { isEnabled: true } }
  });

const renderTabs = () => {
  const { container } = render(
    <Provider store={storeWithEveryViewMode()}>
      <ViewTabs stateId={STATE_ID} />
    </Provider>
  );

  return container;
};

/**
 * The union of the icon's painted shapes, in viewBox units — what the eye sees as "the icon".
 * Only the two transform forms the icons use are supported.
 */
const inkBox = svg => {
  const move = (transform, [x, y]) => {
    const rotate = /^rotate\(\s*-90\s+([\d.-]+)\s+([\d.-]+)\s*\)$/.exec(transform);

    if (rotate) {
      const [cx, cy] = [Number(rotate[1]), Number(rotate[2])];

      return [cx + (y - cy), cy - (x - cx)];
    }

    const matrix = /^matrix\(\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\)$/.exec(transform);

    if (matrix) {
      const [a, b, c, d, e, f] = matrix.slice(1).map(Number);

      return [a * x + c * y + e, b * x + d * y + f];
    }

    throw new Error(`unsupported transform: ${transform}`);
  };

  const points = [...svg.querySelectorAll('rect')].flatMap(rect => {
    const [x, y] = [Number(rect.getAttribute('x') || 0), Number(rect.getAttribute('y') || 0)];
    const [width, height] = [Number(rect.getAttribute('width')), Number(rect.getAttribute('height'))];
    const transform = rect.getAttribute('transform');
    const corners = [
      [x, y],
      [x + width, y],
      [x, y + height],
      [x + width, y + height]
    ];

    return transform ? corners.map(corner => move(transform, corner)) : corners;
  });

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);

  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
};

const viewBoxOf = svg =>
  svg
    .getAttribute('viewBox')
    .split(/[\s,]+/)
    .map(Number);

const renderIcon = Icon => render(<Icon />).container.querySelector('svg');

describe('journal view tabs: icon sizes (COREDEV-349)', () => {
  // The bug: every icon was sized on its own — 18x18, 18x20, 24x24 — so the row was visibly ragged.
  it('should draw every view-mode icon into the same box', () => {
    const svgs = [...renderTabs().querySelectorAll('.ecos-journal__view-tabs svg')];

    expect(svgs).toHaveLength(6);

    svgs.forEach(svg => {
      expect(svg.getAttribute('width')).toBe(String(VIEW_TAB_ICON_BOX.width));
      expect(svg.getAttribute('height')).toBe(String(VIEW_TAB_ICON_BOX.height));
    });
  });

  it('should render a button for every enabled view mode', () => {
    expect(renderTabs().querySelectorAll('.ecos-journal__view-tabs-btn')).toHaveLength(6);
  });

  // The `citeck` font glyphs (icon-list, icon-kanban, icon-folder) are all replaced by SVGs: a
  // glyph's ink sits on fractional pixels of its em box and the browser snaps text to whole-pixel
  // positions, so a glyph can never cover the same pixel rows as the SVG icons beside it — the SVGs
  // read as sitting a quarter-pixel lower however the glyph was nudged.
  it('should not draw any view-mode icon with a font glyph', () => {
    expect(renderTabs().querySelector('.ecos-journal__view-tabs i')).toBeNull();
  });

  // A box only means something when the drawing fills it: a viewBox wider than the ink shrinks the
  // icon by the padding baked into it. That is how the hierarchy icon ended up a quarter smaller
  // than its neighbours while asking for the same 18px.
  it.each([
    ['Folder', Folder],
    ['PreviewList', PreviewList],
    ['WidgetsPreview', WidgetsPreview]
  ])('should crop the %s viewBox to its ink', (_, Icon) => {
    const svg = renderIcon(Icon);

    inkBox(svg).forEach((value, index) => expect(value).toBeCloseTo(viewBoxOf(svg)[index], 2));
  });

  // Only the height of the shared box is what lines the row up; stretching the tree's ink to the
  // box's full 20-unit width made a naturally vertical shape wider than tall, which reads as
  // horizontally stretched (the second round of COREDEV-349). These icons keep their natural width
  // instead: the ink must fill the box's height, stay at most as wide as it is tall, sit inside the
  // box with at least a unit of padding on each side, and keep every edge on whole viewBox units.
  it.each([
    ['List', List],
    ['HierarchyTree', HierarchyTree],
    ['Kanban', Kanban]
  ])('should fill the box height with the %s ink but keep its natural width', (_, Icon) => {
    const svg = renderIcon(Icon);
    const [inkX, inkY, inkWidth, inkHeight] = inkBox(svg);
    const [boxX, boxY, boxWidth, boxHeight] = viewBoxOf(svg);

    expect(inkY).toBe(boxY);
    expect(inkHeight).toBe(boxHeight);
    expect(inkWidth).toBeLessThanOrEqual(inkHeight);
    expect(inkX).toBeGreaterThanOrEqual(boxX + 1);
    expect(inkX + inkWidth).toBeLessThanOrEqual(boxX + boxWidth - 1);
    [inkX, inkWidth].forEach(value => expect(Number.isInteger(value)).toBe(true));
  });

  it('should mirror WidgetsPreview inside the same viewBox', () => {
    const svg = render(<WidgetsPreview isLeft />).container.querySelector('svg');
    const [x, y, width, height] = inkBox(svg);
    const [boxX, boxY, boxWidth, boxHeight] = viewBoxOf(svg);

    expect(x).toBeGreaterThanOrEqual(boxX);
    expect(y).toBeGreaterThanOrEqual(boxY);
    expect(x + width).toBeLessThanOrEqual(boxX + boxWidth);
    expect(y + height).toBeLessThanOrEqual(boxY + boxHeight);
  });

  // An inline SVG rides its wrapper's text baseline, a couple of pixels below the button's centre;
  // the wrapper leaving inline layout is what centres every icon on the same rows.
  it('should keep the rule that centres the icons in their buttons', () => {
    const scss = fs.readFileSync(path.resolve(__dirname, '../ViewTabs.scss'), 'utf8');

    expect(scss).toMatch(/\.ecos-btn__text\s*{[^}]*display:\s*flex/);
  });
});
