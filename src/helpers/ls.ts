import * as projectInfo from '../../package.json';

export type LSDataType = Array<{ key: string; value: string }>;

export function isExistLocalStorage() {
  return 'localStorage' in window && window.localStorage !== null;
}

export function getData(key: string): LSDataType | null {
  if (!key) {
    return null;
  }

  return JSON.parse(<string>window.localStorage.getItem(key));
}

export function transferData(fromKey = '', toKey = '', removeOldKey = false) {
  if (hasData(fromKey)) {
    setData(toKey, getData(fromKey));

    if (removeOldKey) {
      removeItem(fromKey);
    }
  }
}

export function setData(key = '', data: LSDataType | null = null) {
  if (!key) {
    return null;
  }

  window.localStorage.setItem(key, JSON.stringify(data));
}

export function removeItem(key = '') {
  if (!key) {
    return null;
  }

  window.localStorage.removeItem(key);
}

export function removeItems(keys: string[] = []) {
  if (!keys || !keys.length) {
    return null;
  }

  keys.forEach(key => removeItem(key));
}

export function clearLS() {
  window.localStorage.clear();
}

/**
 * Check have data by key
 *
 * @param key - string, lS key
 * @param type - type of content data (string, array, object, number, boolean)
 * @returns {*}
 */
export function hasData(key = '', type: any = '') {
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

export function generateKey(extName = 'app', complicate = false) {
  const base = projectInfo.name;
  const name = `${base}-${extName}`;

  if (!complicate) {
    return name;
  }

  const complicatingPart = name
    .split('-')
    .map(item => item.split('').reverse().join(''))
    .join('')
    .split('')
    .map(letter => String.fromCharCode(letter.charCodeAt(0) + 3))
    .join('')
    .match(/.{1,5}/g)
    ?.join('-');

  return `${name}-${complicatingPart}`;
}

export function isExistSessionStorage() {
  return 'sessionStorage' in window && window.sessionStorage !== null;
}

export function getSessionData(key = '') {
  if (!key || !isExistSessionStorage()) {
    return null;
  }

  return JSON.parse(<string>window.sessionStorage.getItem(key));
}

export function setSessionData(key = '', data = null) {
  if (!key || !isExistSessionStorage()) {
    return null;
  }

  window.sessionStorage.setItem(key, JSON.stringify(data));
}

export function getFilteredKeys(filter = '') {
  const keys = Object.keys(window.localStorage);

  if (!filter.length) {
    return keys;
  }

  return keys.filter(key => key.includes(filter));
}
