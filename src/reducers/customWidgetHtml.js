import { handleActions } from 'redux-actions';

import { setEditorMode, setHtml, setLoading } from '../actions/customWidgetHtml';
import { handleAction } from '../helpers/redux';

export const initialState = {};
export const defaultState = {
  isVisibleEditor: false,
  loading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setEditorMode]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          isVisibleEditor: !!action.payload
        }
      };
    },
    [setHtml]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          html: action.payload
        }
      };
    },
    [setLoading]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          loading: !!action.payload
        }
      };
    }
  },
  initialState
);
