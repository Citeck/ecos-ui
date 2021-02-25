import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import pageTabList from '../../services/pageTabs/PageTabList';
import { getStateId } from '../../helpers/redux';
import { getId } from '../../helpers/util';
import { initState } from '../../actions/journals';
import { ErrorBoundary } from '../ErrorBoundary';
import { Journals } from '../Journals';

const JournalViewer = ({ hidden, isActivePage, initStateJournal, upStateId, ...props }) => {
  const tableCont = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [stateId, setStateId] = useState('');

  useEffect(() => {
    if (isActivePage && !hidden && !initialized) {
      const id = getStateId({ tabId: props.tabId, id: getId() });

      initStateJournal(id);
      setStateId(id);
      upStateId(id);
      setInitialized(true);
    }
  }, [isActivePage, hidden, initialized]);

  return (
    <div ref={tableCont} className={classNames('ecos-admin-section__journal', { 'd-none': hidden })}>
      {!hidden && initialized && (
        <ErrorBoundary>
          <Journals
            doNotChangeUrl
            isActivePage={isActivePage}
            stateId={stateId}
            displayElements={{ menu: false, header: false }}
            additionalHeights={props.additionalHeights}
            className="ecos-admin-section__journal"
            bodyClassName="ecos-admin-section__journal-body"
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

const mapStateToProps = (store, props) => ({
  isActivePage: pageTabList.isActiveTab(props.tabId)
});

const mapDispatchToProps = dispatch => ({
  initStateJournal: stateId => dispatch(initState(stateId))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalViewer);
