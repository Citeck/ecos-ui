import get from 'lodash/get';
import { initialState } from '../reducers/docAssociations';

export const selectStateByKey = (state, key) => {
  const ownState = get(state, ['docAssociations', key], { ...initialState });

  return {
    sectionList: get(ownState, ['sectionList'], []),
    associatedWithDocs: get(ownState, ['associatedWithDocs'], []),
    baseDocs: get(ownState, ['baseDocs'], []),
    accountingDocs: get(ownState, ['accountingDocs'], []),
    isLoading: get(ownState, ['isLoading'], false)
  };
};
