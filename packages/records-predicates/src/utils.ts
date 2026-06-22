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
