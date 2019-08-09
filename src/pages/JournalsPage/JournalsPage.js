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
  state = {
    stateId: null
  };

  getActiveTabId = () => {
    return (this.props.tabs.filter(t => t.isActive)[0] || {}).id;
  };

  componentDidUpdate = () => {
    const { pageTabsIsShow, initState } = this.props;
    const { stateId } = this.state;

    if (pageTabsIsShow) {
      const activeTabId = this.getActiveTabId();

      if (activeTabId !== stateId) {
        initState(activeTabId);
        this.setState({ stateId: activeTabId });
      }
    } else if (!stateId) {
      const id = getId();
      initState(id);
      this.setState({ stateId: id });
    }
  };

  render() {
    const { pageTabsIsShow } = this.props;
    const { stateId } = this.state;

    return (
      <Fragment>
        {(pageTabsIsShow && stateId === this.getActiveTabId()) || (!pageTabsIsShow && stateId) ? (
          <JournalsUrlManager stateId={stateId}>
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
