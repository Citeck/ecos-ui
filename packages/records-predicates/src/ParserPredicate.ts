import {
  COLUMN_DATA_TYPE_DATE,
  COLUMN_DATA_TYPE_DATETIME,
  datePredicateVariables,
  EQUAL_PREDICATES_MAP,
  filterPredicates,
  getPredicates,
  PREDICATE_AND,
  PREDICATE_EQ,
  PREDICATE_NOT,
  PREDICATE_NOT_EQ,
  PREDICATE_OR,
  PREDICATE_TIME_INTERVAL,
  PREDICATES_WITHOUT_VALUE,
  SEARCH_EQUAL_PREDICATES_MAP
} from '@citeck/records-core/predicates/predicates';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';

import FilterPredicate from './FilterPredicate';
import GroupPredicate from './GroupPredicate';
import Predicate from './Predicate';
import { buildGroupedRowPredicate, buildRowPredicates } from './groupedRowPredicate';
import { getAttFromPredicate, isIgnoredByQuery } from './utils';

export default class ParserPredicate {
  static get predicatesWithoutValue(): any[] {
    return PREDICATES_WITHOUT_VALUE;
  }

  static getSearchPredicates({ text, columns, groupBy }: { text: any; columns: any[]; groupBy: any }): any {
    const val: any[] = [];

    if (groupBy && groupBy.length) {
      groupBy = groupBy[0].split('&');
      columns = columns.filter((c: any) => groupBy.filter((g: any) => g === c.attribute)[0]);
    }

    columns &&
      columns.forEach((c: any) => {
        if (c.visible && c.default && c.searchable) {
          const predicate = (SEARCH_EQUAL_PREDICATES_MAP as any)[c.type];

          if (predicate) {
            val.push(new Predicate({ att: c.attribute, t: predicate, val: text }));
          }
        }
      });

    return val.length
      ? {
          t: PREDICATE_OR,
          val: [
            {
              t: PREDICATE_OR,
              val: val
            }
          ]
        }
      : null;
  }

  static getAvailableSearchColumns(columns: any[]): any[] {
    return columns.filter((item: any) => ![COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME].includes(item.type));
  }

  static getRowPredicates({ row, columns, groupBy }: { row: any; columns: any[]; groupBy: any[] }): any[] {
    return buildRowPredicates({ row, columns, groupBy });
  }

  /**
   * Predicate for the records behind one row of a grouped journal — the grouped attributes pinned to
   * the values of that row, on top of the part of the active filter that still has something to say.
   *
   * The conditions of the active filter that only constrain the grouped attributes are dropped: the
   * clicked group already fixes those attributes, so keeping them would duplicate the pinned
   * condition and, for an OR filter, leave branches of groups the user did not click.
   * See `groupedRowPredicate.ts` for the rules.
   */
  static getGroupedRowPredicate({ row, columns, groupBy, predicate }: { row: any; columns: any[]; groupBy: any[]; predicate: any }): any {
    const pinned = ParserPredicate.getRowPredicates({ row, columns, groupBy });

    if (!pinned.length) {
      return predicate;
    }

    const atts = (groupBy || []).reduce((res: string[], item: any) => res.concat(String(item).split('&')), []);

    return buildGroupedRowPredicate({ predicate, atts, pinned });
  }

  static getDefaultPredicates(columns: any[], extra: any, defaultPredicatesList: any[]): any {
    const defaultPredicatesByAtt: Record<string, any> = {};
    if (defaultPredicatesList && defaultPredicatesList.length) {
      for (const pred of defaultPredicatesList) {
        const att = getAttFromPredicate(pred);
        if (att) {
          defaultPredicatesByAtt[att] = pred;
        }
      }
    }

    const val: any[] = [];

    for (let i = 0; i < get(columns, 'length', 0); i++) {
      const column = columns[i] || {};

      if (defaultPredicatesByAtt.hasOwnProperty(column.attribute)) {
        val.push(defaultPredicatesByAtt[column.attribute]);
        continue;
      }

      if ((column.searchable && column.default) || (extra && extra.includes(column.attribute))) {
        const predicates = getPredicates(column);
        val.push(new Predicate({ att: column.attribute, t: predicates[0].value, val: '' }));
      }
    }

    return {
      t: PREDICATE_OR,
      val: [
        {
          t: PREDICATE_OR,
          val: [
            {
              t: PREDICATE_AND,
              val: val
            }
          ]
        }
      ]
    };
  }

  static removeEmptyPredicates(val: any): any {
    val = val || [];

    if (isEmpty(val)) {
      return [];
    }

    if (typeof val === 'string') {
      return val;
    }

    for (let i = 0, length = val.length; i < length; i++) {
      const item = val[i];

      if (item && Array.isArray(item.val)) {
        item.val = this.removeEmptyPredicates(item.val);
      }
    }

    return val.filter((v: any) => {
      if (isNil(v)) {
        return false;
      }

      if (typeof v === 'string') {
        return !isEmpty(v);
      }

      // shared with the group drill-down pre-clean, which must mirror this rule exactly
      return !isIgnoredByQuery(v);
    });
  }

