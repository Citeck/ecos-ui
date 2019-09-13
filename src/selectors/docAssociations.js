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
