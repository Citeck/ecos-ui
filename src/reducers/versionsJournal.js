import { handleActions } from 'redux-actions';
import { setVersions } from '../actions/versionsJournal';

const initialState = {
  versions: [],
  hasMore: false,
  totalCount: 0
};

Object.freeze(initialState);

export default handleActions(
  {
    [setVersions]: (state, { payload }) => ({
      ...state,
      hasMore: payload.hasMore,
      totalCount: payload.totalCount,
      versions: payload.versions
    })
  },
  initialState
);
