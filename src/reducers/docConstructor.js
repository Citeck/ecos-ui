import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  createDocument,
  deleteDocument,
  editDocument,
  getDocument,
  getSettings,
  setDocument,
  setError,
  setLoading,
  setLoadingSync,
  setSettings
} from '../actions/docConstructor';
import { getCurrentStateById } from '../helpers/redux';

const initialState = {
  isLoading: false,
  isLoadingSync: false,
  settings: {},
  documentId: null,
  documentType: null,
  error: ''
};

const setData = (state, { payload: { stateId } }, data) => ({
  ...state,
  [stateId]: {
    ...getCurrentStateById(state, stateId, initialState),
    ...data
  }
});

export default handleActions(
  {
    [getSettings]: (state, action) => setData(state, action, { isLoading: true }),
    [getDocument]: (state, action) => setData(state, action, { isLoading: true }),
    [editDocument]: (state, action) => setData(state, action, { isLoading: true }),
    [deleteDocument]: (state, action) => setData(state, action, { isLoading: true }),
    [createDocument]: (state, action) => setData(state, action, { isLoadingSync: true }),

    [setSettings]: (state, action) => setData(state, action, { isLoading: false, ...get(action, 'payload.data', {}) }),
    [setDocument]: (state, action) => setData(state, action, { isLoading: false, ...get(action, 'payload.document', {}) }),
    [setError]: (state, action) => setData(state, action, { isLoading: false, error: get(action, 'payload.error'), isLoadingSync: false }),
    [setLoading]: (state, action) => setData(state, action, { isLoading: get(action, 'payload.isLoading') }),
    [setLoadingSync]: (state, action) => setData(state, action, { isLoadingSync: get(action, 'payload.isLoadingSync') })
  },
  {}
);
