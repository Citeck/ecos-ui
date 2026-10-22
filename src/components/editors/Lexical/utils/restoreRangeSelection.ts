import { $getNodeByKey, $getRoot, $isElementNode, $isTextNode, $setSelection, RangeSelection } from 'lexical';

/** Restore an async insertion target only while its points still belong to the document. */
export function $restoreRangeSelection(selection: RangeSelection | null): void {
  const canRestore =
    selection &&
    [selection.anchor, selection.focus].every(point => {
      const node = $getNodeByKey(point.key);

      if (!node?.isAttached()) {
        return false;
      }

      if (point.type === 'text') {
        return $isTextNode(node) && point.offset <= node.getTextContentSize();
      }

      return $isElementNode(node) && point.offset <= node.getChildrenSize();
    });

  if (canRestore) {
    $setSelection(selection.clone());
  } else {
    $getRoot().selectEnd();
  }
}
