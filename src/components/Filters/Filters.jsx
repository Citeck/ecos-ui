import React, { Component } from 'react';
import classNames from 'classnames';
import { FiltersGroup } from './';
import { getId } from '../../helpers/util';

import './Filters.scss';

const OR = 'or';
const AND = 'and';

class Group {
  constructor(condition, predicate) {
    this.condition = condition;
    this.predicate = predicate;
  }
}

class Predicate {
  constructor(t, val) {
    this.t = t || OR;
    this.val = val || [];
  }
}

export default class Filters extends Component {
  constructor(props) {
    super(props);

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

    this.state = {
      groups: this.getGroups(test)
    };

    console.log(this.state.groups);
    console.log(test);
    console.log(this.getPredicates(this.getOrs(this.state.groups)));
  }

  getPredicates = ors => {
    let predicates = new Predicate();

    for (let i = 0, length = ors.length; i < length; i++) {
      const or = ors[i];
      const orCount = or.length;

      if (orCount === 1) {
        predicates.val.push(or[0]);
      } else {
        predicates.val.push(new Predicate(AND, or));
      }
    }

    return predicates;
  };

  getOrs = groups => {
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
  };

  isGroup = val => {
    const subVal = val.val;
    let isGroup = false;

    if (val.att) {
      isGroup = false;
    } else if (subVal && subVal.filter(val => val.att)[0]) {
      isGroup = true;
    }

    return isGroup;
  };

  getGroups = predicates => {
    const { val, t } = predicates;
    let groups = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (this.isGroup(current)) {
        groups.push(new Group(t, current));
        continue;
      }

      if (current.val) {
        groups = [...groups, ...this.getGroups(current)];
      }
    }

    return groups;
  };

  onCriterionChange = criterion => {
    console.log(criterion);
  };

  addSubGroup = criterion => {
    const groups = Array.from(this.state.groups);
    groups.push(new Group(criterion.value, new Predicate()));
    this.setState({ groups });
  };

  createGroup = (group, first) => {
    return (
      <FiltersGroup
        key={getId()}
        first={first}
        group={group}
        criterions={this.props.criterions || []}
        onCriterionChange={this.onCriterionChange}
        onChangeCondition={this.addSubGroup}
      />
    );
  };

  createSubGroup = (group, notLast) => {
    return (
      <div key={getId()} className={'ecos-filters__shift'}>
        <div className={'ecos-filters__bend'} />

        {notLast && <div className={'ecos-filters__v-line'} />}

        <div className={'ecos-filters__shift-slot'}>{this.createGroup(group)}</div>
      </div>
    );
  };

  render() {
    const { className } = this.props;
    const groups = this.state.groups;
    const lastIdx = groups.length - 1;

    return (
      <div className={classNames('ecos-filters', className)}>
        {groups.map((group, idx) => (idx > 0 ? this.createSubGroup(group, lastIdx !== idx) : this.createGroup(group, true)))}
      </div>
    );
  }
}
