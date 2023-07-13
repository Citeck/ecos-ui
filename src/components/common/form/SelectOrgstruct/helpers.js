import isNil from 'lodash/isNil';
import get from 'lodash/get';

import { SourcesId } from '../../../../constants';
import { AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP } from './constants';

export const getGroupName = str => str.replace(`${AUTHORITY_TYPE_GROUP}_`, '');
export const getGroupRef = str => `${SourcesId.GROUP}@${str}`;
export const getPersonRef = str => `${SourcesId.PERSON}@${str}`;
export const getRecordRef = str => str.replace('emodel/@', '');
export const getAuthRef = str =>
  str
    .replace(`${SourcesId.GROUP}@`, `${AUTHORITY_TYPE_GROUP}_`)
    .replace(`${SourcesId.PERSON}@`, '')
    .replace('emodel/@', '');

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

export function prepareRecordRef(item) {
  const { attributes = {} } = item;

  if (attributes.authorityType === AUTHORITY_TYPE_GROUP) {
    return attributes.fullName || item.id;
  }

  if (attributes.authorityType === AUTHORITY_TYPE_USER) {
    return attributes.fullName || item.shortName || item.id;
  }

  if (get(attributes, 'userName')) {
    return attributes.userName;
  }

  if (get(attributes, 'authorityName')) {
    return getGroupRef(getGroupName(attributes.authorityName));
  }

  return item.id;
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

export function isHTML(str) {
  const doc = new DOMParser().parseFromString(str, 'text/html');

  return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
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
    return path.split('.').reduce((res, key) => {
      const result = getKeyFromUserObject(res, key, fallback);

      if (!result) {
        const extraFieldObj = res['extraFields'] || {};
        return getKeyFromUserObject(extraFieldObj, key, fallback);
      }

      return result;
    }, obj);
  }

  const getKeyFromUserObject = (user, key, fallback = '') => user[key] || user[`cm:${key}`] || user[`ecos:${key}`] || fallback;

  return interpolate(str, replacements);
}
