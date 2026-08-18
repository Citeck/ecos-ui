import { PREDICATES_WITHOUT_VALUE } from '@citeck/records-core/predicates/predicates';
import _ from 'lodash';

/** Random short id (copied from the app's helpers/util `getId`). */
export const getId = (prefix = ''): string => `${prefix}${Math.random().toString(36).substr(2, 9)}`;

function _getPropFromPredicate(shortName: string, longName: string, predicate: any): any {
  if (predicate.hasOwnProperty(shortName)) {
    return predicate[shortName];
  } else if (predicate.hasOwnProperty(longName)) {
    return predicate[longName];
  } else if (_.isObject((predicate as any).val)) {
    return _getPropFromPredicate(shortName, longName, (predicate as any).val);
  } else {
    return '';
  }
}

/** Extract the `att` of a predicate (copied from Journals/service/util). */
export function getAttFromPredicate(predicate: any): any {
  return _getPropFromPredicate('a', 'att', predicate);
}

/**
 * The single-predicate keep-rule of `ParserPredicate.removeEmptyPredicates`, inverted: whether the
 * query engine ignores this predicate when building the query. A container or a multi-value leaf
 * is ignored when its list emptied out; an operator that needs no value (`empty`/`not-empty`) is
 * never ignored; anything else is ignored when it has no value. Kept in one place because the
 * drill-down pre-clean (`withoutIgnoredConditions`) must mirror the engine exactly.
 */
export function isIgnoredByQuery(predicate: any): boolean {
  if (Array.isArray(predicate.val)) {
    return !predicate.val.length;
  }

  if (PREDICATES_WITHOUT_VALUE.includes(predicate.t)) {
    return false;
  }

  return !predicate.val && predicate.val !== 0 && predicate.val !== false;
}
