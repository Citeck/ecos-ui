import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { PAGINATION_SIZES } from '../../../components/Journals/constants';
import Select from '../../common/form/Select';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';

import './Pagination.scss';

export default class Pagination extends Component {
  constructor(props) {
    super(props);

    this.state = {
      min: 0,
      max: 0,
      page: props.page
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { page: _page, maxItems, total } = this.props;

    if (prevProps.maxItems !== maxItems || prevProps.total !== total || prevProps.page !== _page) {
      const page = _page > this.maxPage ? this.maxPage : _page;
      const max = this.getMax(page, maxItems, total);
      const min = this.getMin(page, maxItems);

      this.setState({ max, min, page });
    }
  }

  get maxPage() {
    const { maxItems, total } = this.props;

    return Math.ceil(total / maxItems);
  }

  getMax = (page, maxItems, total) => {
    const max = page * maxItems;
    return max > total ? total : max;
  };

  getMin = (page, maxItems) => {
    return (page - 1) * maxItems + 1;
  };

  prev = () => {
    const { maxItems } = this.props;
    const { min, page } = this.state;

    min > 1 && this.triggerChange(page - 1, maxItems);
  };

  next = () => {
    const { total, maxItems } = this.props;
    const { max, page } = this.state;

    max < total && this.triggerChange(page + 1, maxItems);
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
    const page = Math.ceil(this.state.min / maxItems);

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
    const { total, className, hasPageSize, loading } = this.props;
    const { page, min, max } = this.state;
    const { value: pageSizeValue, sizes } = this.getPageSize();

    if (!total) {
      return null;
    }

    return (
      <div className={classNames('ecos-pagination', { 'ecos-pagination_loading': loading }, className)}>
        <span className="ecos-pagination__text ecos-pagination__text-current">
          {min}-{max}
        </span>
        <span className="ecos-pagination__text ecos-pagination__text-from"> {t('pagination.from')} </span>
        <span className="ecos-pagination__text ecos-pagination__text-total">{total}</span>

        <IcoBtn
          icon={'icon-left'}
          className="ecos-pagination__arrow ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue"
          disabled={page <= 1}
          onClick={this.prev}
        />
        <IcoBtn
          icon={'icon-right'}
          className="ecos-pagination__arrow ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue"
          disabled={page >= this.maxPage}
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

Pagination.propTypes = {
  page: PropTypes.number,
  maxItems: PropTypes.number,
  total: PropTypes.number,
  sizes: PropTypes.array,
  onChange: PropTypes.func,
  hasPageSize: PropTypes.bool,
  loading: PropTypes.bool
};

Pagination.defaultProps = {
  sizes: PAGINATION_SIZES
};
