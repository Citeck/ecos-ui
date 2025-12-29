import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import head from 'lodash/head';

import { CommonTable } from '../../../../components/CommonTable';
import { getTableColumns } from './constants';
import {
  getJournalTabInfo,
  setJournalTabInfoFilters,
  setJournalTabInfoPage,
  setJournalTabInfoSortBy
} from '../../../../actions/processAdmin';
import { selectProcessTabInfo } from '../../../../selectors/processAdmin';

const VersionTable = ({ isMobile, processId, dataInfo, getDataInfo, setPage, setSortBy, setFilters, tabId }) => {
  const [journalId, setJournalId] = useState(null);

  useEffect(
    () => {
      isFunction(getDataInfo) && getDataInfo(processId, tabId);
    },
    [processId, tabId]
  );

  useEffect(
    () => {
      if (!dataInfo || !dataInfo.data) {
        return;
      }

      const firstData = head(dataInfo.data);
      const [, journalId] = (get(firstData, 'documentJournalId') || '').split('@');

      if (journalId) {
        setJournalId(journalId);
      }
    },
    [dataInfo]
  );

  const handleChangePage = ({ page, maxItems }) => {
    const newPage = {
      ...dataInfo.page,
      page,
      maxItems,
      skipCount: (page - 1) * maxItems
    };

    isFunction(setPage) && setPage(processId, newPage, tabId);
    isFunction(getDataInfo) && getDataInfo(processId, tabId);
  };

  const handleSort = e => {
    const sortBy = {
      attribute: e.column.attribute,
      ascending: !e.ascending
    };

    isFunction(setSortBy) && setSortBy(processId, sortBy, tabId);
    isFunction(getDataInfo) && getDataInfo(processId, tabId);
  };

  const handleFilter = filters => {
    const preparedFilters = filters.map(f => {
      if (f.att === 'document') {
        return {
          ...f,
          val: head(f.val)
        };
      }

      if (f.att === 'message') {
        return {
          ...f,
          t: 'like'
        };
      }

      return f;
    });

    isFunction(setFilters) && setFilters(processId, preparedFilters, tabId);
    isFunction(getDataInfo) && getDataInfo(processId, tabId);
  };

  const data = get(dataInfo, 'data', []).map(instance => ({
    ...instance,
    incidentCount: get(instance, 'incidents.length'),
    reload: getDataInfo
  }));

  return (
    <CommonTable
      totalCount={dataInfo.totalCount}
      isMobile={isMobile}
      isLoading={!dataInfo || !dataInfo.data || dataInfo.loading}
      data={data}
      columns={getTableColumns(tabId, { tabId, documentJournalId: journalId })}
      pagination={dataInfo.page || {}}
      handleChangePage={handleChangePage}
      sortBy={dataInfo.sortBy || []}
      onSort={handleSort}
      filters={dataInfo.filters || []}
      onFilter={handleFilter}
      withoutSearch
      filterable
    />
  );
};

const mapStateToProps = (store, props) => {
  return {
    isMobile: store.view.isMobile,
    dataInfo: selectProcessTabInfo(store, props)
  };
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (processId, tabId) => dispatch(getJournalTabInfo({ tabId, processId })),
  setPage: (processId, page, tabId) => dispatch(setJournalTabInfoPage({ tabId, processId, page })),
  setSortBy: (processId, sortBy, tabId) => dispatch(setJournalTabInfoSortBy({ tabId, processId, sortBy })),
  setFilters: (processId, filters, tabId) => dispatch(setJournalTabInfoFilters({ tabId, processId, filters }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VersionTable);
