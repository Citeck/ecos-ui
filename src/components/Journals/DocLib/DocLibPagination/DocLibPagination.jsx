import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Pagination from '../../../common/Pagination/Pagination';
import { PAGINATION_SIZES } from '../../constants';

import './DocLibPagination.scss';

const DocLibPagination = ({ className, isMobile, isReady, total, pagination, hasPageSize, onChange }) => {
  const cssClasses = classNames(
    'ecos-doclib__pagination',
    {
      'ecos-doclib__pagination_mobile': isMobile
    },
    className
  );

  return (
    <Pagination
      className={cssClasses}
      total={total}
      sizes={PAGINATION_SIZES}
      hasPageSize={hasPageSize}
      loading={!isReady}
      onChange={onChange}
      {...pagination}
    />
  );
};

DocLibPagination.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  isMobile: PropTypes.bool,
  isReady: PropTypes.bool,
  total: PropTypes.number,
  pagination: PropTypes.object,
  hasPageSize: PropTypes.bool,
  onChange: PropTypes.func
};

export default DocLibPagination;
