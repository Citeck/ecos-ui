import isNil from 'lodash/isNil';

import { SourcesId } from '../../../../constants';
import { AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP } from './constants';

export const getGroupName = str => str.replace(`${AUTHORITY_TYPE_GROUP}_`, '');
export const getGroupRef = str => `${SourcesId.GROUP}@${str}`;
export const getPersonRef = str => `${SourcesId.PERSON}@${str}`;
export const getAuthRef = str => str.replace(`${SourcesId.GROUP}@`, `${AUTHORITY_TYPE_GROUP}_`).replace(`${SourcesId.PERSON}@`, '');

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
    label: item.displayName,
    extraLabel: item.fullName,
    attributes: item
  }));
}
