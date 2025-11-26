import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { getProcesses, setFilter, setPage } from '../../../actions/bpmnAdmin';
import { CommonTable } from '../../../components/CommonTable';
import { PROCESSED_TABLE_COLUMNS } from './constants';

const ProcessesTable = ({ page: pagination, processes, totalCount, loading, isMobile, setPage, setFilter, getProcesses }) => {
  useEffect(() => {
    isFunction(getProcesses) && getProcesses();
  }, []);

  const handleChangePage = ({ page, maxItems }) => {
    const newPage = {
      ...pagination,
      page,
      maxItems,
      skipCount: (page - 1) * maxItems
    };

    isFunction(setPage) && setPage(newPage);
    isFunction(getProcesses) && getProcesses();
  };

  const handleSearch = searchText => {
    const filter = searchText
      ? {
          att: 'key',
          t: 'like',
          val: searchText
        }
      : undefined;

    isFunction(setFilter) && setFilter(filter);
    isFunction(getProcesses) && getProcesses(filter);
  };

  const data = processes.map(process => ({
    ...process,
    incidentCount: get(process, 'overallStatistics.incidentCount'),
    instancesCount: get(process, 'overallStatistics.instancesCount')
  }));

  return (
    <CommonTable
      pagination={pagination}
      totalCount={totalCount}
      isMobile={isMobile}
      isLoading={loading}
      data={data}
      columns={PROCESSED_TABLE_COLUMNS}
      handleSearch={handleSearch}
      handleChangePage={handleChangePage}
    />
  );
};

const mapStateToProps = store => ({
  isMobile: store.view.isMobile,

  loading: store.bpmnAdmin.loading,
  filter: store.bpmnAdmin.filter,
  processes: store.bpmnAdmin.processes,
  totalCount: store.bpmnAdmin.totalCount,
  page: store.bpmnAdmin.page
});

const mapDispatchToProps = dispatch => ({
  getProcesses: () => dispatch(getProcesses()),
  setPage: page => dispatch(setPage(page)),
  setFilter: filter => dispatch(setFilter(filter))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProcessesTable);
