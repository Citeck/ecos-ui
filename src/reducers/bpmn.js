import { handleActions } from 'redux-actions';
import {
  setViewType,
  setActiveSortFilter,
  setSearchText,
  setIsReady,
  setCategories,
  setModels,
  createCategory,
  cancelEditCategory,
  setIsEditable,
  setCategoryData,
  deleteCategory
} from '../actions/bpmn';
import { VIEW_TYPE_CARDS, SORT_FILTER_LAST_MODIFIED } from '../constants/bpmn';

const initialState = {
  isReady: false,
  categories: [],
  models: [],
  viewType: VIEW_TYPE_CARDS,
  sortFilter: SORT_FILTER_LAST_MODIFIED,
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
    },
    [createCategory]: (state, action) => {
      let newCategory = {
        id: `temp-${new Date().getTime()}`,
        label: '',
        isEditable: true,
        isTemporary: true,
        canWrite: true
      };

      if (action.payload && action.payload.parentId) {
        newCategory.parentId = action.payload.parentId;
      }

      return {
        ...state,
        categories: [...state.categories, newCategory]
      };
    },
    [cancelEditCategory]: (state, action) => {
      const categoryId = action.payload;
      const index = state.categories.findIndex(item => item.id === categoryId);

      let newCategoryList = [];
      if (state.categories[index].isTemporary) {
        newCategoryList = state.categories.filter(item => item.id !== categoryId);
      } else {
        newCategoryList = [...state.categories];
        newCategoryList.splice(index, 1, {
          ...state.categories[index],
          label: state.categories[index].oldLabel,
          isEditable: false,
          oldLabel: ''
        });
      }

      return {
        ...state,
        categories: newCategoryList
      };
    },
    [setIsEditable]: (state, action) => {
      const categoryId = action.payload;
      const index = state.categories.findIndex(item => item.id === categoryId);

      const newCategoryList = [...state.categories];
      newCategoryList.splice(index, 1, {
        ...state.categories[index],
        isEditable: true,
        oldLabel: state.categories[index].label
      });

      return {
        ...state,
        categories: newCategoryList
      };
    },
    [setCategoryData]: (state, action) => {
      const categoryId = action.payload.id;
      const index = state.categories.findIndex(item => item.id === categoryId);

      const currentCategory = {
        ...state.categories[index],
        isEditable: false,
        isTemporary: false,
        oldLabel: '',
        modified: new Date().getTime()
      };

      if (action.payload.label) {
        currentCategory.label = action.payload.label;
      }

      if (action.payload.newId) {
        currentCategory.id = action.payload.newId;
      }

      const newCategoryList = [...state.categories];
      newCategoryList.splice(index, 1, currentCategory);

      return {
        ...state,
        categories: newCategoryList
      };
    },
    [deleteCategory]: (state, action) => {
      const categoryId = action.payload;
      const newCategoryList = state.categories.filter(item => item.id !== categoryId);

      return {
        ...state,
        categories: newCategoryList
      };
    }
  },
  initialState
);
