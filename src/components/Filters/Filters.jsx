import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import cloneDeep from 'lodash/cloneDeep';

import { t, trigger } from '../../helpers/util';
import { RemoveDialog } from '../common/dialogs';
import { ErrorBoundary } from '../ErrorBoundary';
import { ParserPredicate } from './predicates';
import { FiltersGroup } from './';

import './Filters.scss';

class Filters extends Component {
  state = {
    isDialogShow: false,
    dialogTitle: '',
    dialogText: ''
  };

  get groups() {
    return cloneDeep(this.props.groups);
  }

  onChangeFilter = ({ filter, index, groupIndex }) => {
    const groups = this.groups;

    groups[groupIndex].filters[index] = filter;
    this.triggerChange(groups);
  };

  onDeleteFilter = () => {
    const index = this._filterIndex;
    const groupIndex = this._groupIndex;
    const groups = this.groups;

    let filters = groups[groupIndex].filters;
    filters.splice(index, 1);

    if (groupIndex > 0 && !filters.length) {
      groups.splice(groupIndex, 1);
    }

    this.triggerChange(groups);
    this.closeDialog();
  };

  onDeleteGroup = () => {
    if (this._groupIndex) {
      const groups = this.groups;

      groups.splice(this._groupIndex, 1);
      this.triggerChange(groups);
    }

    this.closeDialog();
  };

  onAddFilter = ({ filter, groupIndex }) => {
    const groups = this.groups;

    groups[groupIndex].filters.push(filter);
    this.triggerChange(groups);
  };

  onChangeFilterCondition = ({ condition, index, groupIndex }) => {
    const groups = this.groups;

    groups[groupIndex].filters[index].setCondition(condition);
    this.triggerChange(groups);
  };

  onChangeGroupFilterCondition = ({ condition, groupIndex }) => {
    const groups = this.groups;

    groups[groupIndex].setCondition(condition);
    this.triggerChange(groups);
  };

  addGroup = condition => {
    const groups = this.groups;

    groups.push(ParserPredicate.createGroup(condition.value));
    this.triggerChange(groups);
  };

  triggerChange = groups => {
    const predicate = ParserPredicate.reverse(groups);

    trigger.call(this, 'onChange', predicate);
  };

  createGroup = (group, first, idx, sourceId, metaRecord) => {
    const { classNameGroup, textEmpty, columns, needUpdate } = this.props;

    return (
      <FiltersGroup
        key={idx}
        index={idx}
        first={first}
        group={group}
        sourceId={sourceId}
        metaRecord={metaRecord}
        columns={columns}
        needUpdate={needUpdate}
        onAddGroup={this.addGroup}
        onChangeFilter={this.onChangeFilter}
        onDeleteFilter={this.showDeleteFilterDialog}
        onDeleteGroup={this.showDeleteGroupDialog}
        onAddFilter={this.onAddFilter}
        onChangeGroupFilterCondition={this.onChangeGroupFilterCondition}
        onChangeFilterCondition={this.onChangeFilterCondition}
        className={classNameGroup}
        textEmpty={textEmpty}
      />
    );
  };

  createSubGroup = (group, notLast, idx, sourceId, metaRecord) => {
    return (
      <div key={idx} className={'ecos-filters__shift'}>
        <div className={'ecos-filters__bend'} />

        {notLast && <div className={'ecos-filters__v-line'} />}

        <div className={'ecos-filters__shift-slot'}>{this.createGroup(group, false, idx, sourceId, metaRecord)}</div>
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

    const groups = this.groups;

    if (source.droppableId === destination.droppableId) {
      const group = this.order(groups[fromGroupIndex], source.index, destination.index);

      if (group) {
        groups[fromGroupIndex] = group;
        this.triggerChange(groups);
      }
    } else {
      const toGroupIndex = this.getIndexFromDroppableId(destination.droppableId);

      const moved = this.move(groups[fromGroupIndex], groups[toGroupIndex], source.index, destination.index);

      if (moved) {
        groups[fromGroupIndex] = moved.from;
        groups[toGroupIndex] = moved.to;
        this.triggerChange(groups);
      }
    }
  };

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDeleteGroupDialog = groupIndex => {
    this._groupIndex = groupIndex;

    this.setState({
      isDialogShow: true,
      dialogTitle: t('journals.action.delete-filter-group-msg'),
      dialogText: `${t('journals.action.remove-filter-group-msg')}`
    });

    this.delete = this.onDeleteGroup;
  };

  showDeleteFilterDialog = ({ index, groupIndex }) => {
    this._groupIndex = groupIndex;
    this._filterIndex = index;

    this.setState({
      isDialogShow: true,
      dialogTitle: t('journals.action.delete-filter-msg'),
      dialogText: `${t('journals.action.remove-filter-msg')}`
    });

    this.delete = this.onDeleteFilter;
  };

  delete = () => undefined;

  render() {
    const { isDialogShow, dialogTitle, dialogText } = this.state;
    const { sourceId, metaRecord, className, groups } = this.props;
    const length = groups.length;
    const lastIdx = length ? length - 1 : 0;
    // this.groups = groups;

    return (
      <ErrorBoundary>
        <div className={classNames('ecos-filters', className)}>
          <DragDropContext onDragEnd={this.onDragEnd}>
            {groups.map((group, idx) => {
              if (idx > 0) {
                return this.createSubGroup(group, lastIdx !== idx, idx, sourceId, metaRecord);
              } else {
                return this.createGroup(group, true, idx, sourceId, metaRecord);
              }
            })}
          </DragDropContext>

          <RemoveDialog
            isOpen={isDialogShow}
            title={dialogTitle}
            text={dialogText}
            className="ecos-modal_width-xs"
            onDelete={this.delete}
            onCancel={this.closeDialog}
            onClose={this.closeDialog}
          />
        </div>
      </ErrorBoundary>
    );
  }
}

Filters.propTypes = {
  predicate: PropTypes.object,
  columns: PropTypes.array,
  sourceId: PropTypes.string,
  metaRecord: PropTypes.string,
  className: PropTypes.string,
  classNameGroup: PropTypes.string,
  textEmpty: PropTypes.string,
  onChange: PropTypes.func
};

export default Filters;
