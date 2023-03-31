import { handleActions } from 'redux-actions';
import {
  setIsReady,
  setIsCategoryOpen,
  setCategories,
  setModels,
  setViewType,
  setSearchText,
  cancelEditCategory,
  createCategory,
  deleteCategory,
  setIsEditable,
  setCreateVariants,
  setCategoryData
} from '../actions/dmn';
import { ViewTypes } from '../constants/commonDesigner';

const initialState = {
  isReady: false,
  categories: [],
  models: [],
  viewType: ViewTypes.CARDS,
  searchText: '',
  createVariants: []
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
    [setCreateVariants]: (state, action) => {
      return {
        ...state,
        createVariants: action.payload
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
    [setIsCategoryOpen]: (state, action) => {
      const categoryId = action.payload.id;
      const index = state.categories.findIndex(item => item.id === categoryId);

      if (index === -1) {
        return state.categories;
      }

      const currentCategory = {
        ...state.categories[index],
        isOpen: action.payload.isOpen
      };

      const newCategories = [...state.categories];
      newCategories.splice(index, 1, currentCategory);

      return {
        ...state,
        categories: newCategories
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
