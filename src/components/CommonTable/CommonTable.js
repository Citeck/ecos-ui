import React, { useState } from 'react';

import { Loader, Pagination, Search } from '../common';
import { Well } from '../common/form';
import { Grid } from '../common/grid';
import { HeightCalculation } from '../Journals/JournalsDashletGrid/JournalsDashletGrid';
import { getMaxHeight, getMinHeight } from './utils';

import './style.scss';

const CommonTable = ({
  pagination,
  totalCount,
  isMobile,
  isLoading,

  withoutSearch,

  data,
  columns,

  sortBy,
  onSort,

  filters,
  filterable,
  onFilter,

  handleSearch,
  handleChangePage
}) => {
  const [headerRef, setHeaderRef] = useState();
  const [footerRef, setFooterRef] = useState();

  const setHeaderRefFunc = ref => !!ref && setHeaderRef(ref);

  const setFooterRefFunc = ref => !!ref && setFooterRef(ref);

  return (
    <div className="common-table">
      {!withoutSearch && (
        <div className="common-table__header" ref={setHeaderRefFunc}>
          <Search onSearch={handleSearch} className="common-table__search" />
        </div>
      )}

      <Well className="common-table__well">
        {isLoading && <Loader blur />}
        <HeightCalculation
          loading={isLoading}
          minHeight={getMinHeight(isMobile)}
          maxHeight={getMaxHeight(isMobile, headerRef, footerRef)}
          total={totalCount}
          maxItems={pagination.maxItems}
        >
          <Grid
            data={data}
            columns={columns}
            sortBy={sortBy}
            onSort={onSort}
            filters={filters}
            filterable={filterable}
            onFilter={onFilter}
            minHeight={getMinHeight(isMobile)}
            maxHeight={getMaxHeight(isMobile, headerRef, footerRef)}
            fixedHeader
            autoHeight
          />
        </HeightCalculation>
      </Well>

      <div className="common-table__footer" ref={setFooterRefFunc}>
        <Pagination
          page={pagination.page}
          maxItems={pagination.maxItems}
          total={totalCount}
          loading={isLoading}
          hasPageSize
          onChange={handleChangePage}
        />
      </div>
    </div>
  );
};

export default CommonTable;
