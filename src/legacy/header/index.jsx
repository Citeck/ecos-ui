import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

import ShareHeader from './share-header';
import API from '../common/api';
import { isMobileDevice } from '../common/util';
import rootReducer from './reducers';
import { setUserFullName, loadTopMenuData, loadUserMenuPhoto, setIsMobile, setCreateCaseWidgetIsCascade } from './actions';

// TODO include polyfills

const api = new API(window.Alfresco.constants.PROXY_URI);

// let composeEnhancers = compose;
// if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
//     composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
// }

const store = createStore(rootReducer, {}, compose(applyMiddleware(thunk.withExtraArgument(api))));

export const render = (elementId, props) => {
  store.dispatch(setCreateCaseWidgetIsCascade(props.isCascadeCreateMenu === 'true'));
  store.dispatch(setUserFullName(props.userFullname));
  store.dispatch(loadUserMenuPhoto(props.userNodeRef));

  store.dispatch(
    loadTopMenuData(
      props.userName,
      props.userIsAvailable === 'true',
      props.userIsMutable === 'true',
      props.isExternalAuthentication === 'true',
      props.siteMenuItems
    )
  );

  store.dispatch(setIsMobile(isMobileDevice()));

  ReactDOM.render(
    <Provider store={store}>
      <ShareHeader {...props} />
    </Provider>,
    document.getElementById(elementId)
  );
};
