import isEmpty from 'lodash/isEmpty';

import { t } from '../helpers/util';

/**
 * Compose a single predicate for the board-cards `filter` from heterogeneous parts.
 * Each part may be a predicate object, an array of predicate objects, or falsy.
 * Returns null when nothing remains.
 */
export function buildBoardCardsFilter(parts) {
  const flat = [];
  (parts || []).forEach(p => {
    if (!p) return;
    if (Array.isArray(p)) {
      p.filter(Boolean).forEach(x => flat.push(x));
    } else {
      flat.push(p);
    }
  });
  if (flat.length === 0) return null;
  if (flat.length === 1) return flat[0];
  return { t: 'and', v: flat };
}

/**
 * Ref of the card that should precede the moved card after a drag (the `afterCard` anchor),
 * or null to drop at the top. `targetRecords` is the destination column/cell list as displayed;
 * the moved card is removed first so the index math is identical for same- and cross-column moves
 * (react-beautiful-dnd `toIndex` is the slot in the list without the dragged item).
 */
export function getAfterCardRef(targetRecords, toIndex, movedCardId) {
  const refOf = r => r && (r.id || r.cardId);
  const list = (targetRecords || []).filter(r => refOf(r) !== movedCardId);
  if (toIndex <= 0) return null;
  const anchor = list[toIndex - 1];
  if (anchor) return refOf(anchor);
  const last = list[list.length - 1];
  return last ? refOf(last) : null;
}

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

  static getStatusModifiedPredicate(column) {
    return column.hideOldItems
      ? {
          t: 'ge',
          att: '_statusModified',
          val: `-${column.hideItemsOlderThan}`
        }
      : undefined;
  }

  static prepareSwimlaneValues(values) {
    let hasUnassigned = false;
    const assigned = [];

    (values || []).forEach(item => {
      if (!item.id || item.id === '' || item.id === 'null' || item.id === null) {
        hasUnassigned = true;
      } else {
        assigned.push(item);
      }
    });

    assigned.sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));

    if (hasUnassigned) {
      assigned.push({ id: '__unassigned__', label: '' });
    }

    return assigned;
  }

  static getCardAttributes() {
    return {
      cardId: '.id',
      cardTitle: '.disp',
      cardSubtitle: 'cardSubtitle'
    };
  }
}
