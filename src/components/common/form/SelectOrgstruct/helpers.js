import isNil from 'lodash/isNil';

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
    isLoaded: false,
    isOpen: false,
    attributes: item
  }));
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

export function renderUsernameString(str, obj) {
  const indexString = (obj, is, value) => {
    if (typeof is == 'string') {
      is = is.split('.');
    }

    if (is.length === 1 && value !== undefined) {
      return (obj[is[0]] = value);
    } else if (is.length === 0) {
      return obj;
    }

    return indexString(obj[is[0]], is.slice(1), value);
  };

  return str.replace(/\$\{.+?\}/g, match => {
    return indexString(obj, match);
  });
}
