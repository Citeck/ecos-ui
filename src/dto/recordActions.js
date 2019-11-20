import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';

export default class RecordActionsConverter {
  static getActionForWeb(source = {}) {
    const target = {};

    if (isEmpty(source)) {
      return target;
    }

    target.title = source.title || '';
    target.type = source.type || '';
    target.variants = source.variants || [];
    target.theme = source.theme || '';
    target.icon = source.icon || '';

    return target;
  }

  static getActionListForWeb(source = []) {
    if (isArray(source)) {
      return source.map(item => RecordActionsConverter.getActionForWeb(item));
    }

    return [];
  }
}
