/* eslint-disable header/header */
import { EditorThemeClasses } from 'lexical';

import { getThemeClassSelector } from '../../utils/getThemeSelector';

export type VisibleTableBox = {
  /** Bottom of the visible content: above the horizontal scrollbar, if there is one */
  bottom: number;
  left: number;
  /** Bottom of the whole scroll container: below the horizontal scrollbar, but never below the wrapper */
  outerBottom: number;
  right: number;
  top: number;
};

/**
 * The scrollable wrapper Lexical puts around a table when `hasHorizontalScroll` is on, or null
 * when the table is not wrapped. The wrapper — not the table — is what the user actually sees:
 * a table wider (or taller) than the wrapper is clipped by it.
 */
export function getTableScrollWrapper(tableElem: HTMLElement, theme: EditorThemeClasses | null | undefined): HTMLElement | null {
  const parentElement = tableElem.parentElement;

  if (!parentElement) {
    return null;
  }

  const wrapperSelector = getThemeClassSelector(theme, 'tableScrollableWrapper');

  if (wrapperSelector !== null) {
    return parentElement.matches(wrapperSelector) ? parentElement : null;
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
  const clientBottom = clientTop + scrollWrapper.clientHeight;
  // Clamped to the wrapper's content edge: a wrapper shorter than the table clips it, and reaching
  // for the bottom of the clipped-away table would put the "add row" button outside the form — the
  // very defect this box exists to prevent
  const visibleBottom = Math.min(bottom, clientBottom);
  /** Horizontal scrollbar (plus the bottom border), i.e. the wrapper's own chrome below the content */
  const bottomChrome = Math.max(0, wrapperRect.bottom - clientBottom);

  return {
    bottom: visibleBottom,
    left: Math.max(left, clientLeft),
    // Below the scrollbar; visibleBottom ≤ clientBottom keeps this within the wrapper by definition
    outerBottom: visibleBottom + bottomChrome,
    right: Math.min(right, clientLeft + scrollWrapper.clientWidth),
    top: Math.max(top, clientTop)
  };
}

/** Whether a rect overlaps the visible part of the table at all */
export function isRectVisibleInBox(rect: DOMRect, box: VisibleTableBox): boolean {
  return rect.right > box.left && rect.left < box.right && rect.bottom > box.top && rect.top < box.bottom;
}
