import { createAction } from 'redux-actions';

const prefix = 'bpmn/';

export const setViewType = createAction(prefix + 'SET_VIEW_TYPE');
export const setActiveSortFilter = createAction(prefix + 'SET_ACTIVE_SORT_FILTER');
export const setSearchText = createAction(prefix + 'SET_SEARCH_TEXT');
export const setCategories = createAction(prefix + 'SET_CATEGORIES');
export const setModels = createAction(prefix + 'SET_MODELS');
export const setIsReady = createAction(prefix + 'SET_IS_READY');
export const setIsEditable = createAction(prefix + 'SET_IS_EDITABLE');
export const createCategory = createAction(prefix + 'CREATE_CATEGORY');
export const cancelEditCategory = createAction(prefix + 'CANCEL_EDIT_CATEGORY');
export const setCategoryData = createAction(prefix + 'SET_CATEGORY_DATA');
export const setCategoryCollapseState = createAction(prefix + 'SET_CATEGORY_COLLAPSE_STATE');
export const deleteCategory = createAction(prefix + 'DELETE_CATEGORY');

export const initRequest = createAction(prefix + 'INIT_REQUEST');
export const saveCategoryRequest = createAction(prefix + 'SAVE_CATEGORY_REQUEST');
export const deleteCategoryRequest = createAction(prefix + 'DELETE_CATEGORY_REQUEST');
export const saveProcessModelRequest = createAction(prefix + 'SAVE_PROCESS_MODEL_REQUEST');
export const importProcessModelRequest = createAction(prefix + 'IMPORT_PROCESS_MODEL_REQUEST');

export const showModelCreationForm = createAction(prefix + 'SHOW_MODEL_CREATION_FROM');
export const showImportModelForm = createAction(prefix + 'SHOW_IMPORT_MODEL_FROM');

export const savePagePosition = createAction(prefix + 'SAVE_PAGE_POSITION');

export const fetchSectionList = createAction(prefix + 'GET_SECTION_LIST');
export const setSectionList = createAction(prefix + 'SET_SECTION_LIST');
export const setActiveSection = createAction(prefix + 'SET_ACTIVE_SECTION');
