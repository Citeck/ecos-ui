import React, { Component } from 'react';
import classNames from 'classnames';
import { Well, Label, Select } from '../../common/form/index';
import { Filter, FiltersCondition } from '../';
import { ParserPredicate } from '../predicates';
import { t, trigger, getId } from '../../../helpers/util';

import './FiltersGroup.scss';

const CONDITIONS = [{ text: 'И', value: 'and' }, { text: 'ИЛИ', value: 'or' }];

const CONDITIONS_MAP = { or: 'или', and: 'и' };

export default class FiltersGroup extends Component {
  constructor(props) {
    super(props);
    const filters = props.group.filters;

    this.state = { filters: filters };
    this._filters = Array.from(filters);
  }

  addFilter = criterion => {
    const filters = this._filters;
    const filter = ParserPredicate.createFilter(criterion.text);

    filters.push(filter);
    this.setState({ filters: Array.from(filters) });
    this.triggerChange(filters);
  };

  changeFilter = ({ predicate, index }) => {
    const filters = this._filters;
    const filter = filters[index];
    filter.update(predicate);
    this.triggerChange(filters);
  };

  deleteFilter = ({ predicate, index }) => {
    const filters = this._filters;
    this.triggerChange(filters);
  };

  addGroup = condition => {
    trigger.call(this, 'onAddGroup', condition);
  };

  triggerChange = filters => {
    trigger.call(this, 'onChangeFilters', { filters: Array.from(filters), index: this.props.index });
  };

  render() {
    const { className, criterions = [], first, group } = this.props;

    return (
      <Well className={`ecos-well_full ecos-well_shadow ecos-well_radius_6 ${classNames('ecos-filters-group', className)}`}>
        <div className={'ecos-filters-group__head'}>
          {!first && <FiltersCondition title={CONDITIONS_MAP[group.condition]} />}
          <div className={'ecos-filters-group__tools'}>
            <Label className={'ecos-filters-group__tools_step label_clear label_nowrap label_middle-grey'}>{'Добавить'}</Label>

            <Select
              className={'ecos-filters-group__select ecos-filters-group__tools_step select_narrow'}
              placeholder={t('journals.default')}
              options={criterions}
              getOptionLabel={option => option.text}
              getOptionValue={option => option.attribute}
              onChange={this.addFilter}
            />

            {first && (
              <Select
                className={'ecos-filters-group__select select_narrow'}
                placeholder={t('journals.default')}
                options={CONDITIONS}
                getOptionLabel={option => option.text}
                getOptionValue={option => option.value}
                onChange={this.addGroup}
              />
            )}
          </div>
        </div>

        {this.state.filters.map((filter, idx) => {
          const predicate = filter.predicate;
          return (
            <Filter key={getId()} predicate={predicate} index={idx} onChange={this.changeFilter} onDelete={this.deleteFilter}>
              {idx > 0 && <FiltersCondition cross title={CONDITIONS_MAP[filter.condition]} />}
            </Filter>
          );
        })}
      </Well>
    );
  }
}