  static replacePredicatesType(val: any[] = []): any {
    return val.map((predicate: any) => ParserPredicate.replacePredicateType(predicate));
  }

  static replacePredicateType(predicate: any): any {
    /* Cause: https://citeck.atlassian.net/browse/ECOSUI-1197
     *
     * To support multiple selection of predicate text values
     */
    if (typeof predicate === 'string') {
      return predicate;
    }

    let type = (EQUAL_PREDICATES_MAP as any)[predicate.t] || predicate.t;
    let val = predicate.val;

    if (predicate.t === PREDICATE_TIME_INTERVAL && !Array.isArray(val)) {
      const { INTERVAL_DELIMITER: delimiter, NOW: now } = datePredicateVariables;
      const parts = val.split(delimiter);

      if (parts.length === 1) {
        type = PREDICATE_EQ;
        val = val.charAt(0) === '-' ? val + `${delimiter}${now}` : `${now}${delimiter}` + val;
      }
    }

    return {
      ...predicate,
      t: type,
      val: Array.isArray(predicate.val) ? ParserPredicate.replacePredicatesType(predicate.val) : val
    };
  }

  static getGroupConditions(): any {
    return getPredicates({ type: 'filterGroup' });
  }

  static getFilters(predicates: any, columns: any[], condition?: any): any[] {
    const { val = [], t } = predicates;
    let filters: any[] = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (current.t === PREDICATE_NOT) {
        filters.push(
          new FilterPredicate({
            condition: filterPredicates([!i && condition ? condition : PREDICATE_NOT_EQ])[0],
            predicate: new Predicate({ ...current.val, t: PREDICATE_NOT_EQ }),
            columns
          })
        );
        continue;
      }

      if (current.att) {
        filters.push(
          new FilterPredicate({
            condition: filterPredicates([!i && condition ? condition : t])[0],
            predicate: new Predicate({ ...current }),
            columns
          })
        );
        continue;
      }

      if (Array.isArray(current.val)) {
        filters = [...filters, ...this.getFilters(current, columns, i ? t : null)];
      }
    }

