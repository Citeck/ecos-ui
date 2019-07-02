import React, { Component } from 'react';
import classNames from 'classnames';
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

  render() {
    const { maxItems, total, page, className } = this.props;

    this.calculate(page, maxItems, total);

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
          className={'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
          onClick={this.next}
        />
      </div>
    );
  }
}
