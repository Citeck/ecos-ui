import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import CardDetails from '../../components/CardDetails';
import { fetchCardlets, fetchNodeInfo, setCardMode, setPageArgs, fetchStartMessage } from '../../actions/cardDetails';
import { registerReducers } from '../../reducers/cardDetails';

const mapStateToProps = state => ({
  theme: state.view.theme
});

const mapDispatchToProps = dispatch => ({
  setPageArgs: pageArgs => dispatch(setPageArgs(pageArgs)),
  fetchNodeInfo: nodeRef => dispatch(fetchNodeInfo(nodeRef)),
  fetchCardlets: nodeRef => dispatch(fetchCardlets(nodeRef)),
  fetchStartMessage: nodeRef => dispatch(fetchStartMessage(nodeRef)),
  setCardMode: (cardMode, registerReducers) => dispatch(setCardMode(cardMode, registerReducers))
});

const DEFAULT_CARD_MODE = 'default';
const SHOW_MESSAGE_PARAM_NAME = 'showStartMsg';

class CardDetailsPage extends React.Component {
  state = {
    isReady: false
  };

  removeHistoryListener = null;

  componentDidMount() {
    const { setPageArgs, fetchNodeInfo, fetchCardlets, setCardMode, fetchStartMessage, theme } = this.props;
    const searchParams = queryString.parse(this.props.location.search);
    const nodeRef = searchParams.nodeRef;
    if (!nodeRef) {
      return null; // TODO
    }

    setPageArgs({
      nodeRef,
      theme
    });

    let promises = [];

    promises.push(fetchNodeInfo(nodeRef));

    promises.push(
      fetchCardlets(nodeRef).then(() => {
        setCardMode(searchParams.mode || DEFAULT_CARD_MODE, registerReducers);
      })
    );

    if (searchParams[SHOW_MESSAGE_PARAM_NAME] === 'true') {
      promises.push(fetchStartMessage(nodeRef));
    }

    Promise.all(promises).then(() => {
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
  mapStateToProps,
  mapDispatchToProps
)(CardDetailsPage);
