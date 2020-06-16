import get from 'lodash/get';
import { initialState } from '../reducers/docAssociations';

export const selectStateByKey = (state, key) => {
  const ownState = get(state, ['docAssociations', key], { ...initialState });

  return {
    sectionList: get(ownState, ['sectionList'], []),
    associations: get(ownState, ['associations'], []),
    allowedAssociations: get(ownState, ['allowedAssociations'], []),
    isLoading: get(ownState, ['isLoading'], false),
    isLoadingMenu: get(ownState, ['isLoadingMenu'], false),
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

export const selectAssocByAssocName = (state, key, assocName) => {
  return get(state, ['docAssociations', key, 'allowedAssociations'], []).find(item => item.name === assocName) || {};
};

export const selectDirectionByAssocName = (state, key, assocName) => {
  const association = selectAssocByAssocName(state, key, assocName);

  return get(association, 'direction', 'BOTH');
};

export const selectAssociationColumnsConfig = (state, key, attribute) => {
  const association = get(state, ['docAssociations', key, 'allowedAssociations'], []).find(item => item.attribute === attribute) || {};

  return get(association, 'columnsConfig.columns', []);
};
