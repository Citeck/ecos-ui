import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import CardDetails from '../../components/CardDetails';
import { fetchCardlets, fetchNodeInfo, setCardMode, setPageArgs } from '../../actions/cardDetails';
import { registerReducers } from '../../reducers/cardDetails';

// TODO use injectAsyncReducer

const mapDispatchToProps = dispatch => ({
  setPageArgs: pageArgs => dispatch(setPageArgs(pageArgs)),
  fetchNodeInfo: nodeRef => dispatch(fetchNodeInfo(nodeRef)),
  fetchCardlets: nodeRef => dispatch(fetchCardlets(nodeRef)),
  setCardMode: (cardMode, registerReducers) => dispatch(setCardMode(cardMode, registerReducers))
});

const DEFAULT_CARD_MODE = 'default';

class CardDetailsPage extends React.Component {
  state = {
    isReady: false
  };

  componentDidMount() {
    const { setPageArgs, fetchNodeInfo, fetchCardlets, setCardMode } = this.props;
    const searchParams = queryString.parse(this.props.location.search);
    const nodeRef = searchParams.nodeRef;
    if (!nodeRef) {
      return null; // TODO
    }

    function getCurrentCardMode() {
      return searchParams.mode || DEFAULT_CARD_MODE;
    }

    setPageArgs({
      nodeRef,
      theme: 'citeckTheme' // TODO get from store
    });

    let nodeBaseInfoPromise = fetchNodeInfo(nodeRef);
    let cardletsPromise = fetchCardlets(nodeRef).then(() => {
      setCardMode(getCurrentCardMode(), registerReducers);
    });

    Promise.all([cardletsPromise, nodeBaseInfoPromise]).then(() => {
      window.__CARD_DETAILS_START = new Date().getTime();

      window.onpopstate = function() {
        setCardMode(getCurrentCardMode(), registerReducers);
      };

      window.YAHOO.Bubbling.on('metadataRefresh', () => {
        fetchNodeInfo(nodeRef);
      });

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
