import React from 'react';
import { connect } from 'react-redux';

import { getId } from '../../helpers/util';
import { getStateId } from '../../helpers/redux';
import { initState } from '../../actions/journals';
import { Journals, JournalsUrlManager } from '../../components/Journals';
import pageTabList from '../../services/pageTabs/PageTabList';

const getKeys = ({ id, tabId, stateId }) => stateId || getStateId({ tabId, id: id || getId() });

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
      <JournalsUrlManager stateId={this.stateId}>
        <Journals stateId={this.stateId} isActivePage={isActivePage} />
      </JournalsUrlManager>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPage);
