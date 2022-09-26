import React, { useContext, useEffect } from 'react';
import { Loader, Pagination } from '../../../components/common';
import Body from './Body';
import { PAGINATION_SIZES } from '../../../components/common/form/SelectOrgstruct/constants';
import { SelectOrgstructContext } from '../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import PropTypes from 'prop-types';

import './style.scss';

const OrgstructBody = ({ reloadList }) => {
  const context = useContext(SelectOrgstructContext);
  const { toggleSelectModal, pagination, onChangePage, isLoading, onSelect, selectedRows } = context;

  useEffect(() => {
    toggleSelectModal();
  }, []);

  return (
    <div className={'orgstructure-page__body__container'}>
      <Body reloadList={reloadList} />
      <Pagination
        page={pagination.page}
        maxItems={pagination.maxItems}
        total={pagination.maxCount}
        hasPageSize
        sizes={PAGINATION_SIZES}
        onChange={onChangePage}
      />
      {/* <button onClick={onSelect} /> */}
    </div>
  );
};

OrgstructBody.propTypes = {
  setEmployee: PropTypes.func
};

export default OrgstructBody;
