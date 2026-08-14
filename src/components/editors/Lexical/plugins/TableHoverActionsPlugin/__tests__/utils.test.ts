import {
  BUTTON_GAP_PX,
  BUTTON_WIDTH_PX,
  getAddColumnButtonPosition,
  getAddRowButtonPosition,
  getTableScrollWrapper,
  getVisibleTableBox,
  isPointerNearTable
} from '../utils';

const THEME = { tableScrollableWrapper: 'LEd__tableScrollableWrapper' };
const ANCHOR = { left: 100, top: 200 };

const SCROLLBAR_HEIGHT = 10;

/**
 * jsdom does no layout, so the geometry the helpers read is stubbed here. The numbers come from
 * a real reproduction of COREDEV-326: a 1245px table inside an 873px wrapper.
 */
function buildTable({ tableWidth = 800, wrapperWidth = 873, scrollLeft = 0, tableHeight = 177, wrapped = true } = {}) {
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
      clientHeight: { value: tableHeight },
      clientLeft: { value: 0 },
      clientTop: { value: 0 },
      clientWidth: { value: wrapperWidth },
      scrollWidth: { value: tableWidth }
    });
    wrapper.getBoundingClientRect = () =>
      ({
        bottom: wrapperTop + tableHeight + scrollbarHeight,
        height: tableHeight + scrollbarHeight,
        left: wrapperLeft,
        right: wrapperLeft + wrapperWidth,
        top: wrapperTop,
        width: wrapperWidth
      }) as DOMRect;
  }

  wrapper.appendChild(table);
  document.body.appendChild(wrapper);

  return { table, wrapper, wrapperLeft, wrapperTop, wrapperWidth, scrollbarHeight, tableHeight };
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

describe('isPointerNearTable', () => {
  const setup = () => buildTable({ tableWidth: 1245, scrollLeft: 0 });

  it('holds the buttons while the pointer crosses the horizontal scrollbar to reach them', () => {
    const { table, wrapperLeft, wrapperTop, tableHeight, scrollbarHeight } = setup();
    const onScrollbar = wrapperTop + tableHeight + scrollbarHeight / 2;
    const onRowButton = wrapperTop + tableHeight + scrollbarHeight + BUTTON_GAP_PX + BUTTON_WIDTH_PX / 2;

    expect(isPointerNearTable(wrapperLeft + 100, onScrollbar, table, THEME)).toBe(true);
    expect(isPointerNearTable(wrapperLeft + 100, onRowButton, table, THEME)).toBe(true);
  });

  it('holds the buttons while the pointer crosses the gap to the column button', () => {
    const { table, wrapperLeft, wrapperWidth, wrapperTop } = setup();
    const inGap = wrapperLeft + wrapperWidth + BUTTON_GAP_PX / 2;
    const onColumnButton = wrapperLeft + wrapperWidth + BUTTON_GAP_PX + BUTTON_WIDTH_PX / 2;

    expect(isPointerNearTable(inGap, wrapperTop + 40, table, THEME)).toBe(true);
    expect(isPointerNearTable(onColumnButton, wrapperTop + 40, table, THEME)).toBe(true);
  });

  it('releases the buttons once the pointer leaves the table and its buttons', () => {
    const { table, wrapperLeft, wrapperWidth, wrapperTop, tableHeight, scrollbarHeight } = setup();

    expect(isPointerNearTable(wrapperLeft + wrapperWidth + BUTTON_GAP_PX + BUTTON_WIDTH_PX + 5, wrapperTop + 40, table, THEME)).toBe(false);
    expect(
      isPointerNearTable(wrapperLeft + 100, wrapperTop + tableHeight + scrollbarHeight + BUTTON_GAP_PX + BUTTON_WIDTH_PX + 5, table, THEME)
    ).toBe(false);
    expect(isPointerNearTable(wrapperLeft + 100, wrapperTop - 40, table, THEME)).toBe(false);
  });

  it('releases the buttons when there is no table to be near', () => {
    const { table } = setup();
    table.remove();

    expect(isPointerNearTable(0, 0, null, THEME)).toBe(false);
    expect(isPointerNearTable(400, 600, table, THEME)).toBe(false);
  });
});
