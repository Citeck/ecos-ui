import get from 'lodash/get';
import { initialState } from '../reducers/docAssociations';

export const selectStateByKey = (state, key) => {
  const ownState = get(state, ['docAssociations', key], { ...initialState });

  return {
    sectionList: get(ownState, ['sectionList'], []),
    associations: get(ownState, ['associations'], []),
    isLoading: get(ownState, ['isLoading'], false),
    isLoadingMenu: get(ownState, ['isLoadingMenu'], false),
    errorMessage: get(ownState, ['errorMessage'], ''),
    menu: get(ownState, ['menu'], []),
    associationsTotalCount: get(ownState, ['associationsTotalCount'], 0)
  };
};

export const selectDocuments = (state, key, associationId) => {
  const docs = get(state, ['docAssociations', key, 'associations'], []).find(item => item.key === associationId);

  return get(docs, ['associations'], []).map(doc => doc.record);
};

export const selectAllowedDirectionsByKey = (state, recordRef) => {
  return get(state, ['docAssociations', recordRef, 'allowedAssociations'], []).reduce(
    (res, cur) => ({ ...res, [cur.name]: cur.direction }),
    {}
  );
};
