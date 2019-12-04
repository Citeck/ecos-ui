import _ from 'lodash';

export const mapValueToInnerAtt = value => {
  if (value === null || value === undefined || _.isString(value) || _.isDate(value)) {
    return 'str';
  } else if (_.isNumber(value)) {
    return 'num';
  } else if (_.isObject(value) || _.isArray(value)) {
    return 'json';
  } else if (_.isBoolean(value)) {
    return 'bool';
  } else {
    return 'str';
  }
};
