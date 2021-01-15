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

export const getSelectedBlocks = (editorState, startKey, endKey) => {
  if (!editorState) {
    console.warn('editorState is empty!');
    return null;
  }

  const currentSelection = editorState.getSelection();
  const contentState = editorState.getCurrentContent();

  if (startKey === undefined) {
    startKey = currentSelection.getStartKey();
  }

  if (endKey === undefined) {
    endKey = currentSelection.getEndKey();
  }

  const isSameBlock = startKey === endKey;
  const startingBlock = contentState.getBlockForKey(startKey);
  const selectedBlocks = [startingBlock];

  if (!isSameBlock) {
    let blockKey = startKey;

    while (blockKey !== endKey) {
      const nextBlock = contentState.getBlockAfter(blockKey);

      selectedBlocks.push(nextBlock);
      blockKey = nextBlock.getKey();
    }
  }

  return selectedBlocks;
};

export const modifierSelectedBlocks = (editorState, modifier, ...args) => {
  if (!editorState) {
    console.warn('editorState is empty!');
    return null;
  }

  const currentSelection = editorState.getSelection();
  const startKey = currentSelection.getStartKey();
  const endKey = currentSelection.getEndKey();
  const startOffset = currentSelection.getStartOffset();
  const endOffset = currentSelection.getEndOffset();
  const isSameBlock = startKey === endKey;
  const selectedBlocks = getSelectedBlocks(editorState, startKey, endKey);

  if (!selectedBlocks) {
    console.warn('selectedBlocks is empty!');
    return null;
  }

  let finalEditorState = editorState;

  selectedBlocks.forEach(block => {
    const currentBlockKey = block.getKey();
    let selectionStart;
    let selectionEnd;

    if (currentBlockKey === startKey) {
      selectionStart = startOffset;
      selectionEnd = isSameBlock ? endOffset : block.getText().length;
    } else if (currentBlockKey === endKey) {
      selectionStart = isSameBlock ? startOffset : 0;
      selectionEnd = endOffset;
    } else {
      selectionStart = 0;
      selectionEnd = block.getText().length;
    }

    const selection = SelectionState.createEmpty(currentBlockKey)
      .set('anchorOffset', selectionStart)
      .set('focusOffset', selectionEnd);

    finalEditorState = modifier(finalEditorState, selection, ...args);
  });

  return EditorState.forceSelection(finalEditorState, currentSelection);
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
