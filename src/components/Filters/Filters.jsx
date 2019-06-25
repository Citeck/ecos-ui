import React, { Component } from 'react';
import classNames from 'classnames';
import { FiltersGroup } from './';
import { ParserPredicate } from './predicates';
import { trigger } from '../../helpers/util';

import './Filters.scss';

export default class Filters extends Component {
  onChangeFilter = ({ filter, index, groupIndex }) => {
    this.groups[groupIndex].filters[index] = filter;
    this.triggerChange(this.groups);
  };

  onDeleteFilter = ({ index, groupIndex }) => {
    let filters = this.groups[groupIndex].filters;
    filters.splice(index, 1);

    if (groupIndex > 0 && !filters.length) {
      this.groups.splice(groupIndex, 1);
    }

    this.triggerChange(this.groups.length === 1 && !this.groups[0].filters.length ? [] : this.groups);
  };

  onAddFilter = ({ filter, groupIndex }) => {
    this.groups[groupIndex].filters.push(filter);
    this.triggerChange(this.groups);
  };

  onChangeFilterCondition = ({ condition, index, groupIndex }) => {
    this.groups[groupIndex].filters[index].setCondition(condition);
    this.triggerChange(this.groups);
  };

  onChangeGroupFilterCondition = ({ condition, groupIndex }) => {
    this.groups[groupIndex].setCondition(condition);
    this.triggerChange(this.groups);
  };

  addGroup = condition => {
    this.groups.push(ParserPredicate.createGroup(condition.value));
    this.triggerChange(this.groups);
  };

  triggerChange = groups => {
    const predicate = ParserPredicate.reverse(groups);
    trigger.call(this, 'onChange', predicate);
  };

  createGroup = (group, first, idx) => {
    return (
      <FiltersGroup
        key={idx}
        index={idx}
        first={first}
        group={group}
        columns={this.props.columns}
        onAddGroup={this.addGroup}
        onChangeFilter={this.onChangeFilter}
        onDeleteFilter={this.onDeleteFilter}
        onAddFilter={this.onAddFilter}
        onChangeGroupFilterCondition={this.onChangeGroupFilterCondition}
        onChangeFilterCondition={this.onChangeFilterCondition}
      />
    );
  };

  createSubGroup = (group, notLast, idx) => {
    return (
      <div key={idx} className={'ecos-filters__shift'}>
        <div className={'ecos-filters__bend'} />

        {notLast && <div className={'ecos-filters__v-line'} />}

        <div className={'ecos-filters__shift-slot'}>{this.createGroup(group, false, idx)}</div>
      </div>
    );
  };

  render() {
    const props = this.props;
    const groups = (this.groups = ParserPredicate.parse(props.predicate, props.columns));
    const length = groups.length;
    const lastIdx = length ? length - 1 : 0;

    return (
      <div className={classNames('ecos-filters', this.props.className)}>
        {groups.map((group, idx) => (idx > 0 ? this.createSubGroup(group, lastIdx !== idx, idx) : this.createGroup(group, true, idx)))}
      </div>
    );
  }
}
