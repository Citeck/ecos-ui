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
    [getVersions]: (state, { payload }) => {
      let ownState = { ...initialState };

      if (state[payload.id]) {
        ownState = { ...ownState, ...state[payload.id] };
      }

      return {
        ...state,
        [payload.id]: {
          ...ownState,
          listIsLoading: true
        }
      };
    },
    [setVersions]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        hasMore: payload.hasMore,
        totalCount: payload.totalCount,
        versions: payload.versions,
        listIsLoading: false
      }
    }),

    [addNewVersion]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        addModalIsLoading: true,
        addModalErrorMessage: ''
      }
    }),
    [addNewVersionSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        addModalIsLoading: false,
        addModalIsShow: false,
        addModalErrorMessage: ''
      }
    }),
    [addNewVersionError]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        addModalIsLoading: false,
        addModalErrorMessage: payload.message
      }
    }),

    [toggleModal]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        [`${payload.key}ModalIsShow`]: !state[`${payload.key}ModalIsShow`]
      }
    }),

    [setActiveVersion]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        changeVersionModalIsLoading: true
      }
    }),
    [setActiveVersionSuccess]: (state, { payload }) => ({
      ...state,
      [payload]: {
        ...state[payload],
        changeVersionModalIsLoading: false,
        changeVersionModalIsShow: false,
        changeVersionModalErrorMessage: ''
      }
    }),
    [setActiveVersionError]: (state, { payload }) => ({
      ...state,
      [payload.id]: {
        ...state[payload.id],
        changeVersionModalIsLoading: false,
        changeVersionModalErrorMessage: payload.message
      }
    })
  },
  {}
);
