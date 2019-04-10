import React, { Component } from 'react';
import classNames from 'classnames';
import { Well, Label, Select } from '../../common/form';
import { getPredicates } from '../../common/form/SelectJournal/predicates';
import { Filter, FiltersCondition } from '../';
import { ParserPredicate } from '../predicates';
import { t, trigger, getId } from '../../../helpers/util';

import './FiltersGroup.scss';

export default class FiltersGroup extends Component {
  constructor(props) {
    super(props);
    const filters = props.group.filters;

    this.state = { filters };
    this.store = Array.from(filters);
    this.conditions = getPredicates({ type: 'filterGroup' });
  }

  addFilter = column => {
    const store = this.store;
    const filter = ParserPredicate.createFilter({ att: column.attribute, columns: this.props.columns });

    store.push(filter);
    this.setState({ filters: Array.from(store) });
    this.triggerChangeFilters(store);
  };

  changeFilter = ({ predicate, index }) => {
    const store = this.store;
    const filter = store[index];
    filter.update(predicate);
    this.triggerChangeFilters(store);
  };

  deleteFilter = () => {
    this.triggerChangeFilters(this.store);
  };

  addGroup = condition => {
    trigger.call(this, 'onAddGroup', condition);
  };

  triggerChangeFilters = filters => {
    trigger.call(this, 'onChangeFilters', { filters: Array.from(filters), index: this.props.index });
  };

  changeFilterCondition = ({ condition, index }) => {
    const store = this.store;
    const filter = store[index];
    filter.setCondition(condition);
    this.triggerChangeFilters(store);
  };

  render() {
    const { className, columns, first, group } = this.props;

    return (
      <Well className={`ecos-well_full ecos-well_shadow ecos-well_radius_6 ${classNames('ecos-filters-group', className)}`}>
        <div className={'ecos-filters-group__head'}>
          {!first && (
            <FiltersCondition onClick={this.changeFilterCondition} condition={group.getCondition()} conditions={this.conditions} />
          )}
          <div className={'ecos-filters-group__tools'}>
            <Label className={'ecos-filters-group__tools_step label_clear label_nowrap label_middle-grey'}>{'Добавить'}</Label>

            <Select
              className={'ecos-filters-group__select ecos-filters-group__tools_step select_narrow'}
              placeholder={t('journals.default')}
              options={columns}
              getOptionLabel={option => option.text}
              getOptionValue={option => option.attribute}
              onChange={this.addFilter}
            />

            {first && (
              <Select
                className={'ecos-filters-group__select select_narrow'}
                placeholder={t('journals.default')}
                options={this.conditions}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={this.addGroup}
              />
            )}
          </div>
        </div>

        {this.state.filters.map((filter, idx) => {
          return (
            <Filter key={getId()} filter={filter} index={idx} onChange={this.changeFilter} onDelete={this.deleteFilter}>
              {idx > 0 && (
                <FiltersCondition
                  index={idx}
                  cross
                  onClick={this.changeFilterCondition}
                  condition={filter.getCondition()}
                  conditions={this.conditions}
                />
              )}
            </Filter>
          );
        })}
      </Well>
    );
  }
}
