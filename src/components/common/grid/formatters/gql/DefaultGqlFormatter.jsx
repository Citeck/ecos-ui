import BaseFormatter from '../BaseFormatter';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString(attribute) {
    return `${attribute}`;
  }
}
