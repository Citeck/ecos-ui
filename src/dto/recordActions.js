import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';

export default class RecordActionsConverter {
  static getActionForWeb(source = {}) {
    const target = {};

    if (isEmpty(source)) {
      return target;
    }

    target.id = source.id || '';
    target.formKey = source.formKey || '';
    target.title = source.title || '';

    const { claimable, releasable, reassignable, assignable } = source;
    target.stateAssign = { claimable, releasable, reassignable, assignable };

    return target;
  }

  static getActionListForWeb(source = []) {
    if (isArray(source)) {
      return source.map(item => RecordActionsConverter.getActionForWeb(item));
    }

    return [];
  }
}
