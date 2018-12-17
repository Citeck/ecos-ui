import { handleActions } from 'redux-actions';
import { setViewType } from '../actions/bpmn';
import { ViewTypeCards } from '../constants/bpmn';

const initialState = {
  viewType: ViewTypeCards
};

Object.freeze(initialState);

export default handleActions(
  {
    [setViewType]: (state, action) => {
      return {
        ...state,
        viewType: action.payload
      };
    }
  },
  initialState
);
