import { Predicate, GroupPredicate, FilterPredicate } from './';
import { filterPredicates, PREDICATE_AND, PREDICATE_OR, PREDICATE_EQ } from '../../common/form/SelectJournal/predicates';

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
                  val: '10.11.12'
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
                  val: ''
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
              val: ''
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

  static getGroups(predicates, columns) {
    const { val, t } = predicates || test;
    let groups = [];

    for (let i = 0, length = val.length; i < length; i++) {
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
        groups = [...groups, ...this.getGroups(current, columns)];
      }
    }

    return groups;
  }

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
        ors.push(ands);
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

  static getData(groups) {
    // console.log(groups);
    // console.log(test);
    groups = groups.map(group => {
      group.predicate = this.getPredicates(this.getOrs(group.getFilters()));
      return group;
    });

    return this.getPredicates(this.getOrs(groups));
  }
}
