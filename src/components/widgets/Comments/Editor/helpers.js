import { EditorState, SelectionState } from 'draft-js';

export const getNewEditorStateWithAllBlockSelected = editorState => {
  if (!editorState) {
    console.warn('editorState is empty!');
    return null;
  }

  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const startOffset = selection.getStartOffset();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(startKey);
  const linkKey = block.getEntityAt(startOffset);

  if (linkKey === null) {
    return editorState;
  }

  let start = 0;
  let end = 0;

  block.findEntityRanges(
    item => item.getEntity() === linkKey,
    (startOffset, endOffset) => {
      start = startOffset;
      end = endOffset;
    }
  );

  if (start === end) {
    return editorState;
  }

  const newSelection = SelectionState.createEmpty(startKey)
    .set('anchorOffset', start)
    .set('focusOffset', end);

  return EditorState.acceptSelection(editorState, newSelection);
};

export const getSelectionText = editorState => {
  if (!editorState) {
    console.warn('editorState is empty!');
    return '';
  }

  const selection = editorState.getSelection();
  const startKey = selection.getStartKey();
  const startOffset = selection.getStartOffset();
  const endOffset = selection.getEndOffset();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(startKey);

  return block
    .getText()
    .slice(startOffset, endOffset)
    .trim();
};

export const BUTTONS_TYPE = {
  BOLD: 'BOLD',
  ITALIC: 'ITALIC',
  UNDERLINE: 'UNDERLINE',
  LIST: 'unordered-list-item',
  LINK: 'LINK'
};

export const KEY_COMMANDS = {
  SEND: 'comment-send'
};
