import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Pagination } from '../../../components/common';
import { PAGINATION_SIZES } from '../../../components/common/form/SelectOrgstruct/constants';
import { useSelectOrgstructContext } from '../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import Body from './Body';

import './style.scss';

const OrgstructBody = ({ reloadList, tabId, toggleToFirstTab }) => {
  const context = useSelectOrgstructContext();

  const { toggleSelectModal, pagination, onChangePage } = context;

  useEffect(() => {
    toggleSelectModal();
  }, []);

  return (
    <div className={'orgstructure-page__body__container'}>
      <Body reloadList={reloadList} tabId={tabId} toggleToFirstTab={toggleToFirstTab} />
      <Pagination
        page={pagination.page}
        maxItems={pagination.maxItems}
        total={pagination.maxCount}
        hasPageSize
        sizes={PAGINATION_SIZES}
        onChange={onChangePage}
      />
    </div>
  );
};

OrgstructBody.propTypes = {
  setEmployee: PropTypes.func
};

export default OrgstructBody;
