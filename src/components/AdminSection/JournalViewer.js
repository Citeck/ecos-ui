import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import pageTabList from '../../services/pageTabs/PageTabList';
import { getStateId } from '../../helpers/redux';
import { getId } from '../../helpers/util';
import { initState, setSearchText } from '../../actions/journals';
import { ErrorBoundary } from '../ErrorBoundary';
import { Journals } from '../Journals';
import { getSearchParams } from '../../helpers/urls';

const JournalViewer = React.memo(
  ({ hidden, isActivePage, initStateJournal, upStateId, stateId, setJournalSearch, activeSection, ...props }) => {
    const tableCont = useRef(null);
    const [initialized, setInitialized] = useState(false);
    const [prefixStateId, setPrefixStateId] = useState('');
    const [searchParams, setSearchParams] = useState(getSearchParams());

    useEffect(() => {
      if (isActivePage && !hidden && !initialized) {
        const id = getStateId({ tabId: props.tabId, id: getId() });

        setPrefixStateId(id);
        setInitialized(true);
      }
    }, [isActivePage, hidden, initialized]);

    useEffect(() => {
      const params = getSearchParams();
      const { journalId } = params;
      const _journalStateId = journalId ? prefixStateId + '-[' + journalId + ']' : undefined;

      if (isActivePage && !hidden && initialized && journalId && _journalStateId !== stateId) {
        initStateJournal(_journalStateId);
        upStateId(_journalStateId);
      }
    });

    useEffect(() => {
      const params = getSearchParams();

      !isEqual(params, searchParams) && setSearchParams(params);

      if (stateId && params.journalId !== searchParams.journalId) {
        setJournalSearch({ stateId, text: '' });
      }
    }, [activeSection]);

    return (
      <div ref={tableCont} className={classNames('ecos-admin-section__journal', { 'd-none': hidden })}>
        {!hidden && initialized && stateId && (
          <ErrorBoundary>
            <Journals
              withForceUpdate
              isActivePage={isActivePage && !hidden}
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
  }
);

const mapStateToProps = (store, props) => ({
  isActivePage: pageTabList.isActiveTab(props.tabId),
  activeSection: store.adminSection.activeSection
});

const mapDispatchToProps = dispatch => ({
  initStateJournal: stateId => dispatch(initState(stateId)),
  setJournalSearch: data => dispatch(setSearchText(data))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalViewer);
