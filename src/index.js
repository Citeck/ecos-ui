import 'react-app-polyfill/ie9';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './components/App';
import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import configureStore from './store';
import { validateUserRequest, checkThunk } from './actions/user';

const store = configureStore(
  {},
  {
    // api
  }
);

store.dispatch(validateUserRequest());
store.dispatch(checkThunk());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
