import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import isNil from 'lodash/isNil';

import {
  COLUMN_DATA_TYPE_DATE,
  COLUMN_DATA_TYPE_DATETIME,
  datePredicateVariables,
  EQUAL_PREDICATES_MAP,
  filterPredicates,
  getPredicates,
  PREDICATE_AND,
  PREDICATE_EMPTY,
  PREDICATE_EQ,
  PREDICATE_NOT_EMPTY,
  PREDICATE_OR,
  PREDICATE_TIME_INTERVAL,
  SEARCH_EQUAL_PREDICATES_MAP
} from '../../Records/predicates/predicates';
import { FilterPredicate, GroupPredicate, Predicate } from './';

export default class ParserPredicate {
  static get predicatesWithoutValue() {
    return [PREDICATE_NOT_EMPTY, PREDICATE_EMPTY];
  }

  static getSearchPredicates({ text, columns, groupBy }) {
    const val = [];

    if (groupBy && groupBy.length) {
      groupBy = groupBy[0].split('&');
      columns = columns.filter(c => groupBy.filter(g => g === c.attribute)[0]);
    }

    columns &&
      columns.forEach(c => {
        if (c.visible && c.default && c.searchable) {
          const predicate = SEARCH_EQUAL_PREDICATES_MAP[c.type];

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

  static getAvailableSearchColumns(columns) {
    return columns.filter(item => ![COLUMN_DATA_TYPE_DATE, COLUMN_DATA_TYPE_DATETIME].includes(item.type));
  }

  static getRowPredicates({ row, columns, groupBy }) {
    const values = [];
    let filteredColumns = [];

    if (groupBy.length) {
      const _groupBy = groupBy[0].split('&');
      filteredColumns = columns.filter(c => _groupBy.find(g => g === c.attribute));
    }

    for (const key in row) {
      if (!row.hasOwnProperty(key)) {
        continue;
      }

      const val = get(row, [key, 'value']) || get(row, [key]);
      const column = filteredColumns.find(c => c.attribute === key) || {};
      const type = column.type;
      const predicate = EQUAL_PREDICATES_MAP[type];

      if (predicate) {
        values.push(new Predicate({ att: key, t: predicate, val }));
      }
    }

    return values;
  }

  static getDefaultPredicates(columns, extra) {
    let val = [];

    for (let i = 0; i < get(columns, 'length', 0); i++) {
      const column = columns[i] || {};

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

  static removeEmptyPredicates(val) {
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

    return val.filter(v => {
      if (isNil(v)) {
        return false;
      }

      if (Array.isArray(v.val)) {
        return !!v.val.length;
      }

      if (ParserPredicate.isWithoutValue(v)) {
        return true;
      }

      if (typeof v === 'string' && !isEmpty(v)) {
        return true;
      }

      return !!v.val || v.val === 0 || v.val === false;
    });
  }

  static replacePredicatesType(val = []) {
    return val.map(predicate => ParserPredicate.replacePredicateType(predicate));
  }

  static replacePredicateType(predicate) {
    /* Cause: https://citeck.atlassian.net/browse/ECOSUI-1197
     *
     * To support multiple selection of predicate text values
     */
    if (typeof predicate === 'string') {
      return predicate;
    }

    let type = EQUAL_PREDICATES_MAP[predicate.t] || predicate.t;
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

  static getGroupConditions() {
    return getPredicates({ type: 'filterGroup' });
  }

  static getFilters(predicates, columns, condition) {
    const { val, t } = predicates;
    let filters = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

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

      if (current.val) {
        filters = [...filters, ...this.getFilters(current, columns, i ? t : null)];
      }
    }

    return filters;
  }

  static createFilter({ att, t, val, columns, column }) {
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

  static createGroup(t, predicate = {}, filters) {
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

  static createPredicate({ att, t, val }) {
    return new Predicate({ att, t, val });
  }

  static getPredicates(ors) {
    let predicates = new Predicate({ t: PREDICATE_OR, val: [] });

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

  static getOrs(groups) {
    let ors = [];
    let ands = [];

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

  static reverse(groups) {
    groups = (groups || []).map(group => {
      group.predicate = this.getPredicates(this.getOrs(group.getFilters()));
      return group;
    });

    return groups.length ? this.getPredicates(this.getOrs(groups)) : null;
  }

  static parse(predicates, columns) {
    const { val = [], t } = predicates || {};
    const length = val.length;
    let groups = [];

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

  static isWithoutValue(predicate = {}) {
    return ParserPredicate.predicatesWithoutValue.includes(predicate.t);
  }

  static getFlatFilters(predicates) {
    const out = [];

    if (isEmpty(predicates)) {
      return out;
    }

    predicates = cloneDeep(predicates);
    predicates = isArray(predicates) ? predicates : predicates.val || [];

    const flat = arr => {
      isArray(arr) &&
        arr.forEach(item => {
          if (!isArray(item.val) && (!!item.val || item.val === false || item.val === 0 || ParserPredicate.isWithoutValue(item))) {
            out.push(item);
          } else if (isArray(item.val)) {
            if (item.val.every(v => typeof v === 'string')) {
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

  static setNewPredicates(_predicates, _newPredicate, setUnknown) {
    const predicates = cloneDeep(_predicates);
    const newPredicate = cloneDeep(_newPredicate);
    const existed = ParserPredicate.getFlatFilters(_predicates);
    let thisLvl = false;
    console.log(_predicates, existed);
    if (!predicates) {
      return [];
    }

    if (Array.isArray(newPredicate)) {
      const flatPredicates = ParserPredicate.getFlatFilters(predicates);
      let newPredicates = predicates;

      newPredicate
        .filter(item => {
          const index = (flatPredicates || []).findIndex(i => isEqual(i, item));

          return index === -1;
        })
        .forEach(item => {
          newPredicates = ParserPredicate.setNewPredicates(newPredicates, item);
        });

      return newPredicates;
    }

    const forEach = arr => {
      arr.forEach(item => {
        if (isString(item)) {
          return;
        }

        if (isArray(item.val) && !item.val.some(i => isString(i))) {
          forEach(item.val);

          return;
        }

        thisLvl = !thisLvl && !!existed.find(ex => isEqual(ex.att, item.att));

        if (thisLvl && setUnknown) {
          console.log('123');
        }

        if (isEqual(item.att, newPredicate.att)) {
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
    };

    forEach(predicates.val || []);

    return predicates;
  }

  static setPredicateValue(predicates, newPredicate) {
    if (!predicates) {
      return [];
    }

    if (Array.isArray(newPredicate)) {
      let newPredicates = predicates;

      newPredicate.forEach(item => {
        newPredicates = ParserPredicate.setPredicateValue(newPredicates, item);
      });

      return newPredicates;
    }

    predicates = cloneDeep(predicates);

    const foreach = arr => {
      arr.forEach(item => {
        if (!isArray(item.val) && item.att === newPredicate.att) {
          item.val = newPredicate.val;

          if (newPredicate.t) {
            item.t = newPredicate.t;
          }
        } else if (isArray(item.val)) {
          foreach(item.val);
        }
      });
    };

    foreach(predicates.val || []);

    return predicates;
  }

  static getWrappedPredicate(value) {
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
