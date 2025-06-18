import isArray from 'lodash/isArray';

let _refs: string[] = [];

/**
 * Sets a new EntityRef list
 * @param {string[]} refs
 */
export function setUploadedEntityRefs(refs: string[]) {
  _refs = isArray(refs) ? refs.slice() : [];
}

/**
 * Returns the current list of entityRefs
 * @returns {string[]}
 */
export function getUploadedEntityRefs() {
  return _refs.slice();
}

/**
 * Adds several refs to the existing list
 * @param {string[]} refs
 */
export function addUploadedEntityRefs(refs: string[]) {
  if (isArray(refs)) {
    _refs = _refs.concat(refs);
  }
}

/**
 * Clears the list
 */
export function clearUploadedEntityRefs() {
  _refs = [];
}
