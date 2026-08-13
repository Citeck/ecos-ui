/* eslint-disable header/header */
import { EditorThemeClasses } from 'lexical';

export const BUTTON_WIDTH_PX = 20;
/** Distance between the edge of the table and the button that sits next to it */
export const BUTTON_GAP_PX = 5;
/**
 * The pointer still counts as "on the table" inside this margin around it, so that moving from a
 * cell to a button — across the gap and, when the table scrolls, across the horizontal scrollbar,
 * neither of which is a cell or a button — does not hide the button before it can be clicked.
 */
export const HOVER_MARGIN_PX = BUTTON_WIDTH_PX + BUTTON_GAP_PX;

export type VisibleTableBox = {
  /** Bottom of the visible content: above the horizontal scrollbar, if there is one */
  bottom: number;
  left: number;
  /** Bottom of the whole scroll container: below the horizontal scrollbar, if there is one */
  outerBottom: number;
  right: number;
  top: number;
};

export type ButtonPosition = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type AnchorOrigin = {
  left: number;
  top: number;
};

/**
 * The scrollable wrapper Lexical puts around a table when `hasHorizontalScroll` is on, or null
 * when the table is not wrapped. The wrapper — not the table — is what the user actually sees:
 * a table wider than the wrapper is clipped by it.
 */
export function getTableScrollWrapper(tableElem: HTMLElement, theme: EditorThemeClasses | null | undefined): HTMLElement | null {
  const parentElement = tableElem.parentElement;

  if (!parentElement) {
    return null;
  }

  const wrapperClasses = theme?.tableScrollableWrapper;

  if (typeof wrapperClasses === 'string') {
    const classes = wrapperClasses.split(/\s+/g).filter(Boolean);

    return classes.length > 0 && classes.every(cls => parentElement.classList.contains(cls)) ? parentElement : null;
  }

  // Without a theme class Lexical styles the wrapper inline
  return parentElement.style.overflowX === 'auto' ? parentElement : null;
}

/** The part of the table that is actually on screen, in viewport coordinates */
export function getVisibleTableBox(tableElem: HTMLElement, scrollWrapper: HTMLElement | null): VisibleTableBox {
  const { top, right, bottom, left } = tableElem.getBoundingClientRect();

  if (!scrollWrapper) {
    return { bottom, left, outerBottom: bottom, right, top };
  }

  const wrapperRect = scrollWrapper.getBoundingClientRect();
  const clientLeft = wrapperRect.left + scrollWrapper.clientLeft;
  const clientTop = wrapperRect.top + scrollWrapper.clientTop;

  return {
    bottom: Math.min(bottom, clientTop + scrollWrapper.clientHeight),
    left: Math.max(left, clientLeft),
    outerBottom: Math.max(bottom, wrapperRect.bottom),
    right: Math.min(right, clientLeft + scrollWrapper.clientWidth),
    top: Math.max(top, clientTop)
  };
}

/** Full width of the visible table, just below it — under the horizontal scrollbar, never over it */
export function getAddRowButtonPosition(visible: VisibleTableBox, anchorOrigin: AnchorOrigin): ButtonPosition {
  return {
    height: BUTTON_WIDTH_PX,
    left: visible.left - anchorOrigin.left,
    top: visible.outerBottom - anchorOrigin.top + BUTTON_GAP_PX,
    width: visible.right - visible.left
  };
}

/** Full height of the visible table, just right of it — clamped to the visible edge, not the clipped one */
export function getAddColumnButtonPosition(visible: VisibleTableBox, anchorOrigin: AnchorOrigin): ButtonPosition {
  return {
    height: visible.bottom - visible.top,
    left: visible.right - anchorOrigin.left + BUTTON_GAP_PX,
    top: visible.top - anchorOrigin.top,
    width: BUTTON_WIDTH_PX
  };
}

/** Whether the pointer is close enough to the table for its buttons to stay on screen */
export function isPointerNearTable(
  clientX: number,
  clientY: number,
  tableElem: HTMLElement | null,
  theme: EditorThemeClasses | null | undefined
): boolean {
  if (!tableElem || !tableElem.isConnected) {
    return false;
  }

  const visible = getVisibleTableBox(tableElem, getTableScrollWrapper(tableElem, theme));

  return (
    clientX >= visible.left - HOVER_MARGIN_PX &&
    clientX <= visible.right + HOVER_MARGIN_PX &&
    clientY >= visible.top - HOVER_MARGIN_PX &&
    clientY <= visible.outerBottom + HOVER_MARGIN_PX
  );
}
