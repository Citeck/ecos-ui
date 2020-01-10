import get from 'lodash/get';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/documents';

const selectState = (state, key) => get(state, ['documents', key], { ...initialState });

export const selectStateByKey = createSelector(
  selectState,
  ownState => ({
    types: ownState.types,
    availableTypes: selectGrouppedAvailableTypes(ownState),
    dynamicTypes: ownState.dynamicTypes,
    documents: ownState.documents,
    isLoading: ownState.isLoading
  })
);

const getAvailableTypes = state => get(state, 'availableTypes', []);
const getDynamicTypes = state => get(state, 'dynamicTypes', []);

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
  availableTypes => {
    // console.warn('in selectors => ', availableTypes);
    const getChilds = (filtered = [], types = filtered) => {
      return filtered.map(item => {
        if (!item.parent) {
          return item;
        }

        return {
          ...item,
          items: getChilds(types.filter(type => type.parent && type.parent === item.id), types)
        };
      });
    };

    return availableTypes
      .filter(item => item.parent === null)
      .map(item => ({
        ...item,
        items: getChilds(availableTypes.filter(type => type.parent === item.id), availableTypes)
      }));
  }
);
