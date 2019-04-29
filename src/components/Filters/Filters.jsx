import React, { Component } from 'react';
import classNames from 'classnames';
import { FiltersGroup } from './';
import { ParserPredicate } from './predicates';
import { getId, trigger } from '../../helpers/util';

import './Filters.scss';

export default class Filters extends Component {
  constructor(props) {
    super(props);
    const groups = ParserPredicate.parse(props.predicate, props.columns);
    this.state = { groups };
    this.store = Array.from(groups);
  }

  componentDidUpdate(prevProps) {
    const props = this.props;
    if (props.predicate !== prevProps.predicate) {
      const groups = ParserPredicate.parse(props.predicate, props.columns);
      this.setState({ groups });
    }
  }

  addGroup = condition => {
    const groups = this.store;
    groups.push(ParserPredicate.createGroup(condition.value));
    this.setState({ groups: Array.from(groups) });
  };

  onChangeFilters = ({ filters, index }) => {
    this.store[index].filters = filters;
    const predicate = ParserPredicate.reverse(this.store);

    trigger.call(this, 'onChange', predicate);
  };

  createGroup = (group, first, idx) => {
    return (
      <FiltersGroup
        index={idx}
        key={getId()}
        first={first}
        group={group}
        columns={this.props.columns}
        onAddGroup={this.addGroup}
        onChangeFilters={this.onChangeFilters}
      />
    );
  };

  createSubGroup = (group, notLast, idx) => {
    return (
      <div key={getId()} className={'ecos-filters__shift'}>
        <div className={'ecos-filters__bend'} />

        {notLast && <div className={'ecos-filters__v-line'} />}

        <div className={'ecos-filters__shift-slot'}>{this.createGroup(group, false, idx)}</div>
      </div>
    );
  };

  render() {
    const groups = this.state.groups;
    const length = groups.length;
    const lastIdx = length ? length - 1 : 0;

    return (
      <div className={classNames('ecos-filters', this.props.className)}>
        {groups.map((group, idx) => (idx > 0 ? this.createSubGroup(group, lastIdx !== idx, idx) : this.createGroup(group, true, idx)))}
      </div>
    );
  }
}
