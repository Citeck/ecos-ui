import get from 'lodash/get';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';

import { SourcesId } from '../../../constants';

import { AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP } from './constants';

import EcosFormUtils from '@/components/EcosForm/EcosFormUtils';

export const getGroupName = str => str.replace(`${AUTHORITY_TYPE_GROUP}_`, '');
export const getGroupRef = str => `${SourcesId.GROUP}@${str}`;
export const getPersonRef = str => `${SourcesId.PERSON}@${str}`;
export const getRecordRef = str => str.replace('emodel/@', '');
export const getAuthRef = str =>
  str.replace(`${SourcesId.GROUP}@`, `${AUTHORITY_TYPE_GROUP}_`).replace(`${SourcesId.PERSON}@`, '').replace('emodel/@', '');

export function handleResponse(result) {
  if (!Array.isArray(result)) {
    result = [result];
  }

  return result.map(item => ({
    id: item.nodeRef,
    label: item.displayName,
    isPersonDisabled: get(item, 'isPersonDisabled', false),
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
  return EcosFormUtils.renderByTemplate(str, replacements);
}
