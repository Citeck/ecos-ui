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

    this.state = { filters: filters };
    this._filters = Array.from(filters);
  }

  addFilter = column => {
    const filters = this._filters;
    const filter = ParserPredicate.createFilter({ att: column.attribute, columns: this.props.columns });

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
    const { className, columns, first, group } = this.props;

    return (
      <Well className={`ecos-well_full ecos-well_shadow ecos-well_radius_6 ${classNames('ecos-filters-group', className)}`}>
        <div className={'ecos-filters-group__head'}>
          {!first && <FiltersCondition title={group.getConditionLabel()} />}
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
                options={getPredicates({ type: 'filterGroup' })}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={this.addGroup}
              />
            )}
          </div>
        </div>

        {this.state.filters.map((filter, idx) => {
          const { predicate, meta } = filter;
          return (
            <Filter key={getId()} meta={meta} predicate={predicate} index={idx} onChange={this.changeFilter} onDelete={this.deleteFilter}>
              {idx > 0 && <FiltersCondition cross title={filter.getConditionLabel()} />}
            </Filter>
          );
        })}
      </Well>
    );
  }
}
