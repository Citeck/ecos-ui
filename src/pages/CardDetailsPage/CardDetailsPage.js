import React from 'react';
import { connect } from 'react-redux';
import CardDetails from '../../components/CardDetails';
import { fetchCardlets, fetchNodeInfo, setCardMode, setPageArgs } from '../../actions/cardDetails';
import { registerReducers } from '../../reducers/cardDetails';
import { getURLParameterByName } from '../../helpers/citeck';

// TODO use injectAsyncReducer

const mapDispatchToProps = dispatch => ({
  dispatch
});

class CardDetailsPage extends React.Component {
  state = {
    isReady: false
  };

  componentDidMount() {
    const { dispatch } = this.props;

    // const alfescoUrl = window.location.protocol + '//' + window.location.host + '/share/proxy/alfresco/';
    // const userName = 'admin';
    // const nodeBaseInfo = { modified: '2018-11-07T18:42:48.610+03:00', permissions: { Read: true, Write: true }, pendingUpdate: false };

    const pageArgs = {
      nodeRef: 'workspace://SpacesStore/9a1666e7-6f1f-48ae-85cc-c7e5dfc33307',
      pageid: 'card-details',
      theme: 'citeckTheme',
      aikauVersion: '1.0.63'
    };

    const DEFAULT_CARD_MODE = 'default';

    function getCurrentCardMode() {
      return getURLParameterByName('mode') || DEFAULT_CARD_MODE;
    }

    dispatch(setPageArgs(pageArgs));

    let nodeBaseInfoPromise = dispatch(fetchNodeInfo(pageArgs.nodeRef));
    let cardletsPromise = dispatch(fetchCardlets(pageArgs.nodeRef)).then(() => {
      dispatch(setCardMode(getCurrentCardMode(), registerReducers));
    });

    Promise.all([cardletsPromise, nodeBaseInfoPromise]).then(() => {
      window.__CARD_DETAILS_START = new Date().getTime();

      window.onpopstate = function() {
        dispatch(setCardMode(getCurrentCardMode(), registerReducers));
      };

      window.YAHOO.Bubbling.on('metadataRefresh', () => {
        dispatch(fetchNodeInfo(pageArgs.nodeRef));
      });

      // ReactDOM.render(React.createElement(CardDetailsRoot, props), document.getElementById(elementId));
      this.setState({ isReady: true });
    });
  }

  componentWillUnmount() {}

  render() {
    if (!this.state.isReady) {
      return null;
    }

    return <CardDetails {...this.props} />;
  }
}

export default connect(
  null,
  mapDispatchToProps
)(CardDetailsPage);
