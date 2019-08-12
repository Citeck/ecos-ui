import { handleActions } from 'redux-actions';
import { addNewVersion, addNewVersionError, addNewVersionSuccess, setVersions, toggleModal } from '../actions/versionsJournal';

const initialState = {
  versions: [],
  hasMore: false,
  totalCount: 0,
  listIsLoading: false,

  addModalIsLoading: false,
  addModalIsShow: false,
  addModalErrorMessage: '',

  changeVersionModalIsShow: false,
  changeVersionModalIsLoading: false,
  changeVersionModalErrorMessage: ''
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
    [toggleModal]: (state, { payload }) => ({
      ...state,
      [`${payload}ModalIsShow`]: !state[`${payload}ModalIsShow`]
    })
  },
  initialState
);
