import { handleActions } from 'redux-actions';
import get from 'lodash/get';

import {
  createDocument,
  deleteDocument,
  editDocument,
  getDocument,
  getDocumentParams,
  initConstructor,
  setDocument,
  setError,
  setLoading,
  setSettings
} from '../actions/docConstructor';
import { getCurrentStateById, startLoading } from '../helpers/redux';

const initialState = {
  isLoading: false,
  docOneUrl: null,
  docOneDocumentId: null,
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
    [initConstructor]: startLoading(initialState),
    [getDocumentParams]: startLoading(initialState),
    [getDocument]: startLoading(initialState),
    [editDocument]: startLoading(initialState),
    [deleteDocument]: startLoading(initialState),
    [createDocument]: startLoading(initialState),

    [setSettings]: (state, action) => setData(state, action, { isLoading: false, ...get(action, 'payload.settings', {}) }),
    [setDocument]: (state, action) => setData(state, action, { isLoading: false, ...get(action, 'payload.document', {}) }),
    [setError]: (state, action) => setData(state, action, { isLoading: false, error: get(action, 'payload.error') }),
    [setLoading]: (state, action) => setData(state, action, { isLoading: get(action, 'payload.isLoading') })
  },
  {}
);
