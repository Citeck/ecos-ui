import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { IcoBtn } from '../../common/btns';
import ChevronLeft from '../icons/FillChevronLeft';
import ChevronRight from '../icons/FillChevronRight';

import { PAGINATION_SIZES } from '@/components/journals/Journals/constants';
import { t } from '@/helpers/util';

import './Pagination.scss';

export default class Pagination extends Component {
  static propTypes = {
    page: PropTypes.number,
    maxItems: PropTypes.number,
    total: PropTypes.number,
    sizes: PropTypes.array,
    onChange: PropTypes.func,
    hasPageSize: PropTypes.bool,
    updatedPaginationOfNewJournal: PropTypes.bool,
    isMobile: PropTypes.bool,
    noData: PropTypes.bool,
    noCtrl: PropTypes.bool,
    searching: PropTypes.bool,
    loading: PropTypes.bool
  };

  static defaultProps = {
    sizes: PAGINATION_SIZES
  };

  constructor(props) {
    super(props);

    const { page } = props;
    this.state = { page };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { page: PPage, searching } = this.props;
    const { page: SPage } = this.state;

    if ((!SPage && PPage) || (prevProps.page !== PPage && PPage !== SPage) || (prevProps.searching !== searching && !!searching)) {
      this.setState({ page: PPage });
    }
  }

  get maxPage() {
    const { maxItems, total } = this.props;

    return Math.ceil(total / maxItems);
  }

  get page() {
    const { page } = this.state;
    const maxPage = this.maxPage;

    return page > maxPage ? maxPage : page;
  }

  get max() {
    const { maxItems, total } = this.props;
    const { page } = this.state;
    const max = page * maxItems;

    return max > total ? total : max;
  }

  get min() {
    const { maxItems } = this.props;
    const { page } = this.state;

    return (page - 1) * maxItems + 1;
  }

  handleClickPrev = () => {
    const { maxItems } = this.props;

    this.min > 1 && this.triggerChange(this.page - 1, maxItems);
  };

  handleClickNext = () => {
    const { total, maxItems } = this.props;

    this.max < total && this.triggerChange(this.page + 1, maxItems);
  };

  handleChangeMaxItems = item => {
    const maxItems = item.value;
    const page = Math.ceil(this.min / maxItems);

    this.triggerChange(page, maxItems);
  };

  triggerChange = (page, maxItems) => {
    const { onChange } = this.props;

    this.setState({ page });

    if (typeof onChange === 'function') {
      onChange({
        skipCount: (page - 1) * maxItems,
        maxItems,
        page
      });
    }
  };

  getPageSize = () => {
    const { maxItems, sizes, updatedPaginationOfNewJournal } = this.props;
    let value = sizes.filter(s => s.value === maxItems)[0];

    if (!value && !updatedPaginationOfNewJournal) {
      value = { value: maxItems, label: maxItems };
      sizes.push(value);
    }

    return { value, sizes };
  };

  render() {
    const { total, className, noData, noCtrl } = this.props;

    if (!total) {
      return null;
    }

    const min = this.min;
    const max = this.max;
    const page = this.page;

    return (
      <div className={classNames('ecos-pagination', className)}>
        {!noData && (
          <>
            <span className="ecos-pagination__text ecos-pagination__text-current">
              {min}-{max}
            </span>
            <span className="ecos-pagination__text ecos-pagination__text-from"> {t('pagination.from')} </span>
            <span className="ecos-pagination__text ecos-pagination__text-total large">{total}</span>
          </>
        )}
        {!noCtrl && (
          <>
            <IcoBtn
              className={classNames(
                'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue fitnesse-ecos-pagination__arrow-left',
                'ecos-pagination__arrow_new'
              )}
              disabled={page <= 1}
              onClick={this.handleClickPrev}
            >
              <ChevronLeft width={22} height={22} />
            </IcoBtn>
            <IcoBtn
              className={classNames(
                'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue fitnesse-ecos-pagination__arrow-right',
                'ecos-pagination__arrow_new'
              )}
              disabled={page >= this.maxPage}
              onClick={this.handleClickNext}
            >
              <ChevronRight width={22} height={22} />
            </IcoBtn>
          </>
        )}
      </div>
    );
  }
}
