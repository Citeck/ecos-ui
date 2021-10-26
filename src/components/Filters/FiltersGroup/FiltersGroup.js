import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { Draggable, Droppable } from 'react-beautiful-dnd';

import { getId, t } from '../../../helpers/util';
import { IcoBtn } from '../../common/btns';
import { Select, Well } from '../../common/form';
import { getPredicate, PREDICATE_LIST_WITH_CLEARED_VALUES } from '../../Records/predicates/predicates';
import ZIndex from '../../../services/ZIndex';
import { ParserPredicate } from '../predicates';
import { Filter, FiltersCondition } from '../';
import ListItem from './ListItem';

import './FiltersGroup.scss';

export default class FiltersGroup extends Component {
  #filters = new Map();

  constructor(props) {
    super(props);
    this.portal = this.createDraggableContainer();
  }

  get cloneFilters() {
    return cloneDeep(get(this.props, 'group.filters', []));
  }

  getFilters = (filters, params) => {
    return filters.map((filter, idx) => {
      const { sourceId, metaRecord, needUpdate, groupConditions } = params;
      const key = JSON.stringify([filter, params]);
      let cachedFilter = this.#filters.get(key);

      if (!cachedFilter) {
        cachedFilter = (
          <Filter
            key={getId()}
            index={idx}
            filter={filter}
            sourceId={sourceId}
            metaRecord={metaRecord}
            needUpdate={needUpdate}
            onChangeValue={this.handleChangeFilterValue}
            onChangePredicate={this.handleChangeFilterPredicate}
            onDelete={this.handleDeleteFilter}
          >
            {idx > 0 && (
              <FiltersCondition
                index={idx}
                cross
                onClick={this.handleChangeFilterCondition}
                condition={filter.getCondition()}
                conditions={groupConditions}
              />
            )}
          </Filter>
        );
        this.#filters.set(key, cachedFilter);
      }

      return cachedFilter;
    });
  };

  handleChangeFilterValue = ({ val, index }) => {
    const { index: groupIndex, onChangeFilter } = this.props;
    const filter = this.cloneFilters[index];

    filter.predicate.setVal(val);
    onChangeFilter({ filter, index, groupIndex });
  };

  handleChangeFilterPredicate = ({ predicate, index }) => {
    const { index: groupIndex, onChangeFilter } = this.props;
    const filter = this.cloneFilters[index];
    const predicateData = getPredicate(predicate);

    if (PREDICATE_LIST_WITH_CLEARED_VALUES.includes(filter.predicate.t) || PREDICATE_LIST_WITH_CLEARED_VALUES.includes(predicate)) {
      filter.predicate.setVal(predicateData.fixedValue || '');
    }
    filter.predicate.setT(predicate);

    onChangeFilter({ filter, index, groupIndex });
  };

  handleDeleteFilter = index => {
    const { index: groupIndex, onDeleteFilter } = this.props;
    onDeleteFilter({ index, groupIndex });
  };

  handleDeleteGroup = () => {
    const { index, onDeleteGroup } = this.props;
    onDeleteGroup(index);
  };

  handleAddFilter = column => {
    const { index, columns, onAddFilter } = this.props;
    const filter = ParserPredicate.createFilter({
      att: column.attribute,
      columns: cloneDeep(columns),
      column: cloneDeep(column)
    });

    onAddFilter({ filter, groupIndex: index });
  };

  handleChangeFilterCondition = ({ condition, index }) => {
    const { index: groupIndex, onChangeFilterCondition } = this.props;
    onChangeFilterCondition({ condition, index, groupIndex });
  };

  handleChangeGroupFilterCondition = ({ condition }) => {
    const { index: groupIndex, onChangeGroupFilterCondition } = this.props;
    onChangeGroupFilterCondition({ condition, groupIndex });
  };

  handleAddGroup = condition => {
    const { onAddGroup } = this.props;
    onAddGroup(condition);
  };

