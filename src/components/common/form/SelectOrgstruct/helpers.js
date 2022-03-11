import isNil from 'lodash/isNil';

import { AUTHORITY_TYPE_USER } from './constants';

export function handleResponse(result) {
  return result.map(item => ({
    id: item.nodeRef,
    label: item.displayName,
    extraLabel: item.authorityType === AUTHORITY_TYPE_USER ? item.shortName : null,
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
    label: item.fullName,
    extraLabel: item.userName,
    attributes: item
  }));
}
