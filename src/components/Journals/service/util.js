import _ from 'lodash';

export const COMPUTED_ATT_PREFIX = '$computed.';

export function getCreateVariantKeyField(createVariant) {
  return Object.keys(createVariant).filter(key => !!createVariant[key] && typeof createVariant[key] === 'string');
}

export function replacePlaceholders(object, values) {
  if (!object || !values) {
    return object;
  }
  if (_.isString(object)) {
    let placeholderStart = object.indexOf('${');
    let firstIteration = true;

    while (placeholderStart >= 0) {
      let placeholderEnd = object.indexOf('}', placeholderStart + 2);
      if (placeholderEnd === -1) {
        break;
      }
      let attribute = object.substring(placeholderStart + 2, placeholderEnd);
      let value = attribute ? values[attribute] : null;
      if (firstIteration && placeholderStart === 0 && placeholderEnd === object.length - 1) {
        return value;
      }
      firstIteration = false;

      if (value == null) {
        value = '';
      }
      object = object.replace(`\${${attribute}}`, `${value}`);
      placeholderStart = object.indexOf('${');
    }

    return object;
  } else if (_.isArray(object)) {
    let newValue = [];
    for (let item of object) {
      newValue.push(replacePlaceholders(item, values));
    }
    return newValue;
  } else if (_.isPlainObject(object)) {
    let newValue = {};
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        newValue[key] = replacePlaceholders(object[key], values);
      }
    }
    return newValue;
  }

  return object;
}