  createDraggableContainer = () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    return div;
  };

  removeDraggableContainer = () => {
    document.body.removeChild(this.portal);
  };

  componentWillUnmount() {
    this.removeDraggableContainer();
  }

  renderFilter = React.memo(props => {
    const { idx, filter, sourceId, metaRecord, needUpdate, groupConditions } = props;

    return (
      <Filter
        key={filter.id || idx}
        index={idx}
        filter={filter}
        sourceId={sourceId}
        metaRecord={metaRecord}
        needUpdate={needUpdate}
        onChangeValue={this.handleChangeFilterValue}
        onChangePredicate={this.handleChangeFilterPredicate}
        onDelete={this.handleDeleteFilter}
      >
        {idx > 0 && (
          <FiltersCondition
            index={idx}
            cross
            onClick={this.handleChangeFilterCondition}
            condition={filter.getCondition()}
            conditions={groupConditions}
          />
        )}
      </Filter>
    );
  });

  render() {
    const { className, columns, first, group, index, droppableIdPrefix = '_', sourceId, metaRecord, textEmpty, needUpdate } = this.props;
    const groupConditions = ParserPredicate.getGroupConditions();
    const droppableId = `${droppableIdPrefix}${index}`;

    return (
      <Well className={classNames('ecos-filters-group', className)}>
        <div className="ecos-filters-group__head">
          {!first && (
            <FiltersCondition
              onClick={this.handleChangeGroupFilterCondition}
              condition={group.getCondition()}
              conditions={groupConditions}
            />
          )}
          <div className="ecos-filters-group__tools">
            <div className="ecos-filters-group__tools-label">{t('filter-list.filter-group-add')}</div>

            <Select
              className={classNames('ecos-filters-group__select select_narrow ecosZIndexAnchor', {
                'ecos-select_blue': first,
                'ecos-select_grey': !first
              })}
              placeholder={t('filter-list.criterion')}
              options={columns}
              getOptionLabel={option => option.text}
              getOptionValue={option => option.attribute}
              onChange={this.handleAddFilter}
              styles={{ menuPortal: base => ({ ...base, zIndex: ZIndex.calcZ() }) }}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
            />

            {first && (
              <Select
                className="ecos-filters-group__select select_narrow ecos-select_blue ecosZIndexAnchor"
                placeholder={t('filter-list.condition-group')}
                options={groupConditions}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={this.handleAddGroup}
                styles={{ menuPortal: base => ({ ...base, zIndex: ZIndex.calcZ() }) }}
                menuPortalTarget={document.body}
                menuPlacement="auto"
                closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
              />
            )}
            <div className="ecos-filters-group__tools-space" />
            {!first && (
              <IcoBtn
                icon={'icon-delete'}
                className="ecos-btn_i ecos-btn_grey4 ecos-btn_width_auto ecos-btn_extra-narrow ecos-btn_full-height ecos-btn_hover_t_red"
                onClick={this.handleDeleteGroup}
              />
            )}
          </div>
        </div>

        <Droppable droppableId={droppableId}>
          {provided => (
            <ul className="ecos-filters-group__droppable" {...provided.droppableProps} ref={provided.innerRef}>
              {group.filters.map((item, index) => {
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
                          >
                            <this.renderFilter
                              idx={index}
                              filter={item}
                              sourceId={sourceId}
                              metaRecord={metaRecord}
                              needUpdate={needUpdate}
                              groupConditions={groupConditions}
                            />
                          </ListItem>,
                          this.portal
                        )
                      ) : (
                        <ListItem provided={provided}>
                          <this.renderFilter
                            idx={index}
                            filter={item}
                            sourceId={sourceId}
                            metaRecord={metaRecord}
                            needUpdate={needUpdate}
                            groupConditions={groupConditions}
                          />
                        </ListItem>
                      );
                    }}
                  </Draggable>
                );
              })}
              <div className={classNames({ 'ecos-filters-group__empty': !group.filters.length })}>
                {provided.placeholder}
                {!group.filters.length && textEmpty}
              </div>
            </ul>
          )}
        </Droppable>
      </Well>
    );
  }
}

FiltersGroup.propTypes = {
  onChangeFilter: PropTypes.func,
  onDeleteFilter: PropTypes.func,
  onAddFilter: PropTypes.func,

  onDeleteGroup: PropTypes.func,
  onAddGroup: PropTypes.func,

  onChangeFilterCondition: PropTypes.func,
  onChangeGroupFilterCondition: PropTypes.func
};

FiltersGroup.defaultProps = {
  onChangeFilter: () => undefined,
  onDeleteFilter: () => undefined,
  onAddFilter: () => undefined,

  onDeleteGroup: () => undefined,
  onAddGroup: () => undefined,

  onChangeFilterCondition: () => undefined,
  onChangeGroupFilterCondition: () => undefined
};
