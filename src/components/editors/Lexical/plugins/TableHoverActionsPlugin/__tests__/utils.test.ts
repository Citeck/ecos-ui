import {
  BUTTON_GAP_PX,
  BUTTON_WIDTH_PX,
  getAddColumnButtonPosition,
  getAddRowButtonPosition,
  HOVER_MARGIN_PX,
  isPointerNearBox,
  isSameButtonPosition
} from '../utils';

import { getTableScrollWrapper, getVisibleTableBox, isRectVisibleInBox } from '../../table/utils';

const THEME = { tableScrollableWrapper: 'LEd__tableScrollableWrapper' };
const ANCHOR = { left: 100, top: 200 };

const SCROLLBAR_HEIGHT = 10;

/**
 * jsdom does no layout, so the geometry the helpers read is stubbed here. The numbers come from
 * a real reproduction of COREDEV-326: a 1245px table inside an 873px wrapper.
 *
 * `wrapperHeight` is the visible height of the wrapper: smaller than `tableHeight` it clips the
 * table vertically, the way a wrapper inside a form of limited height does.
 */
type TableOptions = {
  scrollLeft?: number;
  tableHeight?: number;
  tableWidth?: number;
  wrapped?: boolean;
  wrapperHeight?: number;
  wrapperWidth?: number;
};

function buildTable({
  tableWidth = 800,
  wrapperWidth = 873,
  scrollLeft = 0,
  tableHeight = 177,
  wrapped = true,
  ...rest
}: TableOptions = {}) {
  const wrapperHeight = rest.wrapperHeight ?? tableHeight;
  const wrapperLeft = 300;
  const wrapperTop = 578;
  const overflows = tableWidth > wrapperWidth;
  const scrollbarHeight = wrapped && overflows ? SCROLLBAR_HEIGHT : 0;

  const table = document.createElement('table');
  table.getBoundingClientRect = () =>
    ({
      bottom: wrapperTop + tableHeight,
      height: tableHeight,
      left: wrapperLeft - scrollLeft,
      right: wrapperLeft - scrollLeft + tableWidth,
      top: wrapperTop,
      width: tableWidth
    }) as DOMRect;

  const wrapper = document.createElement('div');

  if (wrapped) {
    wrapper.className = THEME.tableScrollableWrapper;
    Object.defineProperties(wrapper, {
      clientHeight: { value: wrapperHeight },
      clientLeft: { value: 0 },
      clientTop: { value: 0 },
      clientWidth: { value: wrapperWidth },
      scrollWidth: { value: tableWidth }
    });
    wrapper.getBoundingClientRect = () =>
      ({
        bottom: wrapperTop + wrapperHeight + scrollbarHeight,
        height: wrapperHeight + scrollbarHeight,
        left: wrapperLeft,
        right: wrapperLeft + wrapperWidth,
        top: wrapperTop,
        width: wrapperWidth
      }) as DOMRect;
  }

  wrapper.appendChild(table);
  document.body.appendChild(wrapper);

  return { table, wrapper, wrapperLeft, wrapperTop, wrapperWidth, wrapperHeight, scrollbarHeight, tableHeight };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('getTableScrollWrapper', () => {
  it('finds the wrapper by the theme class of the running editor, not the playground one', () => {
    const { table, wrapper } = buildTable();

    expect(getTableScrollWrapper(table, THEME)).toBe(wrapper);
    expect(getTableScrollWrapper(table, { tableScrollableWrapper: 'PlaygroundEditorTheme__tableScrollableWrapper' })).toBeNull();
  });

  it('falls back to the inline style Lexical uses when the theme defines no class', () => {
    const { table, wrapper } = buildTable({ wrapped: false });
    wrapper.style.overflowX = 'auto';

    expect(getTableScrollWrapper(table, {})).toBe(wrapper);
  });

  it('returns null for an unwrapped table', () => {
    const { table } = buildTable({ wrapped: false });

    expect(getTableScrollWrapper(table, THEME)).toBeNull();
  });
});

describe('buttons of a table that fits its wrapper', () => {
  it('places them against the table edges', () => {
    const { table, wrapper, wrapperLeft, wrapperTop, tableHeight } = buildTable({ tableWidth: 800 });
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));

    expect(getAddRowButtonPosition(visible, ANCHOR)).toEqual({
      height: BUTTON_WIDTH_PX,
      left: wrapperLeft - ANCHOR.left,
      top: wrapperTop + tableHeight - ANCHOR.top + BUTTON_GAP_PX,
      width: 800
    });
    expect(getAddColumnButtonPosition(visible, ANCHOR)).toEqual({
      height: tableHeight,
      left: wrapperLeft + 800 - ANCHOR.left + BUTTON_GAP_PX,
      top: wrapperTop - ANCHOR.top,
      width: BUTTON_WIDTH_PX
    });
    expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth);
  });
});

