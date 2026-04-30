import isEqual from 'lodash/isEqual';
import isPlainObject from 'lodash/isPlainObject';
import moment from 'moment';

export function getEditorValue(value, multiple) {
  if (value == null) {
    return multiple ? [] : null;
  }
  if (Array.isArray(value)) {
    if (multiple) {
      return value.map((v) => getEditorValue(v, false));
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

const NUMERIC_COLUMN_TYPES = new Set(['number', 'int', 'integer', 'long', 'float', 'double']);

const isEmptyAttValue = (value) => value == null || value === '' || (Array.isArray(value) && value.length === 0);

function isSavedAttScalarEqual(savedValue, sentValue, columnType) {
  if (isEmptyAttValue(savedValue) && isEmptyAttValue(sentValue)) {
    return true;
  }
  if (isEmptyAttValue(savedValue) || isEmptyAttValue(sentValue)) {
    return false;
  }

  const type = (columnType || '').toLowerCase();

  if (NUMERIC_COLUMN_TYPES.has(type)) {
    const savedNum = Number(savedValue);
    const sentNum = Number(sentValue);
    if (!Number.isNaN(savedNum) && !Number.isNaN(sentNum)) {
      return savedNum === sentNum;
    }
  }

  if (type === 'date' || type === 'datetime') {
    const savedMoment = moment(savedValue);
    const sentMoment = moment(sentValue);
    if (savedMoment.isValid() && sentMoment.isValid()) {
      const granularity = type === 'date' ? 'day' : 'minute';
      return savedMoment.isSame(sentMoment, granularity);
    }
  }

  if (type === 'boolean') {
    return Boolean(savedValue) === Boolean(sentValue);
  }

  return isEqual(savedValue, sentValue);
}

const PLAUSIBLE_YEAR_MIN = 1900;
const PLAUSIBLE_YEAR_MAX = 2999;

function isValidScalarForType(value, columnType) {
  if (isEmptyAttValue(value)) {
    return true;
  }
  const type = (columnType || '').toLowerCase();

  if (type === 'date' || type === 'datetime') {
    if (typeof value === 'string' && value.toLowerCase().includes('invalid')) {
      return false;
    }
    const m = moment(value);
    if (!m.isValid()) {
      return false;
    }
    const year = m.year();
    return year >= PLAUSIBLE_YEAR_MIN && year <= PLAUSIBLE_YEAR_MAX;
  }

  if (NUMERIC_COLUMN_TYPES.has(type)) {
    const num = Number(value);
    return !Number.isNaN(num);
  }

  return true;
}

// Date editors can convert unparseable input ("10.05.26") into nonsense values like "Invalid date" or year 0026 — reject these before they hit the server and overwrite real data.
export function isValidAttValueForType(value, columnType) {
  if (Array.isArray(value)) {
    return value.every((v) => isValidScalarForType(v, columnType));
  }
  return isValidScalarForType(value, columnType);
}

export function isSavedAttValueEqual(savedValue, sentValue, columnType) {
  if (Array.isArray(savedValue) || Array.isArray(sentValue)) {
    const toArr = (v) => (Array.isArray(v) ? v : isEmptyAttValue(v) ? [] : [v]);
    const savedArr = toArr(savedValue);
    const sentArr = toArr(sentValue);

    if (savedArr.length !== sentArr.length) {
      return false;
    }

    return savedArr.every((v, i) => isSavedAttScalarEqual(v, sentArr[i], columnType));
  }

  return isSavedAttScalarEqual(savedValue, sentValue, columnType);
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
