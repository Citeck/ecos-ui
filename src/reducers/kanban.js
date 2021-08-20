import { handleActions } from 'redux-actions';
import {
  getBoardConfig,
  setBoardConfig,
  setBoardList,
  setDataCards,
  setFormProps,
  setIsEnabled,
  setLoading,
  setTotalCount
} from '../actions/kanban';
import { startLoading, updateState } from '../helpers/redux';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';

export const initialState = {
  isLoading: false,
  boardConfig: undefined,
  boardList: undefined,
  formProps: null,
  totalCount: 0,
  pagination: DEFAULT_PAGINATION
};

export default handleActions(
  {
    [getBoardConfig]: startLoading(initialState),
    [setBoardConfig]: (state, { payload }) => {
      const { stateId, boardConfig } = payload;
      return updateState(state, stateId, { boardConfig, isLoading: false }, initialState);
    },
    [setLoading]: (state, { payload }) => {
      const { stateId, isLoading } = payload;
      return updateState(state, stateId, { isLoading }, initialState);
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
      return updateState(state, stateId, { dataCards }, initialState);
    },
    [setTotalCount]: (state, { payload }) => {
      const { stateId, totalCount } = payload;
      return updateState(state, stateId, { totalCount }, initialState);
    }
  },
  {}
);
