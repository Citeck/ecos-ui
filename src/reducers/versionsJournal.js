import { handleActions } from 'redux-actions';
import {
  addNewVersion,
  addNewVersionError,
  addNewVersionSuccess,
  getVersions,
  setActiveVersion,
  setActiveVersionError,
  setActiveVersionSuccess,
  setVersions,
  toggleModal
} from '../actions/versionsJournal';

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
    [getVersions]: (state, { payload }) => ({
      ...state,
      listIsLoading: true
    }),
    [setVersions]: (state, { payload }) => ({
      ...state,
      hasMore: payload.hasMore,
      totalCount: payload.totalCount,
      versions: payload.versions,
      listIsLoading: false
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
    }),

    [setActiveVersion]: (state, { payload }) => ({
      ...state,
      changeVersionModalIsLoading: true
    }),
    [setActiveVersionSuccess]: state => ({
      ...state,
      changeVersionModalIsLoading: false,
      changeVersionModalIsShow: false,
      changeVersionModalErrorMessage: ''
    }),
    [setActiveVersionError]: (state, { payload }) => ({
      ...state,
      changeVersionModalIsLoading: false,
      changeVersionModalErrorMessage: payload
    })
  },
  initialState
);
