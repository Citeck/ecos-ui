import React, { Component } from 'react';
import classNames from 'classnames';
import { Well, Label, Select } from '../../common/form/index';
import { Filter, FiltersCondition } from '../';
import { t, trigger, getId } from '../../../helpers/util';

import './FiltersGroup.scss';

const CONDITIONS = [{ text: 'И', value: 'and' }, { text: 'ИЛИ', value: 'or' }];

const CONDITIONS_MAP = {
  or: 'или',
  and: 'и'
};

export default class FiltersGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filters: this.getFilters(props.group.predicate)
    };
  }

  getFilters = predicates => {
    const { val, t } = predicates;
    let filters = [];

    for (let i = 0, length = val.length; i < length; i++) {
      const current = val[i];

      if (current.att) {
        filters.push({
          condition: t,
          predicate: current
        });
        continue;
      }

      if (current.val) {
        filters = [...filters, ...this.getFilters(current)];
      }
    }

    return filters;
  };

  addFilter = criterion => {
    const filters = Array.from(this.state.filters);
    filters.push({ ...criterion });
    this.setState({ filters });
  };

  onChangeCondition = condition => {
    trigger.call(this, 'onChangeCondition', condition);
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
                onChange={this.onChangeCondition}
              />
            )}
          </div>
        </div>

        {this.state.filters.map((filter, idx) => {
          const predicate = filter.predicate;
          return (
            <Filter key={getId()} label={predicate.att}>
              {idx > 0 && <FiltersCondition cross title={CONDITIONS_MAP[filter.condition]} />}
            </Filter>
          );
        })}
      </Well>
    );
  }
}
