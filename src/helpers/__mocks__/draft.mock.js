import { EditorState, ContentState, SelectionState, RichUtils } from 'draft-js';

export const getState = defaultText => {
  if (defaultText) {
    return EditorState.createWithContent(ContentState.createFromText(defaultText));
  }

  return EditorState.createEmpty('empty-state');
};

export const getStateWithSelectedText = (
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

export const modifier = (state, selection, entityKey) => {
  return RichUtils.toggleLink(state, selection, entityKey);
};
