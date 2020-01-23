import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/documents';

const selectState = (state, key) => get(state, ['documents', key], { ...initialState });

export const selectStateByKey = createSelector(
  selectState,
  ownState => ({
    types: ownState.types,
    grouppedAvailableTypes: selectGrouppedAvailableTypes(ownState),
    availableTypes: getAvailableTypes(ownState),
    dynamicTypes: ownState.dynamicTypes,
    // typesForTable: selectTypesForTable(ownState),
    documents: ownState.documents,
    isLoading: ownState.isLoading,
    isUploadingFile: ownState.isUploadingFile,
    isLoadingSettings: ownState.isLoadingSettings
  })
);

const getAvailableTypes = state => get(state, 'availableTypes', []);
const getDynamicTypes = state => get(state, 'dynamicTypes', []);
const getDocuments = state => get(state, 'dynamicTypes', []);

export const selectTypesForTable = createSelector();

export const selectTypeNames = createSelector(
  selectState,
  state => {
    const availableTypes = getAvailableTypes(state);

    return availableTypes.reduce(
      (result, current) => ({
        ...result,
        [current.id]: current.name
      }),
      {}
    );
  }
);

export const selectDynamicTypes = createSelector(
  selectState,
  getDynamicTypes
);

export const selectAvailableTypes = createSelector(
  selectState,
  getAvailableTypes
);

export const selectGrouppedAvailableTypes = createSelector(
  getAvailableTypes,
  getDynamicTypes,
  (availableTypes, dynamicTypes) => {
    const selectedTypes = dynamicTypes.map(item => item.type);
    const getChilds = (filtered = [], types = filtered) => {
      return filtered.map(item => {
        if (!item.parent) {
          return item;
        }

        return {
          ...item,
          isSelected: selectedTypes.includes(item.id),
          items: getChilds(types.filter(type => type.parent && type.parent === item.id), types)
        };
      });
    };

    return availableTypes
      .filter(item => item.parent === null)
      .map(item => ({
        ...item,
        isSelected: selectedTypes.includes(item.id),
        items: getChilds(availableTypes.filter(type => type.parent === item.id), availableTypes)
      }));
  }
);
