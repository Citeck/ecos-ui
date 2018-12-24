import { handleActions } from 'redux-actions';
import { setViewType, setActiveSortFilter, setSearchText, setIsReady, setCategories, setModels } from '../actions/bpmn';
import { ViewTypeCards, SortFilterLastModified } from '../constants/bpmn';

const initialState = {
  isReady: false,
  categories: [],
  models: [],
  viewType: ViewTypeCards,
  sortFilter: SortFilterLastModified,
  searchText: ''
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
    },
    [setSearchText]: (state, action) => {
      return {
        ...state,
        searchText: action.payload
      };
    },
    [setIsReady]: (state, action) => {
      return {
        ...state,
        isReady: action.payload
      };
    },
    [setCategories]: (state, action) => {
      return {
        ...state,
        categories: action.payload
      };
    },
    [setModels]: (state, action) => {
      return {
        ...state,
        models: action.payload
      };
    }
  },
  initialState
);
