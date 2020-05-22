import React from 'react';
import { connect } from 'react-redux';

import { Journals, JournalsUrlManager } from '../../components/Journals';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { getId, t } from '../../helpers/util';
import { initState } from '../../actions/journals';

const Labels = {
  ERROR_BOUNDARY_TITLE: 'journal.page.error-boundary.title',
  ERROR_BOUNDARY_MSG: 'journal.page.error-boundary.msg'
};

const mapDispatchToProps = dispatch => ({
  initState: stateId => dispatch(initState(stateId))
});

const mapStateToProps = state => {
  return {
    tabs: state.pageTabs.tabs,
    pageTabsIsShow: state.pageTabs.isShow
  };
};

class JournalsPage extends React.Component {
  constructor(props) {
    super(props);

    const stateId = this.getStateId();

    this.state = { stateId };
    this.props.initState(stateId);
  }

  getStateId = () => {
    return this.getActiveTabId() || (this.state || {}).stateId || getId();
  };

  getActiveTabId = () => {
    return (this.props.tabs.filter(t => t.isActive)[0] || {}).id;
  };

  componentDidUpdate = () => {
    const stateId = this.getStateId();

    if (stateId !== this.state.stateId) {
      this.props.initState(stateId);
      this.setState({ stateId });
    }
  };

  render() {
    const stateId = this.state.stateId;

    return (
      <ErrorBoundary title={t(Labels.ERROR_BOUNDARY_TITLE)} message={t(Labels.ERROR_BOUNDARY_MSG)}>
        {stateId === this.getStateId() ? (
          <JournalsUrlManager stateId={stateId}>
            <Journals stateId={stateId} />
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
