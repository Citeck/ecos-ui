import BaseFormatter from '../baseFormatter';

export default class DefaultGqlFormatter extends BaseFormatter {
  static getQueryString() {
    return 'str';
  }

  value(cell) {
    const val = cell ? cell.val[0] : {};
    return val ? val.str || '' : '';
  }
}
