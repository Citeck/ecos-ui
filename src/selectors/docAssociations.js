import get from 'lodash/get';
import { initialState } from '../reducers/docAssociations';

export const selectStateByKey = (state, key) => {
  const ownState = get(state, ['docAssociations', key], { ...initialState });

  return {
    sectionList: get(ownState, ['sectionList'], []),
    documents: get(ownState, ['documents'], []),
    isLoading: get(ownState, ['isLoading'], false),
    menu: get(ownState, ['menu'], [])
  };
};

export const selectDocuments = (state, key, connectionId) => {
  const docs = get(state, ['docAssociations', key, 'documents'], []).find(item => item.key === connectionId);

  return get(docs, ['documents'], []).map(doc => doc.record);
};
