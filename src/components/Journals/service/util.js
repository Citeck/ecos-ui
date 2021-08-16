import _ from 'lodash';

export const COMPUTED_ATT_PREFIX = '$computed.';

export const COLUMN_TYPE_NEW_TO_LEGACY_MAPPING = {
  ASSOC: 'assoc',
  PERSON: 'person',
  AUTHORITY_GROUP: 'authorityGroup',
  AUTHORITY: 'authority',
  TEXT: 'text',
  MLTEXT: 'mltext',
  NUMBER: 'double',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  CONTENT: 'content'
};

export function getCreateVariantKeyField(createVariant) {
  return Object.keys(createVariant).filter(key => !!createVariant[key] && typeof createVariant[key] === 'string');
}

export function valueOrNull(value) {
  return value === undefined ? null : value;
}

export function replacePlaceholders(object, values, keyPreProc) {
  if (!object || !values) {
    return object;
  }
  if (_.isString(object)) {
    let placeholderStart = object.indexOf('${');
    let firstIteration = true;
    let firstIdxToFindPlaceholders = 0;

    while (placeholderStart >= 0) {
      let placeholderEnd = object.indexOf('}', placeholderStart + 2);
      if (placeholderEnd === -1) {
        break;
      }
      let sourceKey = object.substring(placeholderStart + 2, placeholderEnd);
      let keyForValues = sourceKey;
      if (keyPreProc) {
        keyForValues = keyPreProc(keyForValues);
      }
      let value;
      if (keyForValues == null) {
        value = undefined;
      } else {
        value = keyForValues ? values[keyForValues] : null;
      }
      if (!_.isUndefined(value)) {
        if (firstIteration && placeholderStart === 0 && placeholderEnd === object.length - 1) {
          return value;
        }
        firstIteration = false;

        if (value == null) {
          value = '';
        }
        object = object.replace(`\${${sourceKey}}`, `${value}`);

        placeholderStart = object.indexOf('${', placeholderStart);
      } else {
        firstIdxToFindPlaceholders = placeholderStart + 1;
      }

      placeholderStart = object.indexOf('${', firstIdxToFindPlaceholders);
    }

    return object;
  } else if (_.isArray(object)) {
    let newValue = [];
    for (let item of object) {
      newValue.push(replacePlaceholders(item, values, keyPreProc));
    }
    return newValue;
  } else if (_.isPlainObject(object)) {
    let newValue = {};
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        newValue[key] = replacePlaceholders(object[key], values, keyPreProc);
      }
    }
    return newValue;
  }

  return object;
}
