import React, { useContext } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { getJournalTabInfo, setJournalTabInfoFilters } from '../../../../../actions/instanceAdmin';
import { selectInstanceTabInfo } from '../../../../../selectors/instanceAdmin';
import { PREDICATE_EQ } from '../../../../../components/Records/predicates/predicates';
import { InstanceContext } from '../../../InstanceContext';
import { JOURNALS_TABS_BLOCK_CLASS } from '../../../constants';

const Column = ({ row, tabId, dataInfo, instanceId, getDataInfo, setFilters }) => {
  const context = useContext(InstanceContext);

  const filter = {
    t: PREDICATE_EQ,
    att: 'scope',
    val: get(row, 'scope.id')
  };

  const handleClick = () => {
    const existedFilters = dataInfo.filters || [];
    const attFilterIndex = existedFilters.find(filter => filter.attribute === 'scope' || filter.attribute === 'scope{?disp}');

    if (attFilterIndex !== -1) {
      existedFilters.splice(attFilterIndex, 1, filter);
    } else {
      existedFilters.push(filter);
    }

    isFunction(setFilters) && setFilters(instanceId, [...existedFilters], tabId);
    isFunction(getDataInfo) && getDataInfo(instanceId, tabId);

    const activityId = get(row, 'scope.activityId');
    context.setActivityElement(activityId);
  };

  return (
    <span className={`${JOURNALS_TABS_BLOCK_CLASS}__clickable-field`} onClick={handleClick}>
      {get(row, 'scope.disp')}
    </span>
  );
};

const mapStateToProps = (store, props) => {
  return {
    dataInfo: selectInstanceTabInfo(store, props)
  };
};

const mapDispatchToProps = dispatch => ({
  setFilters: (instanceId, filters, tabId) => dispatch(setJournalTabInfoFilters({ tabId, instanceId, filters })),
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export const ScopeColumn = connect(
  mapStateToProps,
  mapDispatchToProps
)(Column);
