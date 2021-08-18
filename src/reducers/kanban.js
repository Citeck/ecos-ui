import { handleActions } from 'redux-actions';
import { getBoardConfig, setBoardConfig, setBoardList, setIsEnabled } from '../actions/kanban';
import { startLoading, updateState } from '../helpers/redux';

export const initialState = {
  isLoading: false,
  boardConfig: undefined,
  boardList: undefined
};

export default handleActions(
  {
    [getBoardConfig]: startLoading(initialState),
    [setBoardConfig]: (state, { payload }) => {
      const { stateId, boardConfig } = payload;
      return updateState(state, stateId, { boardConfig, isLoading: false }, initialState);
    },
    [setBoardList]: (state, { payload }) => {
      const { stateId, boardList } = payload;
      return updateState(state, stateId, { boardList }, initialState);
    },
    [setIsEnabled]: (state, { payload }) => {
      const { stateId, isEnabled } = payload;
      return updateState(state, stateId, { isEnabled }, initialState);
    }
  },
  {}
);