describe('buttons of a table wider than its wrapper', () => {
  it('keeps the "add row" button inside the wrapper and below the horizontal scrollbar', () => {
    const { table, wrapperLeft, wrapperTop, wrapperWidth, tableHeight, scrollbarHeight } = buildTable({ tableWidth: 1245 });
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));
    const position = getAddRowButtonPosition(visible, ANCHOR);

    // spans the visible width only — not the 1245px of the clipped table
    expect(position.left).toBe(wrapperLeft - ANCHOR.left);
    expect(position.width).toBe(wrapperWidth);
    // below the scrollbar, so it neither covers it nor sticks out of the form
    expect(position.top).toBe(wrapperTop + tableHeight + scrollbarHeight - ANCHOR.top + BUTTON_GAP_PX);
  });

  it('keeps the "add column" button at the visible right edge while the table is partly scrolled', () => {
    const { table, wrapperLeft, wrapperTop, wrapperWidth, tableHeight } = buildTable({ tableWidth: 1245, scrollLeft: 312 });
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));
    const position = getAddColumnButtonPosition(visible, ANCHOR);

    // the table really ends at 1233, which is outside the wrapper — the button must not follow it
    expect(position.left).toBe(wrapperLeft + wrapperWidth - ANCHOR.left + BUTTON_GAP_PX);
    expect(position.top).toBe(wrapperTop - ANCHOR.top);
    // as tall as the visible table, so it does not reach down over the scrollbar
    expect(position.height).toBe(tableHeight);
  });

  it('does not follow the table off screen when it is scrolled to its left edge', () => {
    const { table, wrapperLeft, wrapperWidth } = buildTable({ tableWidth: 1245, scrollLeft: 0 });
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));

    expect(visible.right).toBe(wrapperLeft + wrapperWidth);
    expect(getAddColumnButtonPosition(visible, ANCHOR).left).toBe(wrapperLeft + wrapperWidth - ANCHOR.left + BUTTON_GAP_PX);
  });
});

// Exercised the way the plugin calls it: against the box of the table the buttons are shown for
describe('isPointerNearBox', () => {
  const setup = () => {
    const built = buildTable({ tableWidth: 1245, scrollLeft: 0 });
    return { ...built, visible: getVisibleTableBox(built.table, getTableScrollWrapper(built.table, THEME)) };
  };

  it('holds the buttons while the pointer crosses the horizontal scrollbar to reach them', () => {
    const { visible, wrapperLeft, wrapperTop, tableHeight, scrollbarHeight } = setup();
    const onScrollbar = wrapperTop + tableHeight + scrollbarHeight / 2;
    const onRowButton = wrapperTop + tableHeight + scrollbarHeight + BUTTON_GAP_PX + BUTTON_WIDTH_PX / 2;

    expect(isPointerNearBox(wrapperLeft + 100, onScrollbar, visible)).toBe(true);
    expect(isPointerNearBox(wrapperLeft + 100, onRowButton, visible)).toBe(true);
  });

  it('holds the buttons while the pointer crosses the gap to the column button', () => {
    const { visible, wrapperLeft, wrapperWidth, wrapperTop } = setup();
    const inGap = wrapperLeft + wrapperWidth + BUTTON_GAP_PX / 2;
    const onColumnButton = wrapperLeft + wrapperWidth + BUTTON_GAP_PX + BUTTON_WIDTH_PX / 2;

    expect(isPointerNearBox(inGap, wrapperTop + 40, visible)).toBe(true);
    expect(isPointerNearBox(onColumnButton, wrapperTop + 40, visible)).toBe(true);
  });

  it('releases the buttons once the pointer leaves the table and its buttons', () => {
    const { visible, wrapperLeft, wrapperWidth, wrapperTop, tableHeight, scrollbarHeight } = setup();

    expect(isPointerNearBox(wrapperLeft + wrapperWidth + BUTTON_GAP_PX + BUTTON_WIDTH_PX + 5, wrapperTop + 40, visible)).toBe(false);
    expect(
      isPointerNearBox(wrapperLeft + 100, wrapperTop + tableHeight + scrollbarHeight + BUTTON_GAP_PX + BUTTON_WIDTH_PX + 5, visible)
    ).toBe(false);
    expect(isPointerNearBox(wrapperLeft + 100, wrapperTop - 40, visible)).toBe(false);
  });
});

