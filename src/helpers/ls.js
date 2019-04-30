import * as packageInfo from '../../package.json';

export function getData(key = '') {
  if (!key) {
    return null;
  }

  return JSON.parse(window.localStorage.getItem(key));
}

export function setData(key = '', data = null) {
  if (!key) {
    return null;
  }

  window.localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Check have data by key
 *
 * @param key - string, lS key
 * @param type - type of content data (string, array, object, number, boolean)
 * @returns {*}
 */
export function hasData(key = '', type = '') {
  if (!key) {
    return false;
  }

  const data = getData(key);

  if (!type) {
    return data !== null;
  }

  let typeMatches = false;

  switch (type) {
    case 'array':
      typeMatches = Array.isArray(data);
      break;
    default:
      typeMatches = typeof data === type;
  }

  return data !== null && typeMatches;
}

export function generateKey(firstPart = 'app', complicate = false) {
  const base = packageInfo.name;
  const name = `${base}-${firstPart}`;

  if (!complicate) {
    return `${base}-${firstPart}`;
  }

  const complicatingPart = name
    .split('-')
    .map(item =>
      item
        .split('')
        .reverse()
        .join('')
    )
    .join('')
    .split('')
    .map(letter => String.fromCharCode(letter.charCodeAt(0) + 3))
    .join('')
    .match(/.{1,5}/g)
    .join('-');

  return `${base}-${firstPart}-${complicatingPart}`;
}
