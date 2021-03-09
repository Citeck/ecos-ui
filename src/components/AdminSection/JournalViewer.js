import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import pageTabList from '../../services/pageTabs/PageTabList';
import { getStateId } from '../../helpers/redux';
import { getId } from '../../helpers/util';
import { initState } from '../../actions/journals';
import { ErrorBoundary } from '../ErrorBoundary';
import { Journals } from '../Journals';
import { getSearchParams } from '../../helpers/urls';

const JournalViewer = ({ hidden, isActivePage, initStateJournal, upStateId, ...props }) => {
  const tableCont = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [prefixStateId, setPrefixStateId] = useState('');
  const [journalStateId, setJournalStateId] = useState('');

  useEffect(() => {
    if (isActivePage && !hidden && !initialized) {
      const id = getStateId({ tabId: props.tabId, id: getId() });

      setPrefixStateId(id);
      setInitialized(true);
    }
  }, [isActivePage, hidden, initialized]);

  useEffect(() => {
    const journalId = getSearchParams().journalId;
    const _journalStateId = journalId ? prefixStateId + '-[' + journalId + ']' : undefined;

    if (isActivePage && !hidden && initialized && journalId && _journalStateId !== journalStateId) {
      setJournalStateId(_journalStateId);
      initStateJournal(_journalStateId);
      upStateId(_journalStateId);
    }
  });

  return (
    <div ref={tableCont} className={classNames('ecos-admin-section__journal', { 'd-none': hidden })}>
      {!hidden && initialized && journalStateId && (
        <ErrorBoundary>
          <Journals
            isActivePage={isActivePage}
            stateId={journalStateId}
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
