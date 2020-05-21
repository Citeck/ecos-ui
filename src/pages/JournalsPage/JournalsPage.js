import React from 'react';
import { connect } from 'react-redux';

import { getId, t } from '../../helpers/util';
import { getStateId } from '../../helpers/redux';
import { initState } from '../../actions/journals';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Journals, JournalsUrlManager } from '../../components/Journals';
import pageTabList from '../../services/pageTabs/PageTabList';

const getKeys = ({ id, tabId, stateId }) => stateId || getStateId({ tabId, id: id || getId() });

const Labels = {
  ERROR_BOUNDARY_TITLE: 'journal.page.error-boundary.title',
  ERROR_BOUNDARY_MSG: 'journal.page.error-boundary.msg'
};

const mapDispatchToProps = dispatch => ({
  initState: stateId => dispatch(initState(stateId))
});

const mapStateToProps = (state, props) => ({
  pageTabsIsShow: state.pageTabs.isShow,
  isActivePage: !(props.tabId && !pageTabList.isActiveTab(props.tabId))
});

class JournalsPage extends React.Component {
  constructor(props) {
    super(props);

    this.stateId = getKeys(props);
  }

  componentDidMount() {
    this.props.initState(this.stateId);
  }

  render() {
    const { isActivePage } = this.props;

    return (
      <ErrorBoundary title={t(Labels.ERROR_BOUNDARY_TITLE)} message={t(Labels.ERROR_BOUNDARY_MSG)}>
        {stateId === this.getStateId() ? (
          <JournalsUrlManager stateId={this.stateId}>
            <Journals stateId={this.stateId} isActivePage={isActivePage} />
          </JournalsUrlManager>
        ) : null}
      </ErrorBoundary>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPage);
