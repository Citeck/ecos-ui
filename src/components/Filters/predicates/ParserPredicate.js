import { Predicate, GroupPredicate, FilterPredicate } from './';

const EQ = 'eq';
const OR = 'or';
const AND = 'and';

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
                  att: 'Дата создания 1',
                  t: 'ge',
                  val: ''
                },
                {
                  att: 'Заголовок 1',
                  t: 'contains',
                  val: ''
                }
              ]
            },
            {
              att: 'Заголовок 2',
              t: 'contains',
              val: ''
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
                  att: 'Дата создания 2',
                  t: 'ge',
                  val: ''
                },
                {
                  att: 'Заголовок 3',
                  t: 'contains',
                  val: ''
                }
              ]
            },
            {
              att: 'Заголовок 4',
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
              att: 'Дата создания 3',
              t: 'ge',
              val: ''
            },
            {
              att: 'Заголовок 5',
              t: 'contains',
              val: ''
            }
          ]
        },
        {
          att: 'Заголовок 6',
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

  static getGroups(predicates) {
    const { val, t } = predicates || test;
    let groups = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (this.isGroup(current)) {
        groups.push(new GroupPredicate(t, new Predicate({ ...current }), this.getFilters(current)));
        continue;
      }

      if (current.val) {
        groups = [...groups, ...this.getGroups(current)];
      }
    }

    return groups;
  }

  static getFilters(predicates) {
    const { val, t } = predicates;
    let filters = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (current.att) {
        filters.push(new FilterPredicate(t, current));
        continue;
      }

      if (current.val) {
        filters = [...filters, ...this.getFilters(current)];
      }
    }

    return filters;
  }

  static createFilter(att, t, val) {
    return new FilterPredicate(
      AND,
      new Predicate({
        att: att,
        t: t || EQ,
        val: val || ''
      })
    );
  }

  static createGroup(gt, t, val) {
    return new GroupPredicate(
      gt,
      new Predicate({
        t: t || OR,
        val: val || []
      })
    );
  }

  static getPredicates(ors) {
    let predicates = new Predicate({ t: OR, val: [] });

    for (let i = 0, length = ors.length; i < length; i++) {
      const or = ors[i];
      const orCount = or.length;

      if (orCount === 1) {
        predicates.val.push(or[0]);
      } else {
        predicates.val.push(new Predicate({ t: AND, val: or }));
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

      if (group.condition === AND) {
        ands.push(group.predicate);
      } else {
        ors.push(ands);
        ands = [];

        if (next && next.condition === AND) {
          ands.push(group.predicate);
        } else {
          ors.push([group.predicate]);
        }
      }
    }

    if (ands.length) {
      ors.push(ands);
    }

    return ors;
  }

  static getData(groups) {
    groups = groups.map(group => ({ ...group, predicate: this.getPredicates(this.getOrs(group.filters)) }));
    return this.getPredicates(this.getOrs(groups));
  }
}
