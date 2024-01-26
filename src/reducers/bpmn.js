import { handleActions } from 'redux-actions';
import {
  cancelEditCategory,
  createCategory,
  deleteCategory,
  setActiveSortFilter,
  setCategories,
  setCategoryCollapseState,
  setCategoryData,
  setIsEditable,
  setIsReady,
  setCreateVariants,
  setTotalCount,
  setSearchText,
  setIsModelsLoading,
  setModelsInfoByCategoryId,
  setViewType
} from '../actions/bpmn';
import { SORT_FILTER_LAST_MODIFIED, ViewTypes } from '../constants/commonDesigner';

const initialState = {
  isReady: false,
  categories: [],
  totalCount: null,
  models: [],
  modelsMap: new Map(),
  viewType: ViewTypes.CARDS,
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
    [setTotalCount]: (state, action) => {
      return {
        ...state,
        totalCount: action.payload
      };
    },
    [setModelsInfoByCategoryId]: (state, action) => {
      const { categoryId, page, models, hasMore, force, isNextModelsLoading, prevCategoryId, prevModels } = action.payload;
      const modelsMap = state.modelsMap;
      const modelsInfo = modelsMap.get(categoryId) || {};
      const prevModelsInfo = modelsMap.get(prevCategoryId);

      if (!isNextModelsLoading) {
        modelsInfo.isNextModelsLoading = isNextModelsLoading;
        modelsInfo.hasMore = hasMore;
        modelsInfo.models = force ? models : (modelsInfo.models || []).concat(models);
        modelsInfo.page = page;
        modelsInfo.isLoading = false;
      } else {
        modelsInfo.isNextModelsLoading = true;
      }

      modelsMap.set(categoryId, { ...modelsInfo });

      if (prevModelsInfo) {
        prevModelsInfo.models = prevModels;
        modelsMap.set(prevCategoryId, { ...prevModelsInfo });
      }

      return {
        ...state,
        modelsMap: new Map(modelsMap)
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
    [setIsModelsLoading]: (state, action) => {
      const { categoryId, isLoading } = action.payload;
      const modelsMap = state.modelsMap;
      const modelsInfo = modelsMap.get(categoryId) || {};

      modelsMap.set(categoryId, { ...modelsInfo, isLoading });

      return {
        ...state,
        modelsMap: new Map(modelsMap)
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

      if (action.payload.code) {
        currentCategory.code = action.payload.code;
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
    [setCategoryCollapseState]: (state, action) => {
      const categoryId = action.payload.id;
      const index = state.categories.findIndex(item => item.id === categoryId);

      const currentCategory = {
        ...state.categories[index],
        isOpen: action.payload.isOpen
      };

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
