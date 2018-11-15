import React from 'react';
import { connect } from 'react-redux';
import { fetchCardletData } from '../../../actions/cardDetails';

class Cardlet extends React.Component {
  componentDidMount() {
    this.props.fetchData(this.props);
  }

  render() {
    const { modeLoaded, cardletState, controlClass, mobileOrder } = this.props;
    let loaded = modeLoaded && cardletState.data && controlClass;

    if (!loaded) {
      return <div />;
    }

    return (
      <div className="cardlet" data-available-in-mobile={mobileOrder > -1} data-position-index-in-mobile={mobileOrder}>
        <this.props.controlClass {...cardletState} />
      </div>
    );
  }
}

const evalExpRegexp = /\${((?:(?!\${)[\S\s])+?)}/g;

const mapStateToProps = (state, ownProps) => {
  let nodeRef = state.cardDetails.pageArgs.nodeRef;
  let theme = state.cardDetails.pageArgs.theme;

  let rawProps = ownProps.control.props || {};
  let controlProps = {};

  for (let prop in rawProps) {
    if (!rawProps.hasOwnProperty(prop)) {
      continue;
    }

    controlProps[prop] = rawProps[prop].replace(evalExpRegexp, (match, expr) => {
      if (expr === 'nodeRef') {
        return nodeRef;
      } else if (expr === 'theme') {
        return theme;
      }
      try {
        // eslint-disable-next-line
        return eval(expr);
      } catch (e) {
        console.error(e);
        return expr;
      }
    });
  }
  let modesLoadingState = state.cardDetails.modesLoadingState || {};
  let cardletState = (state.cardDetails.cardletsState || {})[ownProps.id] || {};
  let controlClass = ((state.cardDetails.controls || {})[ownProps.control.url] || {}).controlClass;

  return {
    ...ownProps,
    modeLoaded: ownProps.cardMode === 'all' || !!modesLoadingState[ownProps.cardMode],
    cardletState,
    controlProps,
    controlClass,
    nodeRef,
    nodeInfo: state.cardDetails.nodes[nodeRef]
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchData: props => dispatch(fetchCardletData(props))
  };
};

const CardletConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(Cardlet);

export default CardletConnected;

export const renderCardletList = cardlets => (cardlets || []).map((data, idx) => <CardletConnected key={idx} {...data} />);
