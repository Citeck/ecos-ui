import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/documents';

const selectState = (state, key) => get(state, ['documents', key], { ...initialState });

export const selectStateByKey = createSelector(selectState, ownState => {
  let isLoadChecklist = get(ownState, 'config.isLoadChecklist', undefined);

  if (isLoadChecklist === undefined) {
    isLoadChecklist = true;
  }

  return {
    stateId: ownState.stateId,
    grouppedAvailableTypes: selectGrouppedAvailableTypes(ownState),
    availableTypes: getAvailableTypes(ownState),
    dynamicTypes: ownState.dynamicTypes,
    documents: ownState.documents,
    actions: ownState.actions,

    isLoading: ownState.isLoading,
    isUploadingFile: ownState.isUploadingFile,
    isLoadingSettings: ownState.isLoadingSettings,
    isLoadingTableData: ownState.isLoadingTableData,
    isLoadChecklist,

    uploadError: ownState.uploadError,
    countFilesError: ownState.countFilesError
  };
});

const getAvailableTypes = state => get(state, 'availableTypes', []);
const getDynamicTypes = state => get(state, 'dynamicTypes', []);

export const selectIsLoadChecklist = createSelector(selectState, state => {
  let isLoadChecklist = get(state, 'config.isLoadChecklist', undefined);

  if (isLoadChecklist === undefined) {
    isLoadChecklist = true;
  }

  return isLoadChecklist;
});

export const selectConfigTypes = createSelector(selectState, state => get(state, 'config.types', []));

export const selectTypeNames = createSelector(selectState, state => {
  const availableTypes = getAvailableTypes(state);

  return availableTypes.reduce(
    (result, current) => ({
      ...result,
      [current.id]: current.name
    }),
    {}
  );
});

export const selectDynamicTypes = createSelector(selectState, getDynamicTypes);

export const selectDynamicType = (state, key, id) => {
  const types = selectDynamicTypes(state, key);

  return types.find(type => type.type === id);
};

export const selectAvailableTypes = createSelector(selectState, getAvailableTypes);

export const selectGrouppedAvailableTypes = createSelector(getAvailableTypes, getDynamicTypes, (availableTypes, dynamicTypes) => {
  const selectedTypes = dynamicTypes.map(item => item.type);
  const getChilds = (filtered = [], types = filtered) => {
    return filtered.map(item => {
      const dType = dynamicTypes.find(i => i.type === item.id);
      const dTypeParams = {
        multiple: get(dType, 'multiple', false),
        mandatory: get(dType, 'mandatory', false),
        locked: get(dType, 'locked', false),
        countDocuments: get(dType, 'coundDocuments', 0)
      };

      if (!item.parent) {
        return {
          ...item,
          ...dTypeParams
        };
      }

      return {
        ...item,
        ...dTypeParams,
        isSelected: selectedTypes.includes(item.id),
        items: getChilds(
          types.filter(type => type.parent && type.parent === item.id),
          types
        )
      };
    });
  };

  return availableTypes
    .filter(item => item.parent === null)
    .map(item => {
      const dType = dynamicTypes.find(i => i.type === item.id);
      const dTypeParams = {
        multiple: get(dType, 'multiple', false),
        mandatory: get(dType, 'mandatory', false),
        countDocuments: get(dType, 'coundDocuments', 0)
      };

      return {
        ...item,
        ...dTypeParams,
        isSelected: selectedTypes.includes(item.id),
        items: getChilds(
          availableTypes.filter(type => type.parent === item.id),
          availableTypes
        )
      };
    });
});
