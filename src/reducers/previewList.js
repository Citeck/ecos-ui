import { handleActions } from 'redux-actions';
import {
  setInitiatedPreviewList,
  setIsEnabledPreviewList,
  setLoadingPreviewList,
  setPreviewList,
  setPreviewListConfig
} from '../actions/previewList';
import { handleAction } from '../helpers/redux';

export const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [setIsEnabledPreviewList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          isEnabled: !!action.payload
        }
      };
    },
    [setPreviewList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          ...action.payload
        }
      };
    },
    [setPreviewListConfig]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          config: action.payload
        }
      };
    },
    [setLoadingPreviewList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          isLoading: !!action.payload
        }
      };
    },
    [setInitiatedPreviewList]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          isInitiated: !!action.payload
        }
      };
    }
  },
  initialState
);
