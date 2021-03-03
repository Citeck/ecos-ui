import isPlainObject from 'lodash/isPlainObject';

export function getEditorValue(value, multiple) {
  if (value == null) {
    return multiple ? [] : null;
  }
  if (Array.isArray(value)) {
    if (multiple) {
      return value.map(v => getEditorValue(v, false));
    } else if (value.length === 0) {
      return null;
    } else {
      return getEditorValue(value[0]);
    }
  }
  if (isPlainObject(value) && value.value !== undefined) {
    return value.value;
  }
  return value;
}

export function normalizeEditorValue(value, multiple) {
  let newValue;
  if (value === null || value === undefined) {
    newValue = multiple ? [] : null;
  } else {
    if (multiple) {
      newValue = Array.isArray(value) ? value : [value];
    } else {
      if (Array.isArray(value)) {
        newValue = value.length === 0 ? null : value[0];
      } else {
        newValue = value;
      }
    }
  }
  return newValue;
}
