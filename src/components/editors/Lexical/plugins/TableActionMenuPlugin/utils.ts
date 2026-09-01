/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $computeTableMapSkipCellCheck,
  $getNodeTriplet,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  $isTableSelection,
  TableCellNode,
  TableSelection
} from '@lexical/table';
import { $createParagraphNode, $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection, $isTextNode } from 'lexical';

import type { ElementNode, LexicalEditor } from 'lexical';

export function computeSelectionCount(selection: TableSelection): {
  columns: number;
  rows: number;
} {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1
  };
}

export function $canUnmerge(): boolean {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}

export function $cellContainsEmptyParagraph(cell: TableCellNode): boolean {
  if (cell.getChildrenSize() !== 1) {
    return false;
  }
  const firstChild = cell.getFirstChildOrThrow();
  return !(!$isParagraphNode(firstChild) || !firstChild.isEmpty());
}

export function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select();
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}

export function currentCellBackgroundColor(editor: LexicalEditor): null | string {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const [cell] = $getNodeTriplet(selection.anchor);
      if ($isTableCellNode(cell)) {
        return cell.getBackgroundColor();
      }
    }
    return null;
  });
}

/**
 * Merges the cells of the current table selection into its top-left cell, moving their content
 * over. Returns true when a merge actually happened, so the caller can close its menu only then.
 */
export function $mergeSelectedTableCells(): boolean {
  const selection = $getSelection();

  if (!$isTableSelection(selection)) {
    return false;
  }

  // Get all selected cells and compute the total area
  const nodes = selection.getNodes();
  const tableCells = nodes.filter($isTableCellNode);

  if (tableCells.length === 0) {
    return false;
  }

  // Find the table node
  const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCells[0]);
  const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);

  // Find the boundaries of the selection including merged cells
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  // First pass: find the actual boundaries considering merged cells
  const processedCells = new Set();
  for (const row of gridMap) {
    for (const mapCell of row) {
      if (!mapCell || !mapCell.cell) {
        continue;
      }

      const cellKey = mapCell.cell.getKey();
      if (processedCells.has(cellKey)) {
        continue;
      }

      if (tableCells.some(cell => cell.is(mapCell.cell))) {
        processedCells.add(cellKey);
        // Get the actual position of this cell in the grid
        const cellStartRow = mapCell.startRow;
        const cellStartCol = mapCell.startColumn;
        const cellRowSpan = mapCell.cell.__rowSpan || 1;
        const cellColSpan = mapCell.cell.__colSpan || 1;

        // Update boundaries considering the cell's actual position and span
        minRow = Math.min(minRow, cellStartRow);
        maxRow = Math.max(maxRow, cellStartRow + cellRowSpan - 1);
        minCol = Math.min(minCol, cellStartCol);
        maxCol = Math.max(maxCol, cellStartCol + cellColSpan - 1);
      }
    }
  }

  // Validate boundaries
  if (minRow === Infinity || minCol === Infinity) {
    return false;
  }

  // The total span of the merged cell
  const totalRowSpan = maxRow - minRow + 1;
  const totalColSpan = maxCol - minCol + 1;

  // Use the top-left cell as the target cell
  const targetCellMap = gridMap[minRow][minCol];
  if (!targetCellMap?.cell) {
    return false;
  }
  const targetCell = targetCellMap.cell;

  // Set the spans for the target cell
  targetCell.setColSpan(totalColSpan);
  targetCell.setRowSpan(totalRowSpan);

  // Move content from other cells to the target cell
  const seenCells = new Set([targetCell.getKey()]);

  // Second pass: merge content and remove other cells
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const mapCell = gridMap[row][col];
      if (!mapCell?.cell) {
        continue;
      }

      const currentCell = mapCell.cell;
      const key = currentCell.getKey();

      if (!seenCells.has(key)) {
        seenCells.add(key);
        const isEmpty = $cellContainsEmptyParagraph(currentCell);
        if (!isEmpty) {
          targetCell.append(...currentCell.getChildren());
        }
        currentCell.remove();
      }
    }
  }

  // Ensure target cell has content
  if (targetCell.getChildrenSize() === 0) {
    targetCell.append($createParagraphNode());
  }

  $selectLastDescendant(targetCell);
  return true;
}
