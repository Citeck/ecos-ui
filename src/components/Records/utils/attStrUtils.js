const ATT_NAME_REGEXP = /\.atts?\((n:)?['"](.+?)['"]\)\s*{(.+)}/;
const SIMPLE_ATT_NAME_REGEXP = /(.+?){(.+)}/;

export const parseAttribute = (path, innerDefault = 'disp') => {
  if (path[0] === '#') {
    return null;
  }

  let modifierIdx = indexOf(path, '!');
  if (modifierIdx === -1) {
    modifierIdx = indexOf(path, '|');
  }
  let modifier = '';
  if (modifierIdx !== -1) {
    modifier = path.substring(modifierIdx);
    path = path.substring(0, modifierIdx);
  }

  if (path[0] === '.') {
    let attMatch = path.match(ATT_NAME_REGEXP);
    if (!attMatch) {
      return null;
    }
    return {
      name: attMatch[2],
      inner:
        '.' +
        attMatch[3]
          .split(',')
          .map(s => s.trim())
          .join(','),
      isMultiple: path.indexOf('.atts') === 0,
      modifier
    };
  } else {
    let name = path;
    let inner;

    let dotIdx = path.indexOf('.');
    let braceIdx = path.indexOf('{');

    if (dotIdx > 0 && (braceIdx === -1 || dotIdx < braceIdx - 1)) {
      inner = name.substring(dotIdx + 1);
      let qIdx = inner.indexOf('?');
      if (qIdx === -1 && braceIdx === -1) {
        inner += '?disp';
      }
      name = name.substring(0, dotIdx);
    } else {
      let match = name.match(SIMPLE_ATT_NAME_REGEXP);

      if (match == null) {
        let qIdx = path.indexOf('?');
        if (qIdx >= 0) {
          inner = name.substring(qIdx + 1);
          name = name.substring(0, qIdx);
        } else {
          inner = innerDefault;
        }
      } else {
        name = match[1];
        inner = match[2]
          .split(',')
          .map(s => s.trim())
          .join(',');
      }
    }

    let isMultiple = false;
    if (name.indexOf('[]') === name.length - 2) {
      name = name.substring(0, name.length - 2);
      isMultiple = true;
    }

    return {
      name,
      inner,
      isMultiple,
      modifier
    };
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
