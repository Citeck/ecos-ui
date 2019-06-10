import { Predicate, GroupPredicate, FilterPredicate } from './';
import { filterPredicates, getPredicates, PREDICATE_AND, PREDICATE_EMPTY, PREDICATE_OR } from '../../common/form/SelectJournal/predicates';

export default class ParserPredicate {
  static getDefaultPredicates(columns) {
    let val = [];

    for (let i = 0, length = columns.length; i < length; i++) {
      const column = columns[i];
      if (column.searchable && column.default) {
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

    for (let i = 0, length = val.length; i < length; i++) {
      let item = val[i];

      if (Array.isArray(item.val)) {
        item.val = this.removeEmptyPredicates(item.val);
      }
    }

    return val.filter(v => (Array.isArray(v.val) ? Boolean(v.val.length) : v.t !== PREDICATE_EMPTY && v.val !== ''));
  }

  static getGroupConditions() {
    return getPredicates({ type: 'filterGroup' });
  }

  static getFilters(predicates, columns) {
    const { val, t } = predicates;
    let filters = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (current.att) {
        filters.push(new FilterPredicate({ condition: filterPredicates([t])[0], predicate: new Predicate({ ...current }), columns }));
        continue;
      }

      if (current.val) {
        filters = [...filters, ...this.getFilters(current, columns)];
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

  static createGroup(gt, t, val) {
    return new GroupPredicate({
      condition: filterPredicates([gt])[0],
      predicate: new Predicate({
        t: t || '',
        val: val || []
      })
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

  static isGroup(val) {
    const subVal = val.val;
    let isGroup = false;

    if (val.att) {
      isGroup = false;
    } else if (subVal && subVal.filter(val => val.att)[0]) {
      isGroup = true;
    }

    return isGroup;
  }

  static parse(predicates, columns) {
    const { val = [], t } = predicates || {}; //|| test;
    const length = val.length;
    let groups = [];

    if (length) {
      for (let i = 0; i < length; i++) {
        const current = val[i];

        if (this.isGroup(current)) {
          groups.push(
            new GroupPredicate({
              condition: filterPredicates([t])[0],
              predicate: new Predicate({ ...current }),
              filters: this.getFilters(current, columns)
            })
          );
          continue;
        }

        if (current.val) {
          groups = [...groups, ...this.parse(current, columns)];
        }
      }
    } else {
      groups.push(ParserPredicate.createGroup(PREDICATE_AND));
    }

    return groups;
  }
}
