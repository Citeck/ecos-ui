/* eslint-disable header/header */
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $createTableNodeWithDimensions, $isTableCellNode, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import { render } from '@testing-library/react';
import { $getRoot, $getSelection, $isRangeSelection, LexicalEditor, LexicalNode } from 'lexical';
import React from 'react';

import {
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $moveSelectionToTableCell,
  scrollTableCellIntoView
} from '../insertion';

/**
 * The property this module exists to guarantee: after an insertion the caret — and with it the cell
 * settings chevron that follows the selection — is inside the freshly inserted cell, not on the
 * cell the user happened to be in (QA return #2 of COREDEV-326).
 */

let editor: LexicalEditor;

function CaptureEditor(): null {
  [editor] = useLexicalComposerContext();
  return null;
}

const ROWS = 2;
const COLUMNS = 3;

/** 2x3 table, caret put into the top-left cell; returns the table's node key */
function renderTableEditor(): string {
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'test',
        nodes: [TableNode, TableRowNode, TableCellNode],
        onError: (error: Error) => {
          throw error;
        },
        theme: {}
      }}
    >
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <CaptureEditor />
    </LexicalComposer>
  );

  let tableKey = '';

  editor.update(
    () => {
      const root = $getRoot();
      root.clear();

      const table = $createTableNodeWithDimensions(ROWS, COLUMNS, false);
      root.append(table);
      tableKey = table.getKey();

      const firstRow = table.getFirstChild<TableRowNode>();
      const firstCell = firstRow && firstRow.getFirstChild<TableCellNode>();

      if (firstCell) {
        $moveSelectionToTableCell(firstCell);
      }
    },
    { discrete: true }
  );

  return tableKey;
}

/** The cell the current selection sits in, or null */
function $selectedCell(): TableCellNode | null {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return null;
  }

  const cell = $findMatchingParent(selection.anchor.getNode(), (node: LexicalNode) => $isTableCellNode(node));

  return $isTableCellNode(cell) ? cell : null;
}

describe('table insertion moves the caret into what was inserted', () => {
  it('a new row: the caret lands in its first cell, which is also returned for scrolling', () => {
    const tableKey = renderTableEditor();

    let insertedCellKey = '';

    editor.update(
      () => {
        const insertedCell = $insertTableRowAtSelection(true);
        insertedCellKey = insertedCell ? insertedCell.getKey() : '';
      },
      { discrete: true }
    );

    expect(insertedCellKey).not.toBe('');

    editor.getEditorState().read(() => {
      const cell = $selectedCell();

      expect(cell).not.toBeNull();
      // The caret is exactly in the cell the caller is told to scroll into view
      expect(cell && cell.getKey()).toBe(insertedCellKey);
      // The row went into the right table and made it taller
      const table = cell && cell.getParentOrThrow().getParentOrThrow();
      expect(table && table.getKey()).toBe(tableKey);
      expect(table && table.getChildrenSize()).toBe(ROWS + 1);
    });
  });

  it('a new column: the caret lands in its cell of the current row', () => {
    renderTableEditor();

    let insertedCellKey = '';

    editor.update(
      () => {
        const insertedCell = $insertTableColumnAtSelection(true);
        insertedCellKey = insertedCell ? insertedCell.getKey() : '';
      },
      { discrete: true }
    );

    expect(insertedCellKey).not.toBe('');

    editor.getEditorState().read(() => {
      const cell = $selectedCell();

      expect(cell).not.toBeNull();
      expect(cell && cell.getKey()).toBe(insertedCellKey);
      expect(cell && cell.getParentOrThrow().getChildrenSize()).toBe(COLUMNS + 1);
    });
  });

  it('$moveSelectionToTableCell selects the start of an arbitrary cell', () => {
    renderTableEditor();

    let targetCellKey = '';

    editor.update(
      () => {
        const table = $getRoot().getFirstChild<TableNode>();
        const lastRow = table && table.getLastChild<TableRowNode>();
        const lastCell = lastRow && lastRow.getLastChild<TableCellNode>();

        if (lastCell) {
          targetCellKey = lastCell.getKey();
          $moveSelectionToTableCell(lastCell);
        }
      },
      { discrete: true }
    );

    editor.getEditorState().read(() => {
      const cell = $selectedCell();

      expect(cell).not.toBeNull();
      expect(cell && cell.getKey()).toBe(targetCellKey);
    });
  });

  it('$moveSelectionToTableCell handles a cell with no content to select into', () => {
    renderTableEditor();

    let targetCellKey = '';

    editor.update(
      () => {
        const table = $getRoot().getFirstChild<TableNode>();
        const lastRow = table && table.getLastChild<TableRowNode>();
        const lastCell = lastRow && lastRow.getLastChild<TableCellNode>();

        if (lastCell) {
          // An empty cell has no descendant to delegate to — the cell itself takes the selection
          lastCell.clear();
          targetCellKey = lastCell.getKey();
          $moveSelectionToTableCell(lastCell);
        }
      },
      { discrete: true }
    );

    editor.getEditorState().read(() => {
      const cell = $selectedCell();

      expect(cell).not.toBeNull();
      expect(cell && cell.getKey()).toBe(targetCellKey);
    });
  });
});

describe('scrollTableCellIntoView', () => {
  let rafSpy: jest.SpyInstance;

  beforeEach(() => {
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    rafSpy.mockRestore();
    delete (Element.prototype as any).scrollIntoView;
  });

  it('scrolls the DOM element of the given cell into view', () => {
    renderTableEditor();

    let cell: TableCellNode | null = null;

    editor.getEditorState().read(() => {
      cell = $selectedCell();
    });

    scrollTableCellIntoView(editor, cell);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('does nothing without a cell', () => {
    renderTableEditor();

    scrollTableCellIntoView(editor, null);

    expect(rafSpy).not.toHaveBeenCalled();
  });
});
