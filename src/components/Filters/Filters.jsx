import React, { Component } from 'react';
import classNames from 'classnames';
import { FiltersGroup } from './';
import { ParserPredicate } from './predicates';
import { DragDropContext } from 'react-beautiful-dnd';
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

  order = (source, startIndex, endIndex) => {
    if (source) {
      const result = source.filters;
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      source.filters = result;
    }

    return source;
  };

  move = (source, destination, startIndex, endIndex) => {
    let res;

    if (source && destination) {
      const from = source.filters;
      const to = destination.filters;

      const [removed] = from.splice(startIndex, 1);
      to.splice(endIndex, 0, removed);

      source.filters = from;
      destination.filters = to;

      res = { from: source, to: destination };
    }

    return res;
  };

  getIndexFromDroppableId = droppableId => {
    return droppableId.slice('_')[1];
  };

  onDragEnd = result => {
    const { source, destination } = result;
    const fromGroupIndex = this.getIndexFromDroppableId(source.droppableId);

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const group = this.order(this.groups[fromGroupIndex], source.index, destination.index);

      if (group) {
        this.groups[fromGroupIndex] = group;
        this.triggerChange(this.groups);
      }
    } else {
      const toGroupIndex = this.getIndexFromDroppableId(destination.droppableId);

      const moved = this.move(this.groups[fromGroupIndex], this.groups[toGroupIndex], source.index, destination.index);

      if (moved) {
        this.groups[fromGroupIndex] = moved.from;
        this.groups[toGroupIndex] = moved.to;
        this.triggerChange(this.groups);
      }
    }
  };

  render() {
    const props = this.props;
    const groups = (this.groups = ParserPredicate.parse(props.predicate, props.columns));
    const length = groups.length;
    const lastIdx = length ? length - 1 : 0;

    return (
      <div className={classNames('ecos-filters', this.props.className)}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          {groups.map((group, idx) => (idx > 0 ? this.createSubGroup(group, lastIdx !== idx, idx) : this.createGroup(group, true, idx)))}
        </DragDropContext>
      </div>
    );
  }
}
