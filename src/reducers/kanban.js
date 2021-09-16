import { handleActions } from 'redux-actions';
import {
  applyFilter,
  getBoardConfig,
  reloadBoardData,
  resetFilter,
  selectBoardId,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setIsFiltered,
  setLoading,
  setLoadingColumns,
  setPagination,
  setResolvedActions,
  setTotalCount
} from '../actions/kanban';
import { getCurrentStateById, updateState } from '../helpers/redux';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

export const initialState = {
  isLoading: true,
  isLoadingColumns: [],
  isFirstLoading: true,
  isFiltered: false,
  boardConfig: undefined,
  boardList: undefined,
  formProps: null,
  totalCount: 0,
  dataCards: [],
  resolvedActions: [],
  pagination: DEFAULT_PAGINATION
};

export default handleActions(
  {
    [getBoardConfig]: (state, { payload }) => {
      return updateState(state, payload.stateId, { boardConfig: undefined, isFirstLoading: true, isLoading: true }, initialState);
    },
    [applyFilter]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isLoading: true, isFiltered: true }, initialState);
    },
    [resetFilter]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isLoading: true }, initialState);
    },
    [reloadBoardData]: (state, { payload }) => {
      return updateState(state, payload.stateId, { dataCards: [], isFirstLoading: true }, initialState);
    },
    [setBoardConfig]: (state, { payload }) => {
      const { stateId, boardConfig } = payload;
      return updateState(state, stateId, { boardConfig }, initialState);
    },
    [setLoading]: (state, { payload }) => {
      const { stateId, isLoading } = payload;
      return updateState(state, stateId, { isLoading }, initialState);
    },
    [setIsFiltered]: (state, { payload }) => {
      const { stateId, isFiltered } = payload;
      return updateState(state, stateId, { isFiltered }, initialState);
    },
    [setFormProps]: (state, { payload }) => {
      const { stateId, formProps } = payload;
      return updateState(state, stateId, { formProps }, initialState);
    },
    [setBoardList]: (state, { payload }) => {
      const { stateId, boardList } = payload;
      return updateState(state, stateId, { boardList }, initialState);
    },
    [setIsEnabled]: (state, { payload }) => {
      const { stateId, isEnabled } = payload;
      return updateState(state, stateId, { isEnabled }, initialState);
    },
    [setDataCards]: (state, { payload }) => {
      const { stateId, dataCards } = payload;
      return updateState(state, stateId, { dataCards, isFirstLoading: false }, initialState);
    },
    [setTotalCount]: (state, { payload }) => {
      const { stateId, totalCount } = payload;
      return updateState(state, stateId, { totalCount }, initialState);
    },
    [setPagination]: (state, { payload }) => {
      const { stateId, pagination } = payload;
      return updateState(state, stateId, { pagination }, initialState);
    },
    [setResolvedActions]: (state, { payload }) => {
      const { stateId, resolvedActions } = payload;
      return updateState(state, stateId, { resolvedActions }, initialState);
    },
    [setLoadingColumns]: (state, { payload }) => {
      const { stateId, isLoadingColumns } = payload;
      return updateState(state, stateId, { isLoadingColumns }, initialState);
    }
  },
  {}
);
