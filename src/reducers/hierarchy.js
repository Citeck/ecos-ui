import { handleActions } from 'redux-actions';

import { setIsHierarchyEnabled } from '../actions/hierarchy';
import { handleAction } from '../helpers/redux';

export const initialState = {};

Object.freeze(initialState);

export default handleActions(
  {
    [setIsHierarchyEnabled]: (state, action) => {
      const stateId = action.payload.stateId;
      action = handleAction(action);

      return {
        ...state,
        [stateId]: {
          ...state[stateId],
          isEnabled: !!action.payload
        }
      };
    }
  },
  initialState
);
