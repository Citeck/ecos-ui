import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';

import { SourcesId } from '../../../../constants';
import { AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP } from './constants';

export const getGroupName = str => str.replace(`${AUTHORITY_TYPE_GROUP}_`, '');
export const getGroupRef = str => `${SourcesId.GROUP}@${str}`;
export const getPersonRef = str => `${SourcesId.PERSON}@${str}`;
export const getAuthRef = str => str.replace(`${SourcesId.GROUP}@`, `${AUTHORITY_TYPE_GROUP}_`).replace(`${SourcesId.PERSON}@`, '');

export function handleResponse(result) {
  if (!Array.isArray(result)) {
    result = [result];
  }

  return result.map(item => ({
    id: item.nodeRef,
    label: item.displayName,
    extraLabel: item.authorityType === AUTHORITY_TYPE_USER ? item.fullName : null,
    hasChildren: !isNil(item.groupType),
    isLoaded: isUndefined(item.isLoaded) ? false : item.isLoaded,
    isOpen: isUndefined(item.isOpen) ? false : item.isOpen,
    attributes: item
  }));
}

export function unionWithPrevious(newItems, oldItems) {
  return newItems.map(newItem => {
    const prevItem = oldItems.find(i => i.id === newItem.id);

    if (!prevItem) {
      return newItem;
    }

    newItem.isLoaded = prevItem.isLoaded;
    newItem.isOpen = prevItem.isOpen;
    newItem.isSelected = prevItem.isSelected;
    newItem.hasChildren = prevItem.isOpen ? prevItem.hasChildren : newItem.hasChildren;

    return newItem;
  });
}

export function prepareParentId(item, parentId) {
  return {
    ...item,
    parentId
  };
}

export function prepareSelected(selectedItem) {
  return {
    ...selectedItem,
    hasChildren: false,
    isSelected: true,
    parentId: undefined
  };
}

export function converterUserList(source) {
  return source.map(item => ({
    id: item.id,
    label: item.displayName,
    extraLabel: item.fullName,
    isPersonDisabled: !!item.isPersonDisabled,
    attributes: item
  }));
}

export function renderUsernameString(str, replacements) {
  const regex = /\${[^{]+}/g;

  function interpolate(template, variables, fallback) {
    return template.replace(regex, match => {
      const path = match.slice(2, -1).trim();

      return getObjPath(path, variables, fallback);
    });
  }

  function getObjPath(path, obj, fallback = '') {
    return path.split('.').reduce((res, key) => res[key] || fallback, obj);
  }

  return interpolate(str, replacements);
}
