/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getNodeTriplet,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $unmergeCell,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
  TableRowNode
} from '@lexical/table';
import { $getRoot, $getSelection, $isRangeSelection, isDOMNode } from 'lexical';
import * as React from 'react';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import invariant from '../../shared/invariant';
import ColorPicker from '../../ui/ColorPicker';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import { $insertTableColumnAtSelection, $insertTableRowAtSelection, scrollTableCellIntoView } from '../table/insertion';

import { $canUnmerge, $mergeSelectedTableCells, computeSelectionCount, currentCellBackgroundColor } from './utils';

import { t } from '@/helpers/export/util';

type TableCellActionMenuProps = Readonly<{
  contextRef: { current: null | HTMLElement };
  onClose: () => void;
  setIsMenuOpen: (isOpen: boolean) => void;
  showColorPickerModal: (title: string, showModal: (onClose: () => void) => JSX.Element) => void;
  tableCellNode: TableCellNode;
  cellMerge: boolean;
}>;

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
  cellMerge,
  showColorPickerModal
}: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext();
  const dropDownRef = useRef<HTMLDivElement | null>(null);
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1
  });
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(() => currentCellBackgroundColor(editor) || '');

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      nodeMutations => {
        const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated';

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
          setBackgroundColor(currentCellBackgroundColor(editor) || '');
        }
      },
      { skipInitialization: true }
    );
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        updateSelectionCounts(computeSelectionCount(selection));
        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1);
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);

  useEffect(() => {
    const menuButtonElement = contextRef.current;
    const dropDownElement = dropDownRef.current;
    const rootElement = editor.getRootElement();

    if (menuButtonElement != null && dropDownElement != null && rootElement != null) {
      const rootEleRect = rootElement.getBoundingClientRect();
      const menuButtonRect = menuButtonElement.getBoundingClientRect();
      dropDownElement.style.opacity = '1';
      const dropDownElementRect = dropDownElement.getBoundingClientRect();
      const margin = 5;
      let leftPosition = menuButtonRect.right + margin;
      if (leftPosition + dropDownElementRect.width > window.innerWidth || leftPosition + dropDownElementRect.width > rootEleRect.right) {
        const position = menuButtonRect.left - dropDownElementRect.width - margin;
        leftPosition = (position < 0 ? margin : position) + window.pageXOffset;
      }
      dropDownElement.style.left = `${leftPosition + window.pageXOffset}px`;

      let topPosition = menuButtonRect.top;
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position = menuButtonRect.bottom - dropDownElementRect.height;
        topPosition = position < 0 ? margin : position;
      }
      dropDownElement.style.top = `${topPosition}px`;
    }
  }, [contextRef, dropDownRef, editor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropDownRef.current != null &&
        contextRef.current != null &&
        isDOMNode(event.target) &&
        !dropDownRef.current.contains(event.target) &&
        !contextRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('click', handleClickOutside);

    return () => window.removeEventListener('click', handleClickOutside);
  }, [setIsMenuOpen, contextRef]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));

        invariant(tableElement !== null, 'TableActionMenu: Expected to find tableElement in DOM');

        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }

        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }

      const rootNode = $getRoot();
      rootNode.selectStart();
    });
  }, [editor, tableCellNode]);

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      if ($mergeSelectedTableCells()) {
        onClose();
      }
    });
  };

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
    });
  };

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        let insertedCell: TableCellNode | null = null;
        for (let i = 0; i < selectionCounts.rows; i++) {
          insertedCell = $insertTableRowAtSelection(shouldInsertAfter);
        }
        scrollTableCellIntoView(editor, insertedCell);
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows]
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        let insertedCell: TableCellNode | null = null;
        for (let i = 0; i < selectionCounts.columns; i++) {
          insertedCell = $insertTableColumnAtSelection(shouldInsertAfter);
        }
        scrollTableCellIntoView(editor, insertedCell);
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns]
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
      onClose();
    });
  }, [editor, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren();

      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const tableRow = tableRows[tableRowIndex];

      if (!$isTableRowNode(tableRow)) {
        throw new Error('Expected table row');
      }

      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;
      tableRow.getChildren().forEach(tableCell => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error('Expected table cell');
        }

        tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
      });

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren<TableRowNode>();
      const maxRowsLength = Math.max(...tableRows.map(row => row.getChildren().length));

      if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }

      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;
      for (let r = 0; r < tableRows.length; r++) {
        const tableRow = tableRows[r];

        if (!$isTableRowNode(tableRow)) {
          throw new Error('Expected table row');
        }

        const tableCells = tableRow.getChildren();
        if (tableColumnIndex >= tableCells.length) {
          // if cell is outside of bounds for the current row (for example various merge cell cases) we shouldn't highlight it
          continue;
        }

        const tableCell = tableCells[tableColumnIndex];

        if (!$isTableCellNode(tableCell)) {
          throw new Error('Expected table cell');
        }

        tableCell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleFirstRowFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenRows(tableNode.getFrozenRows() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleFirstColumnFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenColumns(tableNode.getFrozenColumns() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const handleCellBackgroundColor = useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          const [cell] = $getNodeTriplet(selection.anchor);
          if ($isTableCellNode(cell)) {
            cell.setBackgroundColor(value);
          }

          if ($isTableSelection(selection)) {
            const nodes = selection.getNodes();

            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if ($isTableCellNode(node)) {
                node.setBackgroundColor(value);
              }
            }
          }
        }
      });
    },
    [editor]
  );

  const formatVerticalAlign = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const [cell] = $getNodeTriplet(selection.anchor);
        if ($isTableCellNode(cell)) {
          cell.setVerticalAlign(value);
        }

        if ($isTableSelection(selection)) {
          const nodes = selection.getNodes();

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if ($isTableCellNode(node)) {
              node.setVerticalAlign(value);
            }
          }
        }
      }
    });
  };

  let mergeCellButton: null | JSX.Element = null;
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = (
        <button type="button" className="item" onClick={() => mergeTableCellsAtSelection()} data-test-id="table-merge-cells">
          <span className="text">{t('lexical.plugins.table.actions.merge-cell')}</span>
        </button>
      );
    } else if (canUnmergeCell) {
      mergeCellButton = (
        <button type="button" className="item" onClick={() => unmergeTableCellsAtSelection()} data-test-id="table-unmerge-cells">
          <span className="text">{t('lexical.plugins.table.actions.unmerge-cell')}</span>
        </button>
      );
    }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="citeck-lexical-editor__dropdown"
      ref={dropDownRef}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <div className="dropdown">
        {mergeCellButton}
        <button
          type="button"
          className="item"
          onClick={() =>
            showColorPickerModal(t('lexical.plugins.table.actions.cell-bg-color'), () => (
              <ColorPicker color={backgroundColor} onChange={handleCellBackgroundColor} />
            ))
          }
          data-test-id="table-background-color"
        >
          <span className="text">{t('lexical.plugins.table.actions.bg-color')}</span>
        </button>
        <button type="button" className="item" onClick={() => toggleRowStriping()} data-test-id="table-row-striping">
          <span className="text">{t('lexical.plugins.table.actions.toggle-row-striping')}</span>
        </button>
        <DropDown
          buttonLabel={t('lexical.plugins.table.actions.vertical-align')}
          buttonClassName="item"
          buttonAriaLabel={t('lexical.plugins.table.actions.vertical-align-label')}
        >
          <DropDownItem
            onClick={() => {
              formatVerticalAlign('top');
            }}
            className="item wide"
          >
            <div className="icon-text-container">
              <i className="icon vertical-top" />
              <span className="text">{t('lexical.plugins.table.actions.top-align')}</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              formatVerticalAlign('middle');
            }}
            className="item wide"
          >
            <div className="icon-text-container">
              <i className="icon vertical-middle" />
              <span className="text">{t('lexical.plugins.table.actions.middle-align')}</span>
            </div>
          </DropDownItem>
          <DropDownItem
            onClick={() => {
              formatVerticalAlign('bottom');
            }}
            className="item wide"
          >
            <div className="icon-text-container">
              <i className="icon vertical-bottom" />
              <span className="text">{t('lexical.plugins.table.actions.bottom-align')}</span>
            </div>
          </DropDownItem>
        </DropDown>
        <button type="button" className="item" onClick={() => toggleFirstRowFreeze()} data-test-id="table-freeze-first-row">
          <span className="text">{t('lexical.plugins.table.actions.toggle-first-row-freeze')}</span>
        </button>
        <button type="button" className="item" onClick={() => toggleFirstColumnFreeze()} data-test-id="table-freeze-first-column">
          <span className="text">{t('lexical.plugins.table.actions.toggle-first-column-freeze')}</span>
        </button>
        <hr />
        <button type="button" className="item" onClick={() => insertTableRowAtSelection(false)} data-test-id="table-insert-row-above">
          <span className="text">
            {t('insert')}{' '}
            {selectionCounts.rows === 1
              ? t('lexical.plugins.table.actions.row')
              : `${selectionCounts.rows} ${t('lexical.plugins.table.actions.rows')}`}{' '}
            {t('lexical.plugins.table.actions.above')}
          </span>
        </button>
        <button type="button" className="item" onClick={() => insertTableRowAtSelection(true)} data-test-id="table-insert-row-below">
          <span className="text">
            {t('insert')}{' '}
            {selectionCounts.rows === 1
              ? t('lexical.plugins.table.actions.row')
              : `${selectionCounts.rows} ${t('lexical.plugins.table.actions.rows')}`}{' '}
            {t('lexical.plugins.table.actions.below')}
          </span>
        </button>
        <hr />
        <button
          type="button"
          className="item"
          onClick={() => insertTableColumnAtSelection(false)}
          data-test-id="table-insert-column-before"
        >
          <span className="text">
            {t('insert')}{' '}
            {selectionCounts.columns === 1
              ? t('lexical.plugins.table.actions.column')
              : `${selectionCounts.columns} ${t('lexical.plugins.table.actions.columns')}`}{' '}
            {t('lexical.plugins.table.actions.left')}
          </span>
        </button>
        <button type="button" className="item" onClick={() => insertTableColumnAtSelection(true)} data-test-id="table-insert-column-after">
          <span className="text">
            {t('insert')}{' '}
            {selectionCounts.columns === 1
              ? t('lexical.plugins.table.actions.column')
              : `${selectionCounts.columns} ${t('lexical.plugins.table.actions.columns')}`}{' '}
            {t('lexical.plugins.table.actions.right')}
          </span>
        </button>
        <hr />
        <button type="button" className="item" onClick={() => deleteTableColumnAtSelection()} data-test-id="table-delete-columns">
          <span className="text">{t('lexical.plugins.table.actions.delete.column')}</span>
        </button>
        <button type="button" className="item" onClick={() => deleteTableRowAtSelection()} data-test-id="table-delete-rows">
          <span className="text">{t('lexical.plugins.table.actions.delete.row')}</span>
        </button>
        <button type="button" className="item" onClick={() => deleteTableAtSelection()} data-test-id="table-delete">
          <span className="text">{t('lexical.plugins.table.actions.delete.table')}</span>
        </button>
        <hr />
        <button type="button" className="item" onClick={() => toggleTableRowIsHeader()}>
          <span className="text">
            {(tableCellNode.__headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW ? t('remove') : t('add')}{' '}
            {t('lexical.plugins.table.actions.action.row-header')}
          </span>
        </button>
        <button type="button" className="item" onClick={() => toggleTableColumnIsHeader()} data-test-id="table-column-header">
          <span className="text">
            {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN ? t('remove') : t('add')}{' '}
            {t('lexical.plugins.table.actions.action.column-header')}
          </span>
        </button>
      </div>
    </div>,
    document.body
  );
}

export default TableActionMenu;
