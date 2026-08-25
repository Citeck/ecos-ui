/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  $isTableSelection,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellNode,
  TableObserver
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, getDOMSelection, SELECTION_CHANGE_COMMAND } from 'lexical';
import * as React from 'react';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';

import useModal from '../../hooks/useModal';
import invariant from '../../shared/invariant';
import { getTableScrollWrapper, getVisibleTableBox, isRectVisibleInBox } from '../table/utils';

import TableActionMenu from './TableActionMenu';

function TableCellActionMenuContainer({ anchorElem, cellMerge }: { anchorElem: HTMLElement; cellMerge: boolean }): JSX.Element {
  const [editor, { getTheme }] = useLexicalComposerContext();

  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const menuRootRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(null);

  const [colorPickerModal, showColorPickerModal] = useModal();

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;
    function disable() {
      if (menu) {
        menu.classList.remove('table-cell-action-button-container--active');
        menu.classList.add('table-cell-action-button-container--inactive');
      }
      setTableMenuCellNode(null);
    }

    if (selection == null || menu == null) {
      return disable();
    }

    const rootElement = editor.getRootElement();
    let tableObserver: TableObserver | null = null;
    let tableCellParentNodeDOM: HTMLElement | null = null;
    let tableDOMElement: HTMLElement | null = null;

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());

      if (tableCellNodeFromSelection == null) {
        return disable();
      }

      tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey());

      if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
        return disable();
      }

      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection);
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));

      invariant(tableElement !== null, 'TableActionMenu: Expected to find tableElement in DOM');

      tableObserver = getTableObserverFromTableElement(tableElement);
      tableDOMElement = tableElement;
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      invariant($isTableCellNode(anchorNode), 'TableSelection anchorNode must be a TableCellNode');
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
      invariant(tableElement !== null, 'TableActionMenu: Expected to find tableElement in DOM');
      tableObserver = getTableObserverFromTableElement(tableElement);
      tableDOMElement = tableElement;
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());
    } else if (!activeElement) {
      return disable();
    }
    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable();
    }

    const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
    // A table wider (or taller) than its scrollable wrapper is clipped by it. The chevron sits on
    // the cell that holds the caret, so it has to obey the same clip: pinned to the visible edge
    // while the cell is partly out of view, and hidden once the cell is scrolled away entirely —
    // otherwise it is drawn outside the form, next to nothing
    const visible = tableDOMElement ? getVisibleTableBox(tableDOMElement, getTableScrollWrapper(tableDOMElement, getTheme())) : null;
    const isCellVisible = visible === null || isRectVisibleInBox(tableCellRect, visible);
    const enabled = (!tableObserver || !tableObserver.isSelecting) && isCellVisible;

    menu.classList.toggle('table-cell-action-button-container--active', enabled);
    menu.classList.toggle('table-cell-action-button-container--inactive', !enabled);
    if (enabled) {
      const anchorRect = anchorElem.getBoundingClientRect();
      const cellTop = visible === null ? tableCellRect.top : Math.min(Math.max(tableCellRect.top, visible.top), visible.bottom);
      const cellRight = visible === null ? tableCellRect.right : Math.min(Math.max(tableCellRect.right, visible.left), visible.right);
      const top = cellTop - anchorRect.top;
      const left = cellRight - anchorRect.left;
      menu.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, [editor, anchorElem, getTheme]);

  useEffect(() => {
    // We call the $moveMenu callback every time the selection changes,
    // once up front, and once after each mouseUp
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    // The menu is placed against the cell it belongs to, so scrolling — the page, the editor, or
    // the table's own horizontal scroll — has to move it too, or hide it once the cell scrolls out
    const onViewportChange = () => {
      delayedCallback();
    };

    document.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);

    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, delayedCallback, COMMAND_PRIORITY_CRITICAL),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('mouseup', delayedCallback);
        }
        if (rootElement) {
          rootElement.addEventListener('mouseup', delayedCallback);
          delayedCallback();
        }
      }),
      () => {
        document.removeEventListener('scroll', onViewportChange, true);
        window.removeEventListener('resize', onViewportChange);
      },
      () => timeoutId && clearTimeout(timeoutId)
    );
  });

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }

    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
      {tableCellNode != null && (
        <>
          <button
            type="button"
            className="table-cell-action-button chevron-down"
            onClick={e => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            ref={menuRootRef}
          >
            <i className="chevron-down" />
          </button>
          {colorPickerModal}
          {isMenuOpen && (
            <TableActionMenu
              contextRef={menuRootRef}
              setIsMenuOpen={setIsMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              tableCellNode={tableCellNode}
              cellMerge={cellMerge}
              showColorPickerModal={showColorPickerModal}
            />
          )}
        </>
      )}
    </div>
  );
}

export default TableCellActionMenuContainer;