describe('buttons of a table taller than its wrapper', () => {
  // The wrapper gets `overflow-y: auto` from `overflow-x: auto`, so a form of limited height clips
  // the table vertically as well. Reaching for the bottom of the clipped-away table put the
  // "add row" button below the form — the original defect, on the vertical axis
  const clipped = () => buildTable({ tableWidth: 1245, tableHeight: 400, wrapperHeight: 120 });

  it('keeps the "add row" button inside the wrapper instead of following the clipped-away table', () => {
    const { table, wrapperTop, wrapperHeight, scrollbarHeight, tableHeight } = clipped();
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));
    const wrapperBottom = wrapperTop + wrapperHeight + scrollbarHeight;

    expect(visible.bottom).toBe(wrapperTop + wrapperHeight);
    expect(visible.outerBottom).toBe(wrapperBottom);
    expect(visible.outerBottom).toBeLessThan(wrapperTop + tableHeight);
    expect(getAddRowButtonPosition(visible, ANCHOR).top).toBe(wrapperBottom - ANCHOR.top + BUTTON_GAP_PX);
  });

  it('keeps the "add column" button as tall as the visible table only', () => {
    const { table, wrapperHeight } = clipped();
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));

    expect(getAddColumnButtonPosition(visible, ANCHOR).height).toBe(wrapperHeight);
  });

  it('does not stretch the hover margin down to the clipped-away bottom of the table', () => {
    const { table, wrapperLeft, wrapperTop, wrapperHeight, scrollbarHeight } = clipped();
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));
    const belowTheWrapper = wrapperTop + wrapperHeight + scrollbarHeight + HOVER_MARGIN_PX + 5;

    expect(isPointerNearBox(wrapperLeft + 100, belowTheWrapper, visible)).toBe(false);
  });
});

describe('isSameButtonPosition', () => {
  it('reports equal positions so a mouse move over the same table does not re-render', () => {
    const { table } = buildTable({ tableWidth: 1245 });
    const visible = getVisibleTableBox(table, getTableScrollWrapper(table, THEME));

    expect(isSameButtonPosition(getAddRowButtonPosition(visible, ANCHOR), getAddRowButtonPosition(visible, ANCHOR))).toBe(true);
    expect(isSameButtonPosition(getAddRowButtonPosition(visible, ANCHOR), getAddColumnButtonPosition(visible, ANCHOR))).toBe(false);
    expect(isSameButtonPosition(null, getAddRowButtonPosition(visible, ANCHOR))).toBe(false);
    expect(isSameButtonPosition(null, null)).toBe(true);
  });
});

// The check TableActionMenuPlugin makes before showing the chevron: a cell scrolled out of the
// visible part of the table must not leave its chevron floating over unrelated content
describe('isRectVisibleInBox', () => {
  const box = { left: 100, top: 200, right: 500, bottom: 400, outerBottom: 410 };
  const rect = (left: number, top: number, width = 20, height = 20) =>
    ({ left, top, right: left + width, bottom: top + height }) as DOMRect;

  it('sees a rect fully inside the box', () => {
    expect(isRectVisibleInBox(rect(200, 300), box)).toBe(true);
  });

  it('sees a rect that only partially overlaps an edge', () => {
    expect(isRectVisibleInBox(rect(90, 300), box)).toBe(true);
    expect(isRectVisibleInBox(rect(490, 390), box)).toBe(true);
  });

  it('does not see a rect beyond any edge of the box', () => {
    expect(isRectVisibleInBox(rect(70, 300), box)).toBe(false);
    expect(isRectVisibleInBox(rect(510, 300), box)).toBe(false);
    expect(isRectVisibleInBox(rect(200, 170), box)).toBe(false);
    expect(isRectVisibleInBox(rect(200, 410), box)).toBe(false);
  });

  it('does not count a rect that merely touches the edge as visible', () => {
    expect(isRectVisibleInBox(rect(80, 300), box)).toBe(false);
    expect(isRectVisibleInBox(rect(500, 300), box)).toBe(false);
  });
});

describe('getTableScrollWrapper with a multi-class theme value', () => {
  const multiClassTheme = { tableScrollableWrapper: 'LEd__tableScrollableWrapper is-scrollable' };

  it('requires every class of the theme value, and matches the wrapper that has them all', () => {
    const { table, wrapper } = buildTable();

    expect(getTableScrollWrapper(table, multiClassTheme)).toBeNull();

    wrapper.classList.add('is-scrollable');
    expect(getTableScrollWrapper(table, multiClassTheme)).toBe(wrapper);
  });

  it('does not match an element that merely carries one of the classes', () => {
    const { table, wrapper } = buildTable({ wrapped: false });
    wrapper.className = 'is-scrollable';

    expect(getTableScrollWrapper(table, multiClassTheme)).toBeNull();
  });
});
