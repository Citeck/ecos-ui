import { Predicate, GroupPredicate, FilterPredicate } from './';
import { filterPredicates, PREDICATE_AND, PREDICATE_OR } from '../../common/form/SelectJournal/predicates';

const test = {
  t: 'or',
  val: [
    {
      t: 'and',
      val: [
        {
          t: 'or',
          val: [
            {
              t: 'and',
              val: [
                {
                  att: 'cm:created',
                  t: 'ge',
                  val: '2018-11-20T09:55:33Z'
                },
                {
                  att: 'cm:title',
                  t: 'contains',
                  val: 'те'
                }
              ]
            },
            {
              att: 'cm:title',
              t: 'contains',
              val: 'тес'
            }
          ]
        },
        {
          t: 'or',
          val: [
            {
              t: 'and',
              val: [
                {
                  att: 'cm:created',
                  t: 'ge',
                  val: '2018-11-20T09:55:33Z'
                },
                {
                  att: 'cm:title',
                  t: 'contains',
                  val: ''
                }
              ]
            },
            {
              att: 'cm:title',
              t: 'contains',
              val: ''
            }
          ]
        }
      ]
    },
    {
      t: 'or',
      val: [
        {
          t: 'and',
          val: [
            {
              att: 'cm:created',
              t: 'ge',
              val: '2018-11-20T09:55:33Z'
            },
            {
              att: 'cm:title',
              t: 'contains',
              val: ''
            }
          ]
        },
        {
          att: 'cm:title',
          t: 'contains',
          val: ''
        }
      ]
    }
  ]
};

export default class ParserPredicate {
  static getFilters(predicates, columns) {
    const { val, t } = predicates;
    let filters = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (current.att) {
        filters.push(new FilterPredicate({ condition: filterPredicates([t])[0], predicate: current, columns }));
        continue;
      }

      if (current.val) {
        filters = [...filters, ...this.getFilters(current, columns)];
      }
    }

    return filters;
  }

  static createFilter({ att, t, val, columns }) {
    return new FilterPredicate({
      condition: filterPredicates([PREDICATE_AND])[0],
      predicate: new Predicate({
        att: att,
        t: t || '',
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
    groups = groups.filter(f => f.filters && f.filters.length);

    groups = groups.map(group => {
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
