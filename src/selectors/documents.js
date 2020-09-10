import get from 'lodash/get';
import omit from 'lodash/omit';
import { createSelector } from 'reselect';

import { initialState } from '../reducers/documents';
import { t } from '../helpers/export/util';
import { documentFields, Labels } from '../constants/documents';
import { DataFormatTypes } from '../constants';
import { getOutputFormat } from '../helpers/util';

const selectState = (state, key) => get(state, ['documents', key], { ...initialState });

export const selectStateByKey = createSelector(
  selectState,
  ownState => {
    let isLoadChecklist = get(ownState, 'config.isLoadChecklist');

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
      typeSettings: ownState.typeSettings,

      isLoading: ownState.isLoading,
      isUploadingFile: ownState.isUploadingFile,
      isLoadingSettings: ownState.isLoadingSettings,
      isLoadingTableData: ownState.isLoadingTableData,
      isLoadingTypeSettings: ownState.isLoadingTypeSettings,
      isLoadChecklist,

      uploadError: ownState.uploadError,
      countFilesError: ownState.countFilesError
    };
  }
);

const getAvailableTypes = state => get(state, 'availableTypes', []);
const getDynamicTypes = state => get(state, 'dynamicTypes', []);

export const selectIsLoadChecklist = createSelector(
  selectState,
  state => {
    let isLoadChecklist = get(state, 'config.isLoadChecklist', undefined);

    if (isLoadChecklist === undefined) {
      isLoadChecklist = true;
    }

    return isLoadChecklist;
  }
);

export const selectConfigTypes = createSelector(
  selectState,
  state => get(state, 'config.types', [])
);

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

export const selectTypeById = (state, key, id) => get(selectState(state, key), 'availableTypes', []).find(type => type.id === id);

export const selectDynamicTypes = createSelector(
  selectState,
  getDynamicTypes
);

export const selectDynamicType = (state, key, id) => {
  const types = selectDynamicTypes(state, key);

  return types.find(type => type.type === id);
};

export const selectAvailableType = (state, key, id) => {
  const types = selectAvailableTypes(state, key);

  return types.find(type => type.id === id);
};

export const selectAvailableTypes = createSelector(
  selectState,
  getAvailableTypes
);

export const selectActionsByType = (state, key, type) => {
  const availableTypes = getAvailableTypes(selectState(state, key)) || [];

  return get(availableTypes.find(item => item.id === type), 'actions', []);
};

export const selectGrouppedAvailableTypes = createSelector(
  getAvailableTypes,
  getDynamicTypes,
  (availableTypes, dynamicTypes) => {
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
          items: getChilds(types.filter(type => type.parent && type.parent === item.id), types)
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
          items: getChilds(availableTypes.filter(type => type.parent === item.id), availableTypes)
        };
      });
  }
);

export const selectColumnsConfig = (state, key, name) => {
  const type = get(state, ['documents', key, 'dynamicTypes'], []).find(item => item.type === name) || {};

  return get(type, 'columns', []);
};

export const selectColumnsFromConfigByType = (state, key, name) => {
  const types = selectConfigTypes(state, key);
  const type = types.find(item => item.type === name);

  return get(type, 'columns', []);
};

export const selectWidgetTitle = createSelector(
  selectState,
  ownState => {
    const dynamicTypes = get(ownState, 'dynamicTypes', []);

    if (dynamicTypes.length === 1) {
      return dynamicTypes[0].name;
    }

    return t(Labels.TITLE);
  }
);

export const selectStateId = createSelector(
  selectState,
  ownState => {
    return get(ownState, 'stateId');
  }
);

const getDocumentsByTypes = state => get(state, 'documentsByTypes');
const dynamicTypesIds = state => getDynamicTypes(state).map(item => item.type);

const selectDocuments = createSelector(
  selectState,
  getDocumentsByTypes
);
const selectTypeIds = createSelector(
  selectState,
  dynamicTypesIds
);
const selectAvailableTypesById = createSelector(
  selectState,
  selectTypeIds,
  (ownProps, typesIds) => {
    return getAvailableTypes(ownProps).filter(type => typesIds.includes(type.id));
  }
);
const selectActions = createSelector(
  selectState,
  ownProps => get(ownProps, 'actions', {})
);

export const selectDocumentsByTypes = createSelector(
  selectStateByKey,
  selectDocuments,
  selectAvailableTypesById,
  selectActions,
  (ownProps, documents, types, actions) => {
    return types.reduce(
      (result, type) => ({
        ...result,
        [type.id]: {
          ...omit(type, ['actions']),
          documents: get(documents, type.id, []).map(doc => ({
            ...doc,
            [documentFields.modified]: getOutputFormat(DataFormatTypes.DATE, doc[documentFields.modified]),
            actions: get(actions, doc[documentFields.id], [])
          }))
        }
      }),
      {}
    );
  }
);
