import { isEmpty } from 'lodash';

export default class DocStatusConverter {
  static getStatusForWeb(source = {}) {
    const target = {};

    if (!isEmpty(source)) {
      target.id = source.id || '';
      target.name = source.name || '';
    }

    return target;
  }

  static getAvailableStatusesForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => DocStatusConverter.getStatusForWeb(item));
    }

    return [];
  }
}
