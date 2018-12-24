import { handleActions } from 'redux-actions';
import { setViewType, setActiveSortFilter } from '../actions/bpmn';
import { ViewTypeCards, SortFilterLastModified } from '../constants/bpmn';

const initialState = {
  viewType: ViewTypeCards,
  sortFilter: SortFilterLastModified
};

Object.freeze(initialState);

export default handleActions(
  {
    [setViewType]: (state, action) => {
      return {
        ...state,
        viewType: action.payload
      };
    },
    [setActiveSortFilter]: (state, action) => {
      return {
        ...state,
        sortFilter: action.payload
      };
    }
  },
  initialState
);
