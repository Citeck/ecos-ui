import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { trimTextContentFromAnchor } from '@lexical/selection';
import { $restoreEditorState } from '@lexical/utils';
import { $getSelection, $isRangeSelection, RootNode } from 'lexical';
import { useEffect } from 'react';

const MaxLengthPlugin = ({ maxLength, onError }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () => {
      let lastRestoredEditorState = null;

      return editor.registerNodeTransform(RootNode, rootNode => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return;
        }

        const prevEditorState = editor.getEditorState();
        const prevTextContentSize = prevEditorState.read(() => rootNode.getTextContentSize());
        const textContentSize = rootNode.getTextContentSize();
        if (prevTextContentSize !== textContentSize) {
          const delCount = textContentSize - maxLength;
          const anchor = selection.anchor;

          if (delCount > 0) {
            // Restore the old editor state instead if the last
            // text content was already at the limit.
            if (prevTextContentSize === maxLength && lastRestoredEditorState !== prevEditorState) {
              lastRestoredEditorState = prevEditorState;
              $restoreEditorState(editor, prevEditorState);
            } else {
              trimTextContentFromAnchor(editor, anchor, delCount);
              onError(maxLength);
            }
          }
        }
      });
    },
    [editor, maxLength]
  );

  return null;
};

export default MaxLengthPlugin;
