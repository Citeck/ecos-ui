import React, { Component } from 'react';
import classNames from 'classnames';
import { PAGINATION_SIZES } from '../../../components/Journals/constants';
import Select from '../../common/form/Select';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';

import './Pagination.scss';

export default class Pagination extends Component {
  constructor(props) {
    super(props);
    this.min = 0;
    this.max = 0;
  }

  calculate = (page, maxItems, total) => {
    this.max = this.getMax(page, maxItems, total);
    this.min = this.getMin(page, maxItems);
  };

  getMax = (page, maxItems, total) => {
    const max = page * maxItems;
    return max > total ? total : max;
  };

  getMin = (page, maxItems) => {
    return (page - 1) * maxItems + 1;
  };

  prev = () => {
    const { page, maxItems } = this.props;
    this.min > 1 && this.triggerChange(page - 1, maxItems);
  };

  next = () => {
    const { total, page, maxItems } = this.props;
    this.max < total && this.triggerChange(page + 1, maxItems);
  };

  triggerChange = (page, maxItems) => {
    const { onChange } = this.props;

    if (typeof onChange === 'function') {
      onChange({
        skipCount: (page - 1) * maxItems,
        maxItems,
        page
      });
    }
  };

  onChangeMaxItems = item => {
    const maxItems = item.value;
    const page = Math.ceil(this.min / maxItems);

    this.triggerChange(page, maxItems);
  };

  getPageSize = () => {
    const { maxItems, sizes } = this.props;
    let value = sizes.filter(s => s.value === maxItems)[0];

    if (!value) {
      value = { value: maxItems, label: maxItems };
      sizes.push(value);
    }

    return { value, sizes };
  };

  render() {
    const { maxItems, total, page, className, hasPageSize } = this.props;

    this.calculate(page, maxItems, total);

    const { value: pageSizeValue, sizes } = this.getPageSize();

    if (!total) {
      return null;
    }

    return (
      <div className={classNames('ecos-pagination', className)}>
        <span className={'ecos-pagination__text ecos-pagination__text-current'}>
          {this.min}-{this.max}
        </span>
        <span className={'ecos-pagination__text ecos-pagination__text-from'}> {t('pagination.from')} </span>
        <span className={'ecos-pagination__text ecos-pagination__text-total'}>{total}</span>

        <IcoBtn
          icon={'icon-left'}
          className={'ecos-pagination__arrow ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue'}
          onClick={this.prev}
        />
        <IcoBtn
          icon={'icon-right'}
          className={`ecos-pagination__arrow ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue`}
          onClick={this.next}
        />

        {hasPageSize ? (
          <Select
            className="ecos-pagination__page-size select_narrow select_page-size"
            options={sizes}
            value={pageSizeValue}
            onChange={this.onChangeMaxItems}
            menuPlacement={'auto'}
            hideSelectedOptions
            isSearchable={false}
          />
        ) : null}
      </div>
    );
  }
}

Pagination.defaultProps = {
  sizes: PAGINATION_SIZES
};
