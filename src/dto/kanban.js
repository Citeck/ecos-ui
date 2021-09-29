import isEmpty from 'lodash/isEmpty';

import { t } from '../helpers/util';

export default class KanbanConverter {
  static prepareList(source = []) {
    return (source || []).map(({ id, name }) => ({ id, name: name || t('kanban.label.no-name') }));
  }

  static prepareConfig(source = {}) {
    const target = { ...source };

    if (!isEmpty(source)) {
      target.readOnly = !!source.readOnly;
      target.name = source.name || t('kanban.label.no-name');
      target.actions = source.actions || [];
      target.columns = source.columns || [];
    }

    return target;
  }

  static preparePredicate(column) {
    const att = '_status';
    return column.id === 'EMPTY' ? { t: 'empty', att } : { t: 'eq', att, val: [column.id] };
  }

  static getCardAttributes() {
    return {
      cardId: '.id',
      cardTitle: '.disp',
      cardSubtitle: 'cardSubtitle'
    };
  }
}
