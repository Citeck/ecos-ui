import React, { Component } from 'react';
import classNames from 'classnames';
import Select from '../../common/form/Select';
import { IcoBtn } from '../../common/btns';
import { t, trigger } from '../../../helpers/util';

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
    this.min > 1 && this.triggerChange(this.props.page - 1);
  };

  next = () => {
    const { total, page } = this.props;
    this.max < total && this.triggerChange(page + 1);
  };

  triggerChange = page => {
    const { onChange, maxItems } = this.props;
    if (typeof onChange === 'function') {
      onChange({
        skipCount: (page - 1) * maxItems,
        maxItems: maxItems,
        page: page
      });
    }
  };

  onChangeMaxItems = item => {
    trigger.call(this, 'onChangeMaxItems', item);
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
      <div className={classNames('pagination', className)}>
        <span className={'pagination__text'}>
          {this.min}-{this.max}
        </span>
        <span className={'pagination__text'}> {t('pagination.from')} </span>
        <span className={'pagination__text pagination__step'}>{total}</span>

        <IcoBtn
          icon={'icon-left'}
          className={'pagination__btn-step ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
          onClick={this.prev}
        />
        <IcoBtn
          icon={'icon-right'}
          className={`ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue pagination__text ${
            hasPageSize ? 'pagination__step' : ''
          }`}
          onClick={this.next}
        />

        {hasPageSize ? (
          <Select
            className={'select_narrow pagination__page-size select_page-size'}
            options={sizes}
            value={pageSizeValue}
            onChange={this.onChangeMaxItems}
            menuPlacement={'auto'}
          />
        ) : null}
      </div>
    );
  }
}
