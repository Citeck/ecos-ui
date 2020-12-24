import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import pageTabList from '../../services/pageTabs/PageTabList';
import { getStateId } from '../../helpers/redux';
import { getId } from '../../helpers/util';
import { ErrorBoundary } from '../ErrorBoundary';

const JournalViewer = ({ hidden, stateId, isActivePage, activeSection }) => {
  const tableCont = useRef(null);
  const [topHeight, setTopHeight] = useState(500);

  useEffect(() => {
    if (tableCont.current) {
      const params = tableCont.current.getBoundingClientRect();
      setTopHeight(params.y);
    }
  }, [tableCont]);

  return (
    <div ref={tableCont} className={classNames('bpmn-designer-view-journal bpmn-common-container_white', { 'd-none': hidden })}>
      <ErrorBoundary>
        <div>KU</div>
      </ErrorBoundary>
    </div>
  );
};

const mapStateToProps = (store, props) => ({
  models: store.bpmn.models,
  searchText: store.bpmn.searchText,
  isMobile: store.view.isMobile,
  isActivePage: !(props.tabId && !pageTabList.isActiveTab(props.tabId)),
  stateId: getStateId({ tabId: props.tabId, id: props.id || getId() }),
  activeSection: store.bpmn.activeSection || {}
});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalViewer);
