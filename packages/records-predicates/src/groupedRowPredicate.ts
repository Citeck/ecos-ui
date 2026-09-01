import {
  COLUMN_DATA_TYPE_CONTENT,
  COLUMN_DATA_TYPE_DATE,
  COLUMN_DATA_TYPE_DATETIME,
  COLUMN_DATA_TYPE_MLTEXT,
  COLUMN_DATA_TYPE_OPTIONS,
  COLUMN_DATA_TYPE_TEXT,
  EQUAL_PREDICATES_MAP,
  PREDICATE_AND,
  PREDICATE_CONTAINS,
  PREDICATE_EMPTY,
  PREDICATE_ENDS,
  PREDICATE_EQ,
  PREDICATE_NOT,
  PREDICATE_OR,
  PREDICATE_STARTS
} from '@citeck/records-core/predicates/predicates';
import get from 'lodash/get';
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';

import Predicate from './Predicate';
import { isIgnoredByQuery } from './utils';

/**
 * Building the predicate for the records behind one row of a grouped journal (COREDEV-371).
 * See docs/journal-group-drilldown-or-filter.md for the full story.
 */

/** A predicate that constrains a single attribute, as opposed to an and/or/not container. */
const isEndPredicate = (predicate: any): boolean =>
  !!predicate && !!predicate.att && (!isArray(predicate.val) || predicate.val.every(isString));

/**
 * Operators for pinning a grouped attribute to the value of the clicked row. A group is an exact
 * value, so value-typed columns pin with equality — `contains` from `EQUAL_PREDICATES_MAP` would
 * also capture values that merely include the clicked one as a substring («Подписание» catching
 * «Подписание контрагентом»); for mltext the backend turns `eq` into an exact-locale-value match
 * while `contains` is a LIKE over the stored JSON, and for dates `ge` would capture everything on
 * and after the clicked value. Ref-valued columns (assoc, person, …) keep `contains`: there it
 * means membership of the exact ref, not a substring match.
 */
const GROUP_VALUE_PREDICATES: Record<string, string> = {
  ...EQUAL_PREDICATES_MAP,
  [COLUMN_DATA_TYPE_TEXT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_MLTEXT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_OPTIONS]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DATE]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DATETIME]: PREDICATE_EQ,
  // `not-empty` from EQUAL_PREDICATES_MAP is not a pin at all — it would return every record
  // with content instead of the clicked group
  [COLUMN_DATA_TYPE_CONTENT]: PREDICATE_EQ
};

/**
 * Conditions pinning the grouped attributes to the values of the clicked row — one per row key
 * that is a grouped column. A missing group value (`null`, `undefined` or `''`) pins with
 * `empty`: pinning it as `eq ''` would get the condition stripped by `removeEmptyPredicates`
 * before the query, silently widening the drill-down to the whole journal.
 */
export const buildRowPredicates = ({ row, columns, groupBy }: { row: any; columns: any[]; groupBy: any[] }): any[] => {
  const values: any[] = [];
  let filteredColumns: any[] = [];

  if (groupBy.length) {
    const _groupBy = groupBy[0].split('&');
    filteredColumns = columns.filter((c: any) => _groupBy.find((g: any) => g === c.attribute));
  }

  for (const key in row) {
    if (!row.hasOwnProperty(key)) {
      continue;
    }

    // `has`, not `||`: a falsy group value (0, '') must not fall through to the raw cell object
    const val = has(row, [key, 'value']) ? get(row, [key, 'value']) : get(row, [key]);
    const column = filteredColumns.find((c: any) => c.attribute === key) || {};
    const type = column.type;

    let predicate = type ? GROUP_VALUE_PREDICATES[type] || PREDICATE_EQ : undefined;

    if (predicate && (isNil(val) || val === '')) {
      predicate = PREDICATE_EMPTY;
    }

    if (predicate) {
      values.push(new Predicate({ att: key, t: predicate, val }));
    }
  }

  return values;
};

/**
 * Whether the condition is guaranteed to hold for every record of the group, i.e. for records whose
 * attributes carry the pinned values. Either the condition literally is one of the pinned ones, or
 * a pinned equality fixes the attribute to a concrete value and the condition evaluates to true at
 * that value.
 *
 * Only positive string operators are evaluated: `eq` exactly, `contains`/`starts`/`ends`
 * case-insensitively — matching how the server compares text (`=` vs LIKE over lowered values).
 * They are existential: one matching value is a proof, even if the attribute is multi-valued.
 * Negative operators (`not-eq`, `not-contains`, …) are universal — for a multi-valued attribute
 * the pinned value proves nothing about the other values — so they are never evaluated and stay in
 * the filter.
 */
const holdsForPinned = (predicate: any, pinned: any[]): boolean =>
  pinned.some((item: any) => {
    if (item.att !== predicate.att) {
      return false;
    }

    if (item.t === predicate.t && isEqual(item.val, predicate.val)) {
      return true;
    }

    if (item.t !== PREDICATE_EQ || !isString(item.val) || !isString(predicate.val) || !predicate.val) {
      return false;
    }

    // an equal `eq` condition was already accepted by the literal check above; the LIKE-backed
    // operators are matched case-insensitively, like the server matches text
    const pinnedVal = item.val.toLowerCase();
    const conditionVal = predicate.val.toLowerCase();

    switch (predicate.t) {
      case PREDICATE_CONTAINS:
        return pinnedVal.includes(conditionVal);
      case PREDICATE_STARTS:
        return pinnedVal.startsWith(conditionVal);
      case PREDICATE_ENDS:
        return pinnedVal.endsWith(conditionVal);
      default:
        return false;
    }
  });

