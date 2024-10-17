import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import ChevronLeft from '../icons/ChevronLeft';
import ChevronRight from '../icons/ChevronRight';
import { PAGINATION_SIZES } from '../../Journals/constants';
import Select from '../../common/form/Select';
import { IcoBtn } from '../../common/btns';
import { t } from '../../../helpers/util';

import './Pagination.scss';

export default class Pagination extends Component {
  static propTypes = {
    page: PropTypes.number,
    maxItems: PropTypes.number,
    total: PropTypes.number,
    sizes: PropTypes.array,
    onChange: PropTypes.func,
    hasPageSize: PropTypes.bool,
    isViewNewJournal: PropTypes.bool,
    isMobile: PropTypes.bool,
    noData: PropTypes.bool,
    noCtrl: PropTypes.bool,
    loading: PropTypes.bool
  };

  static defaultProps = {
    sizes: PAGINATION_SIZES
  };

  get maxPage() {
    const { maxItems, total } = this.props;

    return Math.ceil(total / maxItems);
  }

  get page() {
    const { page } = this.props;
    const maxPage = this.maxPage;

    return page > maxPage ? maxPage : page;
  }

  get max() {
    const { page, maxItems, total } = this.props;
    const max = page * maxItems;

    return max > total ? total : max;
  }

  get min() {
    const { page, maxItems } = this.props;

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

    if (typeof onChange === 'function') {
      onChange({
        skipCount: (page - 1) * maxItems,
        maxItems,
        page
      });
    }
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
    const { total, className, hasPageSize, noData, noCtrl, isViewNewJournal } = this.props;

    if (!total) {
      return null;
    }

    const { value: pageSizeValue, sizes } = this.getPageSize();
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
            <span className={classNames('ecos-pagination__text ecos-pagination__text-total', { large: isViewNewJournal })}>{total}</span>
          </>
        )}
        {!noCtrl && (
          <>
            <IcoBtn
              icon={!isViewNewJournal ? 'icon-small-left' : null}
              className={classNames(
                'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue fitnesse-ecos-pagination__arrow-right',
                {
                  'ecos-pagination__arrow': !isViewNewJournal,
                  'ecos-pagination__arrow_new': isViewNewJournal
                }
              )}
              disabled={page <= 1}
              onClick={this.handleClickPrev}
            >
              {isViewNewJournal && <ChevronLeft />}
            </IcoBtn>
            <IcoBtn
              icon={!isViewNewJournal ? 'icon-small-right' : null}
              className={classNames(
                'ecos-btn_grey3 ecos-btn_bgr-inherit ecos-btn_hover_t-light-blue fitnesse-ecos-pagination__arrow-right',
                {
                  'ecos-pagination__arrow': !isViewNewJournal,
                  'ecos-pagination__arrow_new': isViewNewJournal
                }
              )}
              disabled={page >= this.maxPage}
              onClick={this.handleClickNext}
            >
              {isViewNewJournal && <ChevronRight />}
            </IcoBtn>
          </>
        )}
        {hasPageSize && !isViewNewJournal && (
          <Select
            className="ecos-pagination__page-size select_narrow select_page-size"
            options={sizes}
            value={pageSizeValue}
            onChange={this.handleChangeMaxItems}
            menuPlacement={'auto'}
            hideSelectedOptions
            isSearchable={false}
          />
        )}
      </div>
    );
  }
}
