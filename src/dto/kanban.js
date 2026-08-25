import { PREDICATE_AND, PREDICATE_EQ } from '@citeck/records-core/predicates/predicates';
import { ParserPredicate } from '@citeck/records-predicates';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

import { t } from '../helpers/util';
import AttributesService from '../services/AttributesService';

import JournalsConverter from './journals';

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
 * GUESS of the record source a type is stored in — the UI counterpart of the server's
 * `typeSourceId(typeRef)`, used for a board that has no journal to take a resolved source from.
 *
 * It is only a guess, and knowingly so: it holds exactly while a type's localId equals its sourceId,
 * and the `emodel/` prefix is hardcoded. That is a long-standing assumption of this UI, not a
 * guarantee of the model — a type stored elsewhere would be summed from the wrong source. Whenever a
 * resolved `journalConfig.sourceId` is available it must be preferred over this function.
 *
 * @returns {?string}
 */
export function guessTypeSourceId(typeRef) {
  const typeId = typeRef ? AttributesService.parseId(typeRef) : undefined;

  return typeId ? `emodel/${typeId}` : undefined;
}

/**
 * Query behind the `hasSum` banner of a column (flat mode) or of one swimlane cell (grouped mode).
 *
 * It MUST reproduce the scope the cards themselves are loaded with. The cards go through the
 * `board-cards` source, where the SERVER adds the journal predicate and the type scope on top of
 * what the UI sends; the sum goes straight to the record source, so it has to add them itself —
 * otherwise it counts records that can never appear on the board (COREDEV-87: "the cells are empty
 * but a sum is shown").
 *
 * `journalPredicate`, `groupPredicate` and `relatedFilter` are shipped RAW: they are not the user's
 * filter form, and running a foreign predicate through the empty-predicate cleanup can invert the
 * meaning of its OR branches (emptiness is `true` under AND and `false` under OR). Everything else —
 * the user filter, the search predicate and the column's own `additionalFilter` — goes through
 * `replacePredicatesType(cleanUpPredicate(...))`: empty leaves dropped, data-type predicates
 * normalized.
 *
 * That is NOT byte-for-byte what the card query does, and knowingly so. There, only `params.predicates`
 * (the user filter) is cleaned and normalized; the search predicate and the column's `additionalFilter`
 * are sent raw (`sagas/kanban.js` — `buildBoardCardsFilter([predicates, searchPredicate, relatedFilter])`
 * and the per-column `additionalFilter`). With the predicate forms those two actually take today —
 * `contains` from the search box, `ge`/`le` from a column cutoff — both routes produce the same
 * predicate, so the difference is invisible; a form where it would not be has no coverage yet, so
 * moving them to the raw list is a query change that must not be made blind.
 *
 * `sourceId` and `ecosType` are NOT derived here: the caller (`Kanban.mapStateToProps`) is the only
 * place that knows whether the board is backed by the journal the page has loaded, and it is the
 * single owner of that rule. Whatever it hands over is queried as is.
 *
 * @returns {{sourceId: ?string, ecosType: ?string, query: Object, language: string, workspaces: string[], groupBy: string[]}}
 */
export function buildColumnSumQuery({
  column,
  sourceId,
  ecosType,
  journalPredicate,
  predicate,
  searchPredicate,
  groupPredicate,
  relatedFilter,
  workspaceId
}) {
  // The group that gets cleaned + type-normalized below: the user filter, the search box and the
  // column's own `additionalFilter`. The card query normalizes only the first of the three (see the
  // docblock) — on today's predicate forms the two routes agree.
  //
  // Copy: the array comes from the store and is shared by every ColumnSum instance.
  const userPredicates = Array.isArray(predicate) ? [...predicate] : [predicate];
  const additionalFilter = KanbanConverter.getAdditionalFilter(column);

  if (!isEmpty(searchPredicate) && isObject(searchPredicate)) {
    userPredicates.push(searchPredicate);
  }

  if (!isEmpty(additionalFilter) && isObject(additionalFilter)) {
    userPredicates.push(additionalFilter);
  }

  return {
    sourceId,
    // The source is a generic DAO that resolves attributes THROUGH the type — the server passes the
    // card type with every board-cards request for that reason, and `sum(<sumAtt>)` and predicates
    // over associations resolve to nothing without it. An empty value is not a type: send no key.
    ...(ecosType ? { ecosType } : {}),
    query: {
      t: PREDICATE_AND,
      v: [
        { t: PREDICATE_EQ, a: '_status', v: column.id },
        journalPredicate,
        groupPredicate,
        relatedFilter,
        ...ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(userPredicates))
      ].filter(Boolean)
    },
    language: 'predicate',
    workspaces: [`${workspaceId}`],
    groupBy: ['*']
  };
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

  /**
   * The column's additional card filter (predicate) or undefined. The SERVER computes it as the
   * column's `additionalFilter` attribute (currently the `hideOldItems` recency cutoff) — the single
   * source for the per-column filtering rule. We send it back in the board-cards query (so column
   * counts honour it) and apply it to the column sum; the UI never derives the rule itself.
   */
  static getAdditionalFilter(column) {
    return (column && column.additionalFilter) || undefined;
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
