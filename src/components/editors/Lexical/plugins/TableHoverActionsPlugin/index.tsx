/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import {
  $getTableAndElementByKey,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableNode,
  getTableElement,
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, isHTMLElement, NodeKey } from 'lexical';
import { useCallback, useEffect, useMemo, useRef, useState, JSX } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { getThemeSelector } from '../../utils/getThemeSelector';
import { useDebounce } from '../CodeActionMenuPlugin/utils';
import { $insertTableColumnAtSelection, $insertTableRowAtSelection, scrollTableCellIntoView } from '../table/insertion';
import { getTableScrollWrapper, getVisibleTableBox, VisibleTableBox } from '../table/utils';
import { ButtonPosition, getAddColumnButtonPosition, getAddRowButtonPosition, isPointerNearBox, isSameButtonPosition } from './utils';

// A short debounce keeps the buttons responsive; the handler only does real work when the pointer
// enters a different cell, so a fast rate costs next to nothing
const MOUSE_MOVE_DEBOUNCE_MS = 16;
const MOUSE_MOVE_MAX_WAIT_MS = 50;

function TableHoverActionsContainer({ anchorElem }: { anchorElem: HTMLElement }): JSX.Element | null {
  const [editor, { getTheme }] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isShownRow, setShownRow] = useState<boolean>(false);
  const [isShownColumn, setShownColumn] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false);
  const [position, setPosition] = useState<ButtonPosition | null>(null);
  const tableSetRef = useRef<Set<NodeKey>>(new Set());
  /** The cell the shown button was computed from — the insert happens next to this one */
  const tableCellDOMNodeRef = useRef<HTMLElement | null>(null);
  /** The table a currently shown button belongs to; null means nothing is shown */
  const shownForTableRef = useRef<HTMLElement | null>(null);
  /** The last cell the handler evaluated, so that moving inside one cell costs nothing */
  const lastCellDOMNodeRef = useRef<HTMLElement | null>(null);

  const selectors = useMemo(() => {
    // The plugin cannot work without these theme classes: an empty fallback would degrade `cell`
    // to `td, th` and `ownControls` to every `button` in the anchor, silently breaking the
    // stale-button logic — a missing key is a programming error and must say so
    const cell = getThemeSelector(getTheme, 'tableCell');
    const addRows = getThemeSelector(getTheme, 'tableAddRows');
    const addColumns = getThemeSelector(getTheme, 'tableAddColumns');

    return {
      cell: `td${cell}, th${cell}`,
      ownControls: `button${addRows}, button${addColumns}, div.TableCellResizer__resizer`
    };
  }, [getTheme]);

  /**
   * Forgetting the last evaluated cell makes the next mouse move re-measure the table. Geometry is
   * deliberately never cached across events: a wrapper can be resized or clipped by a layout change
   * that fires no event on the table itself, and a button placed from a stale box lands nowhere
   * near the table. The reads are affordable because they only happen when the pointer enters a
   * different cell, or leaves the cells while a button is shown
   */
  const forgetLastCell = useCallback(() => {
    lastCellDOMNodeRef.current = null;
  }, []);

  const getVisibleBox = useCallback(
    (tableElem: HTMLElement): VisibleTableBox => getVisibleTableBox(tableElem, getTableScrollWrapper(tableElem, getTheme())),
    [getTheme]
  );

  const hideButtons = useCallback(() => {
    shownForTableRef.current = null;
    tableCellDOMNodeRef.current = null;
    lastCellDOMNodeRef.current = null;
    setShownRow(false);
    setShownColumn(false);
  }, []);

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const target = event.target;

      if (!isHTMLElement(target)) {
        if (shownForTableRef.current) {
          hideButtons();
        }
        return;
      }

      // Anything drawn on top of the editor — a dropdown, the cell action menu, a modal — is
      // portalled outside the anchor element. While the pointer is over it the buttons are not
      // reachable and must not stay under it
      if (!anchorElem.contains(target)) {
        if (shownForTableRef.current) {
          hideButtons();
        }
        return;
      }

      const cellDOMNode = target.closest<HTMLElement>(selectors.cell);

      if (!cellDOMNode) {
        const shownForTable = shownForTableRef.current;

        // Nothing is shown and the pointer is not on a cell: the common case, and it must stay free
        if (!shownForTable) {
          return;
        }

        // The margin belongs to the table the button was shown for — not to whatever table the
        // pointer visited last, which used to let a stale button survive over its neighbour
        if (
          !target.closest<HTMLElement>(selectors.ownControls) &&
          !(shownForTable.isConnected && isPointerNearBox(event.clientX, event.clientY, getVisibleBox(shownForTable)))
        ) {
          hideButtons();
        }
        return;
      }

      if (cellDOMNode === lastCellDOMNodeRef.current) {
        return;
      }

      lastCellDOMNodeRef.current = cellDOMNode;

      let hoveredRowNode: TableCellNode | null = null;
      let hoveredColumnNode: TableCellNode | null = null;
      let tableDOMElement: HTMLElement | null = null;

      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode(cellDOMNode);

          if ($isTableCellNode(maybeTableCell)) {
            const table = $findMatchingParent(maybeTableCell, node => $isTableNode(node));
            if (!$isTableNode(table)) {
              return;
            }

            tableDOMElement = getTableElement(table, editor.getElementByKey(table.getKey()));

            if (tableDOMElement) {
              const rowCount = table.getChildrenSize();
              const colCount = ((table as TableNode).getChildAtIndex(0) as TableRowNode)?.getChildrenSize();

              const rowIndex = $getTableRowIndexFromTableCellNode(maybeTableCell);
              const colIndex = $getTableColumnIndexFromTableCellNode(maybeTableCell);

              if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell;
              } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell;
              }
            }
          }
        },
        { editor }
      );

      // Moving on to a different table drops the previous button right away: it belongs to a table
      // the pointer has left, and clicking it would insert into the wrong one
      if (shownForTableRef.current && shownForTableRef.current !== tableDOMElement) {
        hideButtons();
        // this cell is still the one the handler has just evaluated
        lastCellDOMNodeRef.current = cellDOMNode;
      }

      if (!tableDOMElement || (!hoveredRowNode && !hoveredColumnNode)) {
        return;
      }

      // A table wider (or taller) than its scrollable wrapper is clipped by it, so the buttons are
      // placed against the visible edges of the table — never against the clipped-away ones, which
      // would put them outside the form
      const visible = getVisibleBox(tableDOMElement);
      const { top: anchorTop, left: anchorLeft } = anchorElem.getBoundingClientRect();
      const anchorOrigin = { left: anchorLeft, top: anchorTop };
      const nextPosition = hoveredRowNode
        ? getAddRowButtonPosition(visible, anchorOrigin)
        : getAddColumnButtonPosition(visible, anchorOrigin);

      shownForTableRef.current = tableDOMElement;
      tableCellDOMNodeRef.current = cellDOMNode;
      setShownColumn(!hoveredRowNode);
      setShownRow(!!hoveredRowNode);

      // Returning the previous reference makes React bail out, so a mouse move over the same
      // table does not re-render
      setPosition(prev => (isSameButtonPosition(prev, nextPosition) ? prev : nextPosition));
    },
    MOUSE_MOVE_DEBOUNCE_MS,
    MOUSE_MOVE_MAX_WAIT_MS
  );

  // Hide the buttons on any table dimensions change to prevent last row cells
  // overlap behind the 'Add Row' button when text entry changes cell height
  const tableResizeObserver = useMemo(() => new ResizeObserver(hideButtons), [hideButtons]);

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    // Scrolling — the page, the editor, or the table's own horizontal scroll — moves the table out
    // from under a button that was measured against the old position, so drop it and re-measure
    const onGeometryChange = () => {
      forgetLastCell();
      debouncedOnMouseMove.cancel();
      if (shownForTableRef.current) {
        hideButtons();
      }
    };
    const onBlur = () => {
      debouncedOnMouseMove.cancel();
      hideButtons();
    };
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;

      // A press that is neither in a cell nor on one of the buttons themselves opens something
      // over the table (the settings chevron, a menu) — the buttons must not stay under it.
      // Hiding on a press on the buttons would unmount them before their click could fire
      if (
        shownForTableRef.current &&
        isHTMLElement(target) &&
        !target.closest<HTMLElement>(selectors.cell) &&
        !target.closest<HTMLElement>(selectors.ownControls)
      ) {
        hideButtons();
      }
    };

    document.addEventListener('mousemove', debouncedOnMouseMove);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('scroll', onGeometryChange, true);
    window.addEventListener('resize', onGeometryChange);
    window.addEventListener('blur', onBlur);

    return () => {
      hideButtons();
      debouncedOnMouseMove.cancel();
      forgetLastCell();
      document.removeEventListener('mousemove', debouncedOnMouseMove);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('scroll', onGeometryChange, true);
      window.removeEventListener('resize', onGeometryChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove, hideButtons, forgetLastCell, selectors]);

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(
        TableNode,
        mutations => {
          editor.getEditorState().read(
            () => {
              let resetObserver = false;
              for (const [key, type] of mutations) {
                switch (type) {
                  case 'created': {
                    tableSetRef.current.add(key);
                    resetObserver = true;
                    break;
                  }
                  case 'destroyed': {
                    tableSetRef.current.delete(key);
                    resetObserver = true;
                    break;
                  }
                  default:
                    break;
                }
              }
              if (resetObserver) {
                // Reset resize observers
                tableResizeObserver.disconnect();
                for (const tableKey of tableSetRef.current) {
                  const { tableElement } = $getTableAndElementByKey(tableKey);
                  tableResizeObserver.observe(tableElement);
                }
                setShouldListenMouseMove(tableSetRef.current.size > 0);
              }
            },
            { editor }
          );
        },
        { skipInitialization: false }
      )
    );
  }, [editor, tableResizeObserver]);

  const insertAction = (insertRow: boolean) => {
    const cellDOMNode = tableCellDOMNodeRef.current;
    const shownForTable = shownForTableRef.current;

    // The button always inserts into the table it was shown for. If the two ever drift apart the
    // insert would land in a neighbouring table, which is exactly what the user did not click
    if (!cellDOMNode || !shownForTable || !shownForTable.contains(cellDOMNode)) {
      hideButtons();
      return;
    }

    editor.update(() => {
      const maybeTableNode = $getNearestNodeFromDOMNode(cellDOMNode);

      if (!maybeTableNode) {
        return;
      }

      maybeTableNode.selectEnd();

      // The caret is moved into the inserted row/column, so the settings chevron — which follows
      // the selection — ends up on the new cell instead of the one that was hovered, and the new
      // cell is scrolled into view when it lands behind the horizontal clip
      scrollTableCellIntoView(editor, insertRow ? $insertTableRowAtSelection() : $insertTableColumnAtSelection());
    });

    hideButtons();
  };

  if (!isEditable) {
    return null;
  }

  return (
    <>
      {isShownRow && <button className={`${getTheme()?.tableAddRows}`} style={{ ...position }} onClick={() => insertAction(true)} />}
      {isShownColumn && <button className={`${getTheme()?.tableAddColumns}`} style={{ ...position }} onClick={() => insertAction(false)} />}
    </>
  );
}

export default function TableHoverActionsPlugin({ anchorElem = document.body }: { anchorElem?: HTMLElement }): React.ReactPortal | null {
  const isEditable = useLexicalEditable();

  return isEditable ? createPortal(<TableHoverActionsContainer anchorElem={anchorElem} />, anchorElem) : null;
}
