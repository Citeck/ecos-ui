import { handleActions } from 'redux-actions';
import { setSectionList, initStore, setAssociatedWithDocs, setAccountingDocs, setBaseDocs } from '../actions/docAssociations';

export const initialState = {
  sectionList: [],
  associatedWithDocs: [],
  baseDocs: [],
  accountingDocs: [],
  isLoading: false
};

Object.freeze(initialState);

export default handleActions(
  {
    [initStore]: (state, action) => {
      let ownState = { ...initialState };

      if (state[action.payload]) {
        ownState = { ...ownState, ...state[action.payload] };
      }

      return {
        ...state,
        [action.payload]: { ...ownState }
      };
    },

    [setSectionList]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        sectionList: action.payload.sectionList
      }
    }),

    [setAssociatedWithDocs]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        associatedWithDocs: action.payload.associatedWithDocs
      }
    }),
    [setAccountingDocs]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        accountingDocs: action.payload.accountingDocs
      }
    }),
    [setBaseDocs]: (state, action) => ({
      ...state,
      [action.payload.key]: {
        ...state[action.payload.key],
        baseDocs: action.payload.baseDocs
      }
    })
  },
  {}
);
