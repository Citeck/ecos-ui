import React from 'react';
import { connect } from 'react-redux';

import { initState } from '../../actions/journals';
import { getStateId } from '../../helpers/redux';
import { getId, t } from '../../helpers/util';
import pageTabList from '../../services/pageTabs/PageTabList';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Journals } from '../../components/Journals';

import './style.scss';

const getKeys = ({ id, tabId, stateId }) => stateId || getStateId({ tabId, id: id || getId() });

const Labels = {
  ERROR_BOUNDARY_TITLE: 'journal.page.error-boundary.title',
  ERROR_BOUNDARY_MSG: 'journal.page.error-boundary.msg'
};

const mapDispatchToProps = dispatch => ({
  initState: stateId => dispatch(initState({ stateId }))
});

const mapStateToProps = (store, props) => ({
  pageTabsIsShow: store.pageTabs.isShow,
  isActivePage: !(props.tabId && !pageTabList.isActiveTab(props.tabId))
});

class JournalsPage extends React.Component {
  constructor(props) {
    super(props);

    this.stateId = getKeys(props);
    this.props.initState(this.stateId);
  }

  render() {
    const { footerRef, isActivePage, tabId } = this.props;

    return (
      <div className="ecos-journal-page">
        <ErrorBoundary title={t(Labels.ERROR_BOUNDARY_TITLE)} message={t(Labels.ERROR_BOUNDARY_MSG)}>
          <Journals tabId={tabId} stateId={this.stateId} isActivePage={isActivePage} footerRef={footerRef} />
        </ErrorBoundary>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPage);
