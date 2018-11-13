import React from 'react';
import ReactDOM from 'react-dom';
// import {utils as CiteckUtils} from 'js/citeck/modules/utils/citeck';
// import 'citeck/mobile/mobile';
// import 'lib/underscore'
import CardDetails from './components';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
// import thunk from 'js/citeck/lib/redux-thunk';
// import 'js/citeck/modules/utils/yui-panel-lazy-patch';

const YAHOO = window.YAHOO;

import { rootReducer, registerReducers } from './reducers';

import { setCardMode, setPageArgs, fetchCardlets, fetchNodeInfo } from './actions';

// require("xstyle!./card-details.css");

const DEFAULT_CARD_MODE = 'default';

const store = createStore(rootReducer, applyMiddleware(thunk));

window.__REDUX_STORE__ = store;

function getCurrentCardMode() {
  return CiteckUtils.getURLParameterByName('mode') || DEFAULT_CARD_MODE;
}

function CardDetailsRoot(props) {
  return (
    <Provider store={store}>
      <CardDetails {...props} />
    </Provider>
  );
}

export function renderPage(elementId, props) {
  store.dispatch(setPageArgs(props.pageArgs));

  let nodeBaseInfoPromise = store.dispatch(fetchNodeInfo(props.pageArgs.nodeRef));
  let cardletsPromise = store.dispatch(fetchCardlets(props.pageArgs.nodeRef)).then(() => {
    store.dispatch(setCardMode(getCurrentCardMode(), registerReducers));
  });

  Promise.all([cardletsPromise, nodeBaseInfoPromise]).then(() => {
    window.__CARD_DETAILS_START = new Date().getTime();

    window.onpopstate = function() {
      store.dispatch(setCardMode(getCurrentCardMode(), registerReducers));
    };

    YAHOO.Bubbling.on('metadataRefresh', () => {
      store.dispatch(fetchNodeInfo(props.pageArgs.nodeRef));
    });

    ReactDOM.render(React.createElement(CardDetailsRoot, props), document.getElementById(elementId));
  });
}
