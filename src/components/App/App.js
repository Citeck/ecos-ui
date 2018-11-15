import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';

import CardDetailsPage from '../../pages/CardDetailsPage';
import Header from '../Header';
import SlideMenu from '../SlideMenu';
import Modal from '../Modal';
import Footer from '../Footer';

const App = ({ isInit, isInitFailure, isMobile }) => {
  if (!isInit) {
    // TODO Loading component
    return null;
  }

  if (isInitFailure) {
    // TODO Crash app component
    return null;
  }

  const appClassNames = classNames('app-container', { mobile: isMobile });

  return (
    <div className={appClassNames}>
      <Modal />
      <SlideMenu />
      <div className="sticky-wrapper">
        <Header />

        <Switch>
          {/*<Route path="/share/page" exact component={DashboardPage} />*/}
          <Route path="/share/page/(.*/)?card-details" component={CardDetailsPage} />
          {/*<Route component={NotFoundPage} />*/}
        </Switch>

        <div className="sticky-push" />
      </div>
      <Footer key="card-details-footer" className="sticky-footer" theme="citeckTheme" />
    </div>
  );
};

const mapStateToProps = state => ({
  isInit: state.app.isInit,
  isInitFailure: state.app.isInitFailure,
  isMobile: state.view.isMobile
});

export default connect(mapStateToProps)(App);
