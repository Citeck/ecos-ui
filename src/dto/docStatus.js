import isEmpty from 'lodash/isEmpty';

export default class DocStatusConverter {
  static getStatusForWeb(source = {}) {
    const target = {};

    if (!isEmpty(source)) {
      target.id = source.id || '';
      target.name = source.name || '';
    }

    return target;
  }

  static getAvailableToChangeStatusesForWeb(source = []) {
    if (Array.isArray(source)) {
      return source.map(item => DocStatusConverter.getStatusForWeb(item));
    }

    return [];
  }
}
