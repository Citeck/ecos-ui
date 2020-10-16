import _ from 'lodash';

const ATT_NAME_REGEXP = /\.atts?\((n:)?['"](.+?)['"]\)\s*{(.+)}/;

export const SCALAR_FIELDS = ['disp', 'json', 'str', 'num', 'bool', 'id', 'assoc'];

export const parseAttribute = (path, defaultScalar = 'disp') => {
  if (path[0] === '#') {
    return null;
  }

  let modifierIdx = indexOf(path, '!');
  if (modifierIdx === -1) {
    modifierIdx = indexOf(path, '|');
  }
  if (modifierIdx !== -1) {
    return null;
  }

  if (path[0] === '.') {
    let attMatch = path.match(ATT_NAME_REGEXP);
    if (!attMatch) {
      return null;
    }
    if (SCALAR_FIELDS.indexOf(attMatch[3]) === -1) {
      return null;
    }
    return {
      name: attMatch[2],
      scalar: attMatch[3],
      isMultiple: path.indexOf('.atts') === 0
    };
  } else {
    if (path.indexOf('.') !== -1 || path.indexOf('{') !== -1 || path.indexOf('(') !== -1) {
      return null;
    }

    let name = path;
    let scalar = defaultScalar;
    let qIdx = path.indexOf('?');
    if (qIdx !== -1) {
      name = path.substring(0, qIdx);
      scalar = path.substring(qIdx + 1);
    }

    let isMultiple = false;
    if (name.indexOf('[]') === name.length - 2) {
      name = name.substring(0, name.length - 2);
      isMultiple = true;
    }

    return {
      name,
      scalar,
      isMultiple
    };
  }
};

export const mapValueToScalar = value => {
  if (value === null || value === undefined || _.isString(value) || _.isDate(value)) {
    return 'str';
  } else if (_.isNumber(value)) {
    return 'num';
  } else if (_.isArray(value)) {
    return value.length ? mapValueToScalar(value[0]) : 'str';
  } else if (_.isObject(value)) {
    return 'json';
  } else if (_.isBoolean(value)) {
    return 'bool';
  } else {
    return 'str';
  }
};

export const split = (str, delim) => {
  let prevIdx = 0;
  let idx = indexOf(str, delim, prevIdx);

  let result = [];
  while (idx !== -1) {
    result.push(str.substring(prevIdx, idx));
    prevIdx = idx + delim.length;
    idx = indexOf(str, delim, prevIdx);
  }
  result.push(str.substring(prevIdx));

  return result;
};

export const indexOf = (str, subString, fromIdx = 0) => {
  if (hasOpenContextChar(subString)) {
    return -1;
  }

  let openContextChar = ' ';
  for (let idx = fromIdx; idx <= str.length - subString.length; idx++) {
    let currentChar = str.charAt(idx);
    if (openContextChar !== ' ') {
      if (isCloseContextChar(openContextChar, currentChar)) {
        openContextChar = ' ';
      }
      continue;
    }
    if (isOpenContextChar(currentChar)) {
      openContextChar = currentChar;
    } else if (containsAt(str, idx, subString)) {
      return idx;
    }
  }
  return -1;
};

const containsAt = (str, idx, subString) => {
  if (str.length < idx + subString.length) {
    return false;
  }
  if (subString.length === 1 && idx > 0 && str[idx - 1] === '\\') {
    return false;
  }
  for (let i = 0; i < subString.length; i++) {
    if (str[idx + i] !== subString[i]) {
      return false;
    }
  }
  return true;
};

const hasOpenContextChar = str => {
  for (let i = 0; i < str.length; i++) {
    if (isOpenContextChar(str[i])) {
      return true;
    }
  }
  return false;
};

const isOpenContextChar = ch => {
  return ch === "'" || ch === '"' || ch === '(' || ch === '{';
};

const isCloseContextChar = (openChar, ch) => {
  if (openChar === "'" || openChar === '"') {
    return ch === openChar;
  }
  if (openChar === '(') {
    return ch === ')';
  }
  if (openChar === '{') {
    return ch === '}';
  }
  return false;
};
