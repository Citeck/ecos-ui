import React, { Component } from 'react';
import classNames from 'classnames';
import { Well, Label, Select } from '../../common/form';
import { Filter, FiltersCondition } from '../';
import { ParserPredicate } from '../predicates';
import { t, trigger } from '../../../helpers/util';

import './FiltersGroup.scss';

export default class FiltersGroup extends Component {
  onChangeFilterValue = ({ val, index }) => {
    const filter = this.props.group.filters[index];
    filter.predicate.setVal(val);
    trigger.call(this, 'onChangeFilter', { filter, index, groupIndex: this.props.index });
  };

  onChangeFilterPredicate = ({ predicate, index }) => {
    const filter = this.props.group.filters[index];
    filter.predicate.setT(predicate);
    trigger.call(this, 'onChangeFilter', { filter, index, groupIndex: this.props.index });
  };

  deleteFilter = index => {
    trigger.call(this, 'onDeleteFilter', { index, groupIndex: this.props.index });
  };

  addFilter = column => {
    const filter = ParserPredicate.createFilter({ att: column.attribute, columns: this.props.columns, column });
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

  render() {
    const { className, columns, first, group } = this.props;
    const groupConditions = ParserPredicate.getGroupConditions();

    return (
      <Well className={`ecos-well_full ecos-well_shadow ecos-well_radius_6 ${classNames('ecos-filters-group', className)}`}>
        <div className={'ecos-filters-group__head'}>
          {!first && (
            <FiltersCondition onClick={this.changeGroupFilterCondition} condition={group.getCondition()} conditions={groupConditions} />
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
                options={groupConditions}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={this.addGroup}
              />
            )}
          </div>
        </div>

        {group.filters.map((filter, idx) => {
          return (
            <Filter
              key={idx}
              index={idx}
              filter={filter}
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
          );
        })}
      </Well>
    );
  }
}
