import React, { Component } from 'react';
import classNames from 'classnames';
import { FiltersGroup } from './';
import { ParserPredicate } from './predicates';
import { getId } from '../../helpers/util';

import './Filters.scss';

export default class Filters extends Component {
  constructor(props) {
    super(props);
    const groups = ParserPredicate.parse(null, props.columns);
    this.state = { groups };
    this.store = Array.from(groups);
  }

  addGroup = condition => {
    const groups = this.store;
    groups.push(ParserPredicate.createGroup(condition.value));
    this.setState({ groups: Array.from(groups) });
  };

  onChangeFilters = ({ filters, index }) => {
    this.store[index].filters = filters;
    ParserPredicate.reverse(this.store);
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
    const lastIdx = groups.length - 1;

    return (
      <div className={classNames('ecos-filters', this.props.className)}>
        {groups.map((group, idx) => (idx > 0 ? this.createSubGroup(group, lastIdx !== idx, idx) : this.createGroup(group, true, idx)))}
      </div>
    );
  }
}