    return filters;
  }

  static createFilter({ att, t, val, columns, column }: any): any {
    return new FilterPredicate({
      condition: filterPredicates([PREDICATE_AND])[0],
      predicate: new Predicate({
        att: att,
        t: t || column ? (getPredicates(column)[0] || {}).value : '',
        val: val || ''
      }),
      columns
    });
  }

  static createGroup(t: any, predicate: any = {}, filters?: any): any {
    return new GroupPredicate({
      condition: filterPredicates([t])[0],
      predicate: new Predicate({
        t: predicate.t || '',
        val: predicate.val || [],
        att: predicate.att
      }),
      filters: filters
    });
  }

  static createPredicate({ att, t, val }: any): any {
    return new Predicate({ att, t, val });
  }

  static getPredicates(ors: any[]): any {
    const predicates = new Predicate({ t: PREDICATE_OR, val: [] });

    for (let i = 0, length = ors.length; i < length; i++) {
      const or = ors[i];
      const orCount = or.length;

      if (orCount === 1) {
        predicates.add(or[0]);
      } else {
        predicates.add(new Predicate({ t: PREDICATE_AND, val: or }));
      }
    }

    return predicates;
  }

  static getOrs(groups: any[]): any[] {
    const ors: any[] = [];
    let ands: any[] = [];

    for (let i = 0, length = groups.length; i < length; i++) {
      const group = groups[i];
      const next = groups[i + 1];

      if (group.getCondition() === PREDICATE_AND) {
        ands.push(group.getPredicate());
      } else {
        if (ands.length) {
          ors.push(ands);
        }

        ands = [];

        if (next && next.getCondition() === PREDICATE_AND) {
          ands.push(group.getPredicate());
        } else {
          ors.push([group.getPredicate()]);
        }
      }
    }

    if (ands.length) {
      ors.push(ands);
    }

    return ors;
  }

  static reverse(groups: any[]): any {
    groups = (groups || []).map((group: any) => {
      group.predicate = this.getPredicates(this.getOrs(group.getFilters()));
      return group;
    });

    return groups.length ? this.getPredicates(this.getOrs(groups)) : null;
  }

  static parse(predicates: any, columns: any[]): any[] {
    const { val = [], t } = predicates || {};
    const length = val.length;
    let groups: any[] = [];

    for (let i = 0; i < length; i++) {
      const current = val[i];

      if (current.t === PREDICATE_OR) {
        groups.push(ParserPredicate.createGroup(t, current, this.getFilters(current, columns)));
      } else {
        groups = [...groups, ...this.parse(current, columns)];
      }
    }

    return groups;
  }

  static isWithoutValue(predicate: any = {}): boolean {
    return ParserPredicate.predicatesWithoutValue.includes(predicate.t);
  }

  static getFlatFilters(predicates: any): any[] {
    const out: any[] = [];

    if (isEmpty(predicates)) {
      return out;
    }

    predicates = cloneDeep(predicates);
    predicates = isArray(predicates) ? predicates : predicates.val || [];

    const flat = (arr: any) => {
      isArray(arr) &&
        arr.forEach((item: any) => {
          if (!isArray(item.val) && (!!item.val || item.val === false || item.val === 0 || ParserPredicate.isWithoutValue(item))) {
            out.push(item);
          } else if (isArray(item.val)) {
            if (isEmpty(item.val)) {
              return;
            }

            if (item.val.every((v: any) => typeof v === 'string')) {
              out.push(item);
              return;
            }

            flat(item.val);
          }
        });
    };

    flat(predicates);

    return out;
  }

  static setNewPredicates(_predicates: any, _newPredicate: any, addUnknown?: boolean): any {
    const newPredicate = cloneDeep(_newPredicate);
    let predicates = cloneDeep(_predicates);
    let wasSet = false;

    if (!predicates) {
      return [];
    }

    if (Array.isArray(newPredicate)) {
      const flatPredicates = ParserPredicate.getFlatFilters(predicates);
      let newPredicates = predicates;

      newPredicate
        .filter((item: any) => {
          const index = (flatPredicates || []).findIndex((i: any) => isEqual(i, item));

          return index === -1;
        })
        .forEach((item: any) => {
          newPredicates = ParserPredicate.setNewPredicates(newPredicates, item);
        });

      return newPredicates;
    }

    (function forEach(arr: any) {
      arr.forEach((item: any) => {
        if (isString(item)) {
          return;
        }

        if (isArray(item.val) && !item.val.some((i: any) => isString(i))) {
          forEach(item.val);

          return;
        }

        if (item.t === PREDICATE_NOT) {
          item = { ...item.val, t: PREDICATE_NOT_EQ };
        }

        if (isEqual(item.att, newPredicate.att)) {
          wasSet = true;

          if (isEqual(newPredicate, item)) {
            delete newPredicate.att;
            return;
          }

          if (isEqual(item.att, newPredicate.att) && (!isEqual(item.val, newPredicate.val) || !isEqual(item.t, newPredicate.t))) {
            item.val = newPredicate.val;

            if (!isNil(newPredicate.t)) {
              item.t = newPredicate.t;
            }

            delete newPredicate.att;
          }
        }
      });
    })(predicates.val || []);

    if (!wasSet && addUnknown) {
      predicates = ParserPredicate.addNewPredicate(predicates, _newPredicate);
    }

    return predicates;
  }

  /**
   * Adds a condition on an attribute the filter does not mention yet so that it is AND-ed with
   * everything the filter already requires — a column header filter narrows the current result set,
   * never widens it. The filter is an OR of settings groups, each an OR of AND-ed criteria (the shape
   * `reverse` and `buildGroupedRowPredicate` produce), so the condition is distributed into every
   * disjunctive branch and appended to a conjunctive one. A branch that is a bare criterion — a
   * settings group with a single criterion, or a drill-down that left nothing but the pinned group
   * value — has no `and` to append to and gets one; pushed into the `or` it sits in, the condition
   * used to become an alternative instead of a restriction (COREDEV-371). Inside an `and` holding
   * nested groups the condition goes to the first group only: `(A and B) and X` ≡ `(A and X) and B`,
   * while a copy in every group would show up twice in the settings panel.
   */
  static addNewPredicate(_predicates: any, predicate: any): any {
    const predicates = cloneDeep(_predicates);
    const condition = new Predicate(predicate);
    const isContainer = (item: any): boolean => !!item && !item.att && isArray(item.val);

    const add = (container: any): void => {
      if (!container.val.length) {
        container.val.push(condition);
        return;
      }

      if (container.t === PREDICATE_OR) {
        container.val = container.val.map((item: any) => {
          if (isContainer(item)) {
            add(item);
            return item;
          }

          return new Predicate({ t: PREDICATE_AND, val: [item, condition] });
        });
        return;
      }

      const nested = container.val.find(isContainer);

      if (nested) {
        add(nested);
      } else {
        container.val.push(condition);
      }
    };

    if (isContainer(predicates)) {
      add(predicates);
    }

    return predicates;
  }

  static getWrappedPredicate(value: any): any {
    return {
      t: PREDICATE_OR,
      val: [
        {
          t: PREDICATE_OR,
          val: [
            {
              t: PREDICATE_AND,
              val: value
            }
          ]
        }
      ]
    };
  }
}