/** Whether the predicate is fully determined by the given attributes, i.e. constrains nothing else. */
const dependsOnlyOnAtts = (predicate: any, atts: string[]): boolean => {
  if (!predicate || isString(predicate)) {
    return false;
  }

  if (isEndPredicate(predicate)) {
    return atts.includes(predicate.att);
  }

  if (predicate.t === PREDICATE_NOT) {
    return dependsOnlyOnAtts(predicate.val, atts);
  }

  return isArray(predicate.val) && !!predicate.val.length && predicate.val.every((item: any) => dependsOnlyOnAtts(item, atts));
};

/**
 * Drops from the predicate tree exactly what the query engine drops before running the query
 * (`removeEmptyPredicates`): conditions with no value, and containers left with no children —
 * including a childless group inside an OR. The simplification must run on the tree the engine
 * actually evaluates: the groups of the grouped journal were computed from the cleaned filter, so
 * this is also the tree the group ∩ filter invariant refers to. In particular an empty condition
 * inside an OR is *removed from the OR* here, like the engine does — it must never read as "this
 * branch is true" and short-circuit its siblings away.
 */
const withoutIgnoredConditions = (predicate: any): any => {
  if (!predicate || isString(predicate) || isEmpty(predicate)) {
    return null;
  }

  if (isEndPredicate(predicate)) {
    return isIgnoredByQuery(predicate) ? null : predicate;
  }

  if (!isArray(predicate.val)) {
    // a `not(...)` container — the engine keeps it as-is (its val is a non-empty object)
    return predicate;
  }

  const val = predicate.val.map(withoutIgnoredConditions).filter((item: any) => !isNil(item));

  return val.length ? { ...predicate, val } : null;
};

/**
 * Drops from `predicate` everything that is known to hold for every record of a group, and returns
 * `null` once nothing is left to check. Expects a tree already cleaned by
 * `withoutIgnoredConditions`, so a `null` from a child always means "provably true".
 *
 * A record of the group has the grouped attributes fixed to `pinned`, so a condition on those
 * attributes is either true for the whole group or false for the whole group. It can only be
 * dropped when it is true, which is known in two cases:
 *
 * - the condition holds for the pinned values (`holdsForPinned`);
 * - the condition sits in a conjunctive position, so every record matching the filter satisfies it —
 *   and the group exists, therefore it holds for the group value. Branches of a multi-branch OR are
 *   not conjunctive: there a condition on a grouped attribute may well be the false branch, which is
 *   why they are kept.
 */
const withoutGroupConditions = (predicate: any, atts: string[], pinned: any[], conjunctive: boolean): any => {
  if (!predicate || isString(predicate) || isEmpty(predicate)) {
    return null;
  }

  if (isEndPredicate(predicate)) {
    return holdsForPinned(predicate, pinned) || (conjunctive && atts.includes(predicate.att)) ? null : predicate;
  }

  if (conjunctive && dependsOnlyOnAtts(predicate, atts)) {
    return null;
  }

  if (!isArray(predicate.val)) {
    return predicate;
  }

  // Only an `and` keeps its children conjunctive; a single-branch `or` is an `and` in disguise.
  const childConjunctive = conjunctive && (predicate.t === PREDICATE_AND || predicate.val.length === 1);
  const val: any[] = [];

  for (const item of predicate.val) {
    const rest = withoutGroupConditions(item, atts, pinned, childConjunctive);

    if (isNil(rest)) {
      // A true branch satisfies the whole `or`; a true conjunct adds nothing to an `and`.
      if (predicate.t === PREDICATE_OR) {
        return null;
      }

      continue;
    }

    val.push(rest);
  }

  if (!val.length) {
    return null;
  }

  return val.length === 1 ? val[0] : { ...predicate, val };
};

/**
 * Combines the still-meaningful part of the active filter with the pinned conditions of the clicked
 * group row into the shape the filter settings UI (`ParserPredicate.parse`) renders unambiguously:
 * plain leftover conditions join the pinned ones in the main group, while a surviving multi-branch
 * OR becomes a nested condition group — flattened into the main group it would read as
 * `A or B and pinned` with no way to see the brackets.
 */
export const buildGroupedRowPredicate = ({ predicate, atts, pinned }: { predicate: any; atts: string[]; pinned: any[] }): any => {
  const rest = withoutGroupConditions(withoutIgnoredConditions(predicate), atts, pinned, true);

  const restItems = isNil(rest) ? [] : rest.t === PREDICATE_AND && isArray(rest.val) ? rest.val : [rest];
  const mainRows: any[] = [];
  const orGroups: any[] = [];

  for (const item of restItems) {
    if (isEndPredicate(item)) {
      mainRows.push(item);
    } else {
      orGroups.push(item.t === PREDICATE_OR ? item : { t: PREDICATE_OR, val: [item] });
    }
  }

  mainRows.push(...pinned);

  const mainGroup = {
    t: PREDICATE_OR,
    val: [mainRows.length === 1 ? mainRows[0] : { t: PREDICATE_AND, val: mainRows }]
  };

  if (!orGroups.length) {
    return { t: PREDICATE_OR, val: [mainGroup] };
  }

  return {
    t: PREDICATE_OR,
    val: [
      {
        t: PREDICATE_AND,
        val: [mainGroup, ...orGroups]
      }
    ]
  };
};
