import React from 'react';
import { connect } from 'react-redux';
import CardDetails from '../card-details/components';
import { fetchCardlets, fetchNodeInfo, setCardMode, setPageArgs } from '../../actions/card-details';
import { registerReducers } from '../../reducers/card-details';

const mapDispatchToProps = dispatch => ({
  dispatch
});

class CardDetailsPage extends React.Component {
  state = {
    isReady: false
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const props = this.props;

    const DEFAULT_CARD_MODE = 'default';

    function getCurrentCardMode() {
      // return CiteckUtils.getURLParameterByName("mode") || DEFAULT_CARD_MODE;
      return DEFAULT_CARD_MODE;
    }

    dispatch(setPageArgs(props.pageArgs));

    let nodeBaseInfoPromise = dispatch(fetchNodeInfo(props.pageArgs.nodeRef));
    let cardletsPromise = dispatch(fetchCardlets(props.pageArgs.nodeRef)).then(() => {
      dispatch(setCardMode(getCurrentCardMode(), registerReducers));
    });

    Promise.all([cardletsPromise, nodeBaseInfoPromise]).then(() => {
      window.__CARD_DETAILS_START = new Date().getTime();

      window.onpopstate = function() {
        dispatch(setCardMode(getCurrentCardMode(), registerReducers));
      };

      window.YAHOO.Bubbling.on('metadataRefresh', () => {
        dispatch(fetchNodeInfo(props.pageArgs.nodeRef));
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

    return (
      // <div />
      <CardDetails {...this.props} />
    );
  }
}

export default connect(
  null,
  mapDispatchToProps
)(CardDetailsPage);
