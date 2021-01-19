import { EditorState, ContentState, SelectionState, RichUtils } from 'draft-js';
import * as DraftHelpers from '../draft';
import { BUTTONS_TYPE } from '../draft';

export const getState = defaultText => {
  if (defaultText) {
    return EditorState.createWithContent(ContentState.createFromText(defaultText));
  }

  return EditorState.createEmpty('empty-state');
};

export const getNewStateWithSelectedText = (
  start = 0,
  end = 0,
  text = "Work hard to get what you like, otherwise you'll be forced to just like what you get."
) => {
  const state = getState(text);
  const key = state
    .getCurrentContent()
    .getFirstBlock()
    .getKey();
  const selection = SelectionState.createEmpty(key)
    .set('anchorOffset', start)
    .set('focusOffset', end);

  return EditorState.acceptSelection(state, selection);
};

export const getStateWithSelectedText = (editorState, start, end) => {
  const key = editorState
    .getCurrentContent()
    .getFirstBlock()
    .getKey();
  const selection = SelectionState.createEmpty(key)
    .set('anchorOffset', start)
    .set('focusOffset', end);

  return EditorState.acceptSelection(editorState, selection);
};

export const getStateWithAddedLinkBySelection = (editorState, linkData) => {
  let contentState = editorState.getCurrentContent();

  contentState = contentState.createEntity(BUTTONS_TYPE.LINK, 'MUTABLE', linkData);

  return DraftHelpers.modifierSelectedBlocks(editorState, modifier, contentState.getLastCreatedEntityKey());
};

export const modifier = (state, selection, entityKey) => {
  return RichUtils.toggleLink(state, selection, entityKey);
};
