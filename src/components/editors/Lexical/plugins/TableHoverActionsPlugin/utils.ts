/* eslint-disable header/header */
import { VisibleTableBox } from '../table/utils';

export const BUTTON_WIDTH_PX = 20;
/** Distance between the edge of the table and the button that sits next to it */
export const BUTTON_GAP_PX = 5;
/**
 * The pointer still counts as "on the table" inside this margin around it, so that moving from a
 * cell to a button — across the gap and, when the table scrolls, across the horizontal scrollbar,
 * neither of which is a cell or a button — does not hide the button before it can be clicked.
 */
export const HOVER_MARGIN_PX = BUTTON_WIDTH_PX + BUTTON_GAP_PX;

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

export function isSameButtonPosition(a: ButtonPosition | null, b: ButtonPosition | null): boolean {
  return a === b || (a !== null && b !== null && a.height === b.height && a.left === b.left && a.top === b.top && a.width === b.width);
}

/** Whether the pointer is close enough to the already measured table box for its buttons to stay */
export function isPointerNearBox(clientX: number, clientY: number, visible: VisibleTableBox): boolean {
  return (
    clientX >= visible.left - HOVER_MARGIN_PX &&
    clientX <= visible.right + HOVER_MARGIN_PX &&
    clientY >= visible.top - HOVER_MARGIN_PX &&
    clientY <= visible.outerBottom + HOVER_MARGIN_PX
  );
}
