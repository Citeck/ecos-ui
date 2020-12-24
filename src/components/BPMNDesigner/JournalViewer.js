import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import pageTabList from '../../services/pageTabs/PageTabList';
import { getStateId } from '../../helpers/redux';
import { getId } from '../../helpers/util';
import { ErrorBoundary } from '../ErrorBoundary';
import { Journals } from '../Journals';
import { initState } from '../../actions/journals';

const JournalViewer = ({ hidden, isActivePage, activeSection, initStateJournal, ...props }) => {
  const tableCont = useRef(null);
  const [wasActivated, setWasActivated] = useState(false);
  const [stateId, setStateId] = useState('');

  useEffect(() => {
    if (isActivePage && !hidden && !wasActivated) {
      const id = getStateId({ tabId: props.tabId, id: getId() });
      initStateJournal(id);
      setStateId(id);
      setWasActivated(true);
    }
  }, [isActivePage, hidden, wasActivated]);

  return (
    <div ref={tableCont} className={classNames('bpmn-designer-view-journal', { 'd-none': hidden })}>
      {!hidden && wasActivated && (
        <ErrorBoundary>
          <Journals
            isActivePage={isActivePage}
            stateId={stateId}
            displayElements={{ menu: false, header: false }}
            bodyClassName="bpmn-designer-view-journal__body"
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

const mapStateToProps = (store, props) => {
  return {
    models: store.bpmn.models,
    searchText: store.bpmn.searchText,
    isMobile: store.view.isMobile,
    isActivePage: !(props.tabId && !pageTabList.isActiveTab(props.tabId)),
    activeSection: store.bpmn.activeSection || {}
  };
};

const mapDispatchToProps = dispatch => ({
  initStateJournal: stateId => dispatch(initState(stateId))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalViewer);
