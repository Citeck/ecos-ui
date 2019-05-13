import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import JournalsPage from '../../pages/JournalsPage';
import JournalsDashboardPage from '../../pages/JournalsDashboardPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import FormIOPage from '../../pages/FormIOPage';
import EcosFormPage from '../../pages/EcosFormPage';
import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';
import PageTabs from '../PageTabs';

import { getShowTabsStatus, getTabs, setTabs } from '../../actions/pageTabs';

import './App.scss';

class App extends Component {
  componentDidMount() {
    const { getShowTabsStatus, getTabs } = this.props;

    getShowTabsStatus();
    getTabs();
  }

  render() {
    const { isInit, isInitFailure, isAuthenticated, isMobile, theme, isShow, tabs, setTabs } = this.props;

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
        <ReduxModal />
        <SlideMenu />
        <div className="ecos-sticky-wrapper" id="sticky-wrapper">
          <div id="alf-hd">
            <Header />
            <Notification />
          </div>

          <PageTabs homepageLink={'/'} isShow={isShow} tabs={tabs} saveTabs={setTabs}>
            <Switch>
              {/*<Route path="/share/page" exact component={DashboardPage} />*/}
              <Route path="/formio-develop" component={FormIOPage} />
              <Route path="/ecos-form-example" component={EcosFormPage} />

              <Route path="/share/page/journals" component={JournalsPage} />
              <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />
              <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
              <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />
              {/*<Route component={NotFoundPage} />*/}
            </Switch>
          </PageTabs>

          <div className="sticky-push" />
        </div>
        <Footer key="card-details-footer" theme={theme} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isInit: state.app.isInit,
  isInitFailure: state.app.isInitFailure,
  isMobile: state.view.isMobile,
  theme: state.view.theme,
  isAuthenticated: state.user.isAuthenticated,
  isShow: state.pageTabs.isShow,
  tabs: state.pageTabs.tabs
});

const mapDispatchToProps = dispatch => ({
  getShowTabsStatus: () => dispatch(getShowTabsStatus()),
  getTabs: () => dispatch(getTabs()),
  setTabs: tabs => dispatch(setTabs(tabs))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
