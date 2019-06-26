import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';
import moment from 'moment';
import uuid from 'uuidv4';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import JournalsPage from '../../pages/JournalsPage';
import DocPreviewPage from '../../pages/debug/DocPreview';
import EcosFormPage from '../../pages/debug/EcosFormPage';
import FormIOPage from '../../pages/debug/FormIOPage';
import JournalsDashboardPage from '../../pages/debug/JournalsDashboardPage';

import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';
import PageTabs from '../PageTabs';
import Comments from './../Comments';

import { getShowTabsStatus, getTabs, setTabs } from '../../actions/pageTabs';
import { URL } from '../../constants';

import './App.scss';

class App extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    const { getShowTabsStatus, getTabs } = this.props;

    getShowTabsStatus();
    getTabs();
  }

  renderComments = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        margin: '50px 0'
      }}
    >
      <div style={{ width: '500px' }}>
        <Comments id="workspace://SpacesStore/291bd833-6e27-4865-8416-25d584404c3e" />
      </div>
      <div style={{ width: '30%' }}>
        <Comments id="workspace://SpacesStore/ee6eb89a-b15c-453c-adb5-ee55ec42aec9" />
      </div>
    </div>
  );

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

          <PageTabs homepageLink={URL.HOME} isShow={isShow} tabs={tabs} saveTabs={setTabs}>
            <Switch>
              {/*<Route path="/share/page" exact component={DashboardPage} />*/}
              <Route path="/formio-develop" component={FormIOPage} />
              <Route path="/ecos-form-example" component={EcosFormPage} />
              <Route path="/doc-preview" component={DocPreviewPage} />

              <Route path="/share/page/ui/journals" component={JournalsPage} />
              <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />
              <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />
              <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />

              <Route path="/comments" component={this.renderComments} />
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
