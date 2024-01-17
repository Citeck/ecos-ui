import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { selectInstanceMetaInfo, selectInstanceTabInfo } from '../../../selectors/instanceAdmin';
import {
  getJournalTabInfo,
  setJournalTabInfoPage,
  setJournalTabInfoSortBy,
  setJournalTabInfoFilters
} from '../../../actions/instanceAdmin';
import { CommonTable } from '../../../components/CommonTable';
import { InfoText } from '../../../components/common';

import { getTableColumns } from './columns';
import { INSTANCE_TABS_TYPES } from '../../../constants/instanceAdmin';
import { t } from '../../../helpers/util';
import Labels from './Labels';

const Journal = ({ isMobile, instanceId, tabId, metaInfo, dataInfo, getDataInfo, setPage, setSortBy, setFilters }) => {
  useEffect(
    () => {
      if (dataInfo && dataInfo.data) {
        return;
      }

      if ((!metaInfo || !metaInfo.definitionRefId) && tabId !== INSTANCE_TABS_TYPES.VARIABLES) {
        return;
      }

      isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
    },
    [instanceId, tabId, metaInfo]
  );

  const handleChangePage = ({ page, maxItems }) => {
    const newPage = {
      ...dataInfo.page,
      page,
      maxItems,
      skipCount: (page - 1) * maxItems
    };

    isFunction(setPage) && setPage(instanceId, newPage, tabId);
    isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
  };

  const handleSort = e => {
    const sortBy = {
      attribute: e.column.attribute,
      ascending: !e.ascending
    };

    isFunction(setSortBy) && setSortBy(instanceId, sortBy, tabId);
    isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
  };

  const handleFilter = filters => {
    isFunction(setFilters) && setFilters(instanceId, filters, tabId);
    isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
  };

  if ((!metaInfo || !metaInfo.definitionRefId) && tabId !== INSTANCE_TABS_TYPES.VARIABLES) {
    return <InfoText text={t(Labels.NOT_DEFINED)} />;
  }

  const data = get(dataInfo, 'data', []).map(row => ({
    ...row,
    incidentCount: get(row, 'incidents.length')
  }));

  return (
    <CommonTable
      totalCount={dataInfo.totalCount}
      isMobile={isMobile}
      isLoading={!dataInfo || !dataInfo.data || dataInfo.loading}
      data={data}
      columns={getTableColumns(tabId, { instanceId, tabId })}
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
    dataInfo: selectInstanceTabInfo(store, props),
    metaInfo: selectInstanceMetaInfo(store, props)
  };
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId })),
  setPage: (instanceId, page, tabId) => dispatch(setJournalTabInfoPage({ tabId, instanceId, page })),
  setSortBy: (instanceId, sortBy, tabId) => dispatch(setJournalTabInfoSortBy({ tabId, instanceId, sortBy })),
  setFilters: (instanceId, filters, tabId) => dispatch(setJournalTabInfoFilters({ tabId, instanceId, filters }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
