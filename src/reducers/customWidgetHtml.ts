import { handleActions } from 'redux-actions';

import { setEditorMode, setHtml, setLoading } from '@/actions/customWidgetHtml';
import { handleAction } from '@/helpers/redux';
import { ObjectStateWidgetHtml, StateWidgetHtml } from '@/types/store/customWidgetHtml';

export const initialState: StateWidgetHtml = {};
export const defaultState: ObjectStateWidgetHtml = {
  isVisibleEditor: false,
  loading: false,
  html: null
};

Object.freeze(initialState);

export default handleActions<StateWidgetHtml, any>(
  {
    [setEditorMode.toString()]: (state, action): StateWidgetHtml => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...defaultState,
          ...state[stateId],
          isVisibleEditor: !!action.payload
        }
      };
    },
    [setHtml.toString()]: (state, action): StateWidgetHtml => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...defaultState,
          ...state[stateId],
          html: action.payload
        }
      };
    },
    [setLoading.toString()]: (state, action): StateWidgetHtml => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...defaultState,
          ...state[stateId],
          loading: !!action.payload
        }
      };
    }
  },
  initialState
);
