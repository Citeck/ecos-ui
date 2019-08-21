import React, { Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import { Journals } from '../../components/Journals';
import { JournalsUrlManager } from '../../components/Journals';
import { getId } from '../../helpers/util';
import { initState } from '../../actions/journals';

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
      <Fragment>
        {stateId === this.getStateId() ? (
          <JournalsUrlManager stateId={stateId} withLoader>
            <Journals stateId={stateId} />
          </JournalsUrlManager>
        ) : null}
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPage);
