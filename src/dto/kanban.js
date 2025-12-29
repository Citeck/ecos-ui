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
      target.columns = KanbanConverter.prepareColumns(source.columns || []);
    }

    return target;
  }

  static prepareStatuses(statuses) {
    return statuses.map(status => ({ ...status, default: true }));
  }

  static prepareColumns(source = []) {
    const target = {};

    source.forEach(item => {
      if (!target[item.id]) {
        target[item.id] = { ...item };
      }
    });

    return Object.keys(target).map(id => target[id]);
  }

  static preparePredicate(column) {
    const att = '_status';
    return column.id === 'EMPTY' ? { t: 'empty', att } : { t: 'eq', att, val: [column.id] };
  }

  static getStatusModifiedPredicate(column) {
    return column.hideOldItems
      ? {
          t: 'ge',
          att: '_statusModified',
          val: `-${column.hideItemsOlderThan}`
        }
      : undefined;
  }

  static getCardAttributes() {
    return {
      cardId: '.id',
      cardTitle: '.disp',
      cardSubtitle: 'cardSubtitle'
    };
  }
}
