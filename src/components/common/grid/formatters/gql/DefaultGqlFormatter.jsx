import BaseFormatter from '../BaseFormatter';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString(attribute) {
    if (!attribute) {
      return attribute;
    }
    if (attribute[0] === '?' || attribute[0] === '.') {
      return attribute;
    }
    return `${attribute}?disp`;
  }
}
