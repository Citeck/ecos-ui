import BaseFormatter from '../BaseFormatter';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString(dataField) {
    return '';
  }
}
