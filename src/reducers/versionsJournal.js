import { handleActions } from 'redux-actions';
import { addNewVersion, addNewVersionError, addNewVersionSuccess, setVersions, toggleAddModal } from '../actions/versionsJournal';

const initialState = {
  versions: [],
  hasMore: false,
  totalCount: 0,
  addModalIsLoading: false,
  addModalIsShow: false,
  addModalErrorMessage: '',
  listIsLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [setVersions]: (state, { payload }) => ({
      ...state,
      hasMore: payload.hasMore,
      totalCount: payload.totalCount,
      versions: payload.versions
    }),
    [addNewVersion]: state => ({
      ...state,
      addModalIsLoading: true,
      addModalErrorMessage: ''
    }),
    [addNewVersionSuccess]: state => ({
      ...state,
      addModalIsLoading: false,
      addModalIsShow: false,
      addModalErrorMessage: ''
    }),
    [addNewVersionError]: (state, { payload }) => ({
      ...state,
      addModalIsLoading: false,
      addModalErrorMessage: payload
    }),
    [toggleAddModal]: state => ({
      ...state,
      addModalIsShow: !state.addModalIsShow
    })
  },
  initialState
);
