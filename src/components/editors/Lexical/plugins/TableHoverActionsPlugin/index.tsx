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
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableNode,
  getTableElement,
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, EditorThemeClasses, isHTMLElement, NodeKey } from 'lexical';
import { useEffect, useMemo, useRef, useState, JSX } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { getThemeSelector } from '../../utils/getThemeSelector';
import { useDebounce } from '../CodeActionMenuPlugin/utils';
import {
  getAddColumnButtonPosition,
  getAddRowButtonPosition,
  getTableScrollWrapper,
  getVisibleTableBox,
  isPointerNearTable
} from './utils';

// A short debounce keeps the buttons responsive; the handler only does real work when the
// pointer is over a table cell
const MOUSE_MOVE_DEBOUNCE_MS = 16;
const MOUSE_MOVE_MAX_WAIT_MS = 50;

function TableHoverActionsContainer({ anchorElem }: { anchorElem: HTMLElement }): JSX.Element | null {
  const [editor, { getTheme }] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isShownRow, setShownRow] = useState<boolean>(false);
  const [isShownColumn, setShownColumn] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false);
  const [position, setPosition] = useState({});
  const tableSetRef = useRef<Set<NodeKey>>(new Set());
  const tableCellDOMNodeRef = useRef<HTMLElement | null>(null);
  const hoveredTableDOMNodeRef = useRef<HTMLElement | null>(null);

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { isOutside, tableDOMNode } = getMouseInfo(event, getTheme);

      if (isOutside) {
        if (!isPointerNearTable(event.clientX, event.clientY, hoveredTableDOMNodeRef.current, getTheme())) {
          hoveredTableDOMNodeRef.current = null;
          setShownRow(false);
          setShownColumn(false);
        }
        return;
      }

      if (!tableDOMNode) {
        return;
      }

      tableCellDOMNodeRef.current = tableDOMNode;

      let hoveredRowNode: TableCellNode | null = null;
      let hoveredColumnNode: TableCellNode | null = null;
      let tableDOMElement: HTMLElement | null = null;

      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode);

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

      if (tableDOMElement) {
        hoveredTableDOMNodeRef.current = tableDOMElement;

        // A table wider than its scrollable wrapper is clipped by it, so the buttons are placed
        // against the visible edges of the table — never against the clipped-away ones, which
        // would put them outside the form
        const visible = getVisibleTableBox(tableDOMElement, getTableScrollWrapper(tableDOMElement, getTheme()));
        const { top: anchorTop, left: anchorLeft } = anchorElem.getBoundingClientRect();
        const anchorOrigin = { left: anchorLeft, top: anchorTop };

        if (hoveredRowNode) {
          setShownColumn(false);
          setShownRow(true);
          setPosition(getAddRowButtonPosition(visible, anchorOrigin));
        } else if (hoveredColumnNode) {
          setShownColumn(true);
          setShownRow(false);
          setPosition(getAddColumnButtonPosition(visible, anchorOrigin));
        }
      }
    },
    MOUSE_MOVE_DEBOUNCE_MS,
    MOUSE_MOVE_MAX_WAIT_MS
  );

  // Hide the buttons on any table dimensions change to prevent last row cells
  // overlap behind the 'Add Row' button when text entry changes cell height
  const tableResizeObserver = useMemo(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    document.addEventListener('mousemove', debouncedOnMouseMove);

    return () => {
      hoveredTableDOMNodeRef.current = null;
      setShownRow(false);
      setShownColumn(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener('mousemove', debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

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
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(tableCellDOMNodeRef.current);
        maybeTableNode?.selectEnd();
        if (insertRow) {
          $insertTableRow__EXPERIMENTAL();
          setShownRow(false);
        } else {
          $insertTableColumn__EXPERIMENTAL();
          setShownColumn(false);
        }
      }
    });
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

function getMouseInfo(
  event: MouseEvent,
  getTheme: () => EditorThemeClasses | null | undefined
): {
  tableDOMNode: HTMLElement | null;
  isOutside: boolean;
} {
  const target = event.target;
  const tableCellClass = getThemeSelector(getTheme, 'tableCell');

  if (isHTMLElement(target)) {
    const tableDOMNode = target.closest<HTMLElement>(`td${tableCellClass}, th${tableCellClass}`);

    const isOutside = !(
      tableDOMNode ||
      target.closest<HTMLElement>(`button${getThemeSelector(getTheme, 'tableAddRows')}`) ||
      target.closest<HTMLElement>(`button${getThemeSelector(getTheme, 'tableAddColumns')}`) ||
      target.closest<HTMLElement>('div.TableCellResizer__resizer')
    );

    return { isOutside, tableDOMNode };
  } else {
    return { isOutside: true, tableDOMNode: null };
  }
}

export default function TableHoverActionsPlugin({ anchorElem = document.body }: { anchorElem?: HTMLElement }): React.ReactPortal | null {
  const isEditable = useLexicalEditable();

  return isEditable ? createPortal(<TableHoverActionsContainer anchorElem={anchorElem} />, anchorElem) : null;
}
