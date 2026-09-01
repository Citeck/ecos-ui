/* eslint-disable header/header */
import { $insertTableColumn__EXPERIMENTAL, $insertTableRow__EXPERIMENTAL, $isTableCellNode, TableCellNode } from '@lexical/table';
import { LexicalEditor } from 'lexical';

/**
 * Puts the caret in a freshly inserted cell. Everything that tracks the selection — first of all
 * the cell settings chevron of TableActionMenuPlugin — then follows the insertion instead of
 * staying on the cell the user happened to hover.
 */
export function $moveSelectionToTableCell(cell: TableCellNode): void {
  const firstDescendant = cell.getFirstDescendant();

  if (firstDescendant == null) {
    cell.selectStart();
  } else {
    firstDescendant.getParentOrThrow().selectStart();
  }
}

/**
 * `$insertTableRow__EXPERIMENTAL` leaves the selection where it was, unlike its column counterpart
 * which moves it into the first inserted cell. Both entry points — the hover button and the cell
 * action menu — go through here so that the caret (and the chevron) always ends up in the new row.
 *
 * Returns the cell the caret was moved into, so the caller can hand it straight to
 * `scrollTableCellIntoView` — mirroring the column counterpart below.
 */
export function $insertTableRowAtSelection(insertAfter = true): TableCellNode | null {
  const insertedRow = $insertTableRow__EXPERIMENTAL(insertAfter);
  const firstCell = insertedRow?.getFirstChild();

  if ($isTableCellNode(firstCell)) {
    $moveSelectionToTableCell(firstCell);
    return firstCell;
  }

  return null;
}

/** Column counterpart: `$insertTableColumn__EXPERIMENTAL` already moves the selection itself */
export function $insertTableColumnAtSelection(insertAfter = true): TableCellNode | null {
  return $insertTableColumn__EXPERIMENTAL(insertAfter);
}

/**
 * Scrolls a just-inserted cell into view: a new column of a table wider than its wrapper lands
 * behind the horizontal clip, where neither it nor its chevron can be seen.
 */
export function scrollTableCellIntoView(editor: LexicalEditor, cell: TableCellNode | null | undefined): void {
  if (!cell) {
    return;
  }

  const key = cell.getKey();

  requestAnimationFrame(() => {
    const element = editor.getElementByKey(key);

    if (element && element.isConnected) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
}
