import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import JournalsPage from '../../pages/JournalsPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import Modal from '../Modal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';

const App = ({ isInit, isInitFailure, isAuthenticated, isMobile }) => {
  if (!isInit) {
    // TODO: Loading component
    return null;
  }

  if (isInitFailure) {
    // TODO: Crash app component
    return null;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const appClassNames = classNames('app-container', { mobile: isMobile });

  return (
    <div className={appClassNames}>
      <Modal />
      <SlideMenu />
      <div className="sticky-wrapper">
        <div id="alf-hd">
          <Header />
          <Notification />
        </div>

        <Switch>
          {/*<Route path="/share/page" exact component={DashboardPage} />*/}
          <Route path="/share/page/journals" component={JournalsPage} />
          <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
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
  isMobile: state.view.isMobile,
  isAuthenticated: state.user.isAuthenticated
});

export default withRouter(connect(mapStateToProps)(App));
