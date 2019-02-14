import BaseFormatter from '../baseFormatter';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString(dataField) {
    return '';
  }
}
