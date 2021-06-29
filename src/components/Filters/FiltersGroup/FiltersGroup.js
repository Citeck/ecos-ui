import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import { t, trigger } from '../../../helpers/util';
import { IcoBtn } from '../../common/btns';
import { Label, Select, Well } from '../../common/form';
import { getPredicate, PREDICATE_LIST_WITH_CLEARED_VALUES } from '../../Records/predicates/predicates';
import { ParserPredicate } from '../predicates';
import { Filter, FiltersCondition } from '../';

import './FiltersGroup.scss';

const ListItem = ({ cssItemClasses, provided, item }) => {
  return (
    <li
      className={cssItemClasses}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style }}
    >
      {item}
    </li>
  );
};

export default class FiltersGroup extends Component {
  constructor(props) {
    super(props);
    this.portal = this.createDraggableContainer();
  }

  get cloneFilters() {
    return cloneDeep(this.props.group.filters);
  }

  onChangeFilterValue = ({ val, index }) => {
    const groupIndex = this.props.index;
    const filter = this.cloneFilters[index];
    filter.predicate.setVal(val);

    this.props.onChangeFilter({ filter, index, groupIndex });
  };

  onChangeFilterPredicate = ({ predicate, index }) => {
    const groupIndex = this.props.index;
    const filter = this.cloneFilters[index];
    const predicateData = getPredicate(predicate);

    if (PREDICATE_LIST_WITH_CLEARED_VALUES.includes(filter.predicate.t) || PREDICATE_LIST_WITH_CLEARED_VALUES.includes(predicate)) {
      filter.predicate.setVal(predicateData.fixedValue || '');
    }
    filter.predicate.setT(predicate);

    this.props.onChangeFilter({ filter, index, groupIndex });
  };

  deleteFilter = index => {
    trigger.call(this, 'onDeleteFilter', { index, groupIndex: this.props.index });
  };

  deleteGroup = () => {
    trigger.call(this, 'onDeleteGroup', this.props.index);
  };

  addFilter = column => {
    const filter = ParserPredicate.createFilter({
      att: column.attribute,
      columns: cloneDeep(this.props.columns),
      column: cloneDeep(column)
    });
    trigger.call(this, 'onAddFilter', { filter, groupIndex: this.props.index });
  };

  changeFilterCondition = ({ condition, index }) => {
    trigger.call(this, 'onChangeFilterCondition', { condition, index, groupIndex: this.props.index });
  };

  changeGroupFilterCondition = ({ condition }) => {
    trigger.call(this, 'onChangeGroupFilterCondition', { condition, groupIndex: this.props.index });
  };

  addGroup = condition => {
    trigger.call(this, 'onAddGroup', condition);
  };

  createDraggableContainer = () => {
    let div = document.createElement('div');
    document.body.appendChild(div);
    return div;
  };

  removeDraggableContainer = () => {
    document.body.removeChild(this.portal);
  };

  componentWillUnmount() {
    this.removeDraggableContainer();
  }

  render() {
    const { className, columns, first, group, index, droppableIdPrefix = '_', sourceId, metaRecord, textEmpty, needUpdate } = this.props;
    const groupConditions = ParserPredicate.getGroupConditions();
    const droppableId = `${droppableIdPrefix}${index}`;

    const dndFilters = group.filters.map((filter, idx) => (
      <Filter
        key={idx}
        index={idx}
        filter={filter}
        sourceId={sourceId}
        metaRecord={metaRecord}
        needUpdate={needUpdate}
        onChangeValue={this.onChangeFilterValue}
        onChangePredicate={this.onChangeFilterPredicate}
        onDelete={this.deleteFilter}
      >
        {idx > 0 && (
          <FiltersCondition
            index={idx}
            cross
            onClick={this.changeFilterCondition}
            condition={filter.getCondition()}
            conditions={groupConditions}
          />
        )}
      </Filter>
    ));

    return (
      <Well className={classNames('ecos-well_full ecos-well_border ecos-well_radius_6 ecos-filters-group', className)}>
        <div className={'ecos-filters-group__head'}>
          {!first && (
            <FiltersCondition onClick={this.changeGroupFilterCondition} condition={group.getCondition()} conditions={groupConditions} />
          )}
          <div className={'ecos-filters-group__tools'}>
            <Label className={'ecos-filters-group__tools_step label_clear label_nowrap label_middle-grey'}>
              {t('filter-list.filter-group-add')}
            </Label>

            <Select
              className={classNames('ecos-filters-group__select ecos-filters-group__tools_step select_narrow', {
                'ecos-select_blue': first,
                'ecos-select_grey': !first
              })}
              placeholder={t('filter-list.criterion')}
              options={columns}
              getOptionLabel={option => option.text}
              getOptionValue={option => option.attribute}
              onChange={this.addFilter}
            />

            {first && (
              <Select
                className={'ecos-filters-group__select select_narrow ecos-select_blue'}
                placeholder={t('filter-list.condition-group')}
                options={groupConditions}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={this.addGroup}
              />
            )}

            {!first && (
              <IcoBtn
                icon={'icon-delete'}
                className={
                  'ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height ' +
                  'ecos-btn_hover_t_red ecos-btn_x-step_10 ecos-filters-group__delete-btn'
                }
                onClick={this.deleteGroup}
              />
            )}
          </div>
        </div>

        <Droppable droppableId={droppableId}>
          {provided => (
            <ul className="ecos-filters-group__droppable" {...provided.droppableProps} ref={provided.innerRef}>
              {dndFilters.map((item, index) => {
                const draggableId = `${droppableId}_${index}`;

                return (
                  <Draggable key={index} draggableId={draggableId} index={index}>
                    {(provided, snapshot) => {
                      return snapshot.isDragging ? (
                        ReactDOM.createPortal(
                          <ListItem
                            cssItemClasses={classNames('ecos-filters-group__item', {
                              'ecos-filters-group__item_draggable': snapshot.isDragging
                            })}
                            provided={provided}
                            item={item}
                          />,
                          this.portal
                        )
                      ) : (
                        <ListItem provided={provided} item={item} />
                      );
                    }}
                  </Draggable>
                );
              })}
              <div className={classNames({ 'ecos-filters-group__empty': !dndFilters.length })}>
                {provided.placeholder}
                {!dndFilters.length && textEmpty}
              </div>
            </ul>
          )}
        </Droppable>
      </Well>
    );
  }
}
