import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import CardDetails from '../../components/CardDetails';
import { fetchCardlets, fetchNodeInfo, setCardMode, setPageArgs } from '../../actions/cardDetails';
import { registerReducers } from '../../reducers/cardDetails';

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

  removeHistoryListener = null;

  componentDidMount() {
    const { setPageArgs, fetchNodeInfo, fetchCardlets, setCardMode } = this.props;
    const searchParams = queryString.parse(this.props.location.search);
    const nodeRef = searchParams.nodeRef;
    if (!nodeRef) {
      return null; // TODO
    }

    setPageArgs({
      nodeRef,
      theme: 'citeckTheme' // TODO get from store
    });

    let nodeBaseInfoPromise = fetchNodeInfo(nodeRef);
    let cardletsPromise = fetchCardlets(nodeRef).then(() => {
      setCardMode(searchParams.mode || DEFAULT_CARD_MODE, registerReducers);
    });

    Promise.all([cardletsPromise, nodeBaseInfoPromise]).then(() => {
      window.__CARD_DETAILS_START = new Date().getTime();

      this.removeHistoryListener = this.props.history.listen((location, action) => {
        const searchParams = queryString.parse(location.search);
        setCardMode(searchParams.mode || DEFAULT_CARD_MODE);
        //
      });

      window.YAHOO.Bubbling.on('metadataRefresh', () => {
        fetchNodeInfo(nodeRef);
      });

      this.setState({ isReady: true });
    });
  }

  componentWillUnmount() {
    if (typeof this.removeHistoryListener === 'function') {
      this.removeHistoryListener();
    }

    // TODO remove all listeners
  }

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
