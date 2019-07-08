import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import classNames from 'classnames';
import get from 'lodash/get';

import BPMNDesignerPage from '../../pages/BPMNDesignerPage';
import CardDetailsPage from '../../pages/CardDetailsPage';
import JournalsPage from '../../pages/JournalsPage';
import DocPreviewPage from '../../pages/debug/DocPreview';
import EcosFormPage from '../../pages/debug/EcosFormPage';
import FormIOPage from '../../pages/debug/FormIOPage';
import JournalsDashboardPage from '../../pages/debug/JournalsDashboardPage';
import PropertiesPage from '../../pages/debug/Properties/PropertiesPage';
import TasksDashletPage from '../../pages/debug/Tasks/TasksDashletPage';
import DashboardSettingsPage from '../../pages/DashboardSettings';
import DashboardPage from '../../pages/Dashboard';

import Header from '../Header';
import Notification from '../Notification';
import SlideMenu from '../SlideMenu';
import ReduxModal from '../ReduxModal';
import Footer from '../Footer';
import LoginForm from '../LoginForm';
import PageTabs from '../PageTabs';
import Comments from './../Comments';

import { getShowTabsStatus, getTabs, setTabs } from '../../actions/pageTabs';
import { initMenuSettings } from '../../actions/menu';
import { MENU_TYPE, URL } from '../../constants';

import './App.scss';

class App extends Component {
  componentDidMount() {
    const { getShowTabsStatus, getTabs, initMenuSettings } = this.props;

    getShowTabsStatus();
    getTabs();
    initMenuSettings();
  }

  renderMenu() {
    const { menuType } = this.props;

    switch (menuType) {
      case MENU_TYPE.LEFT:
        return <SlideMenu />;
      default:
        return null;
    }
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

        <div className="ecos-sticky-wrapper" id="sticky-wrapper">
          <div id="alf-hd">
            <Header />
            <Notification />
          </div>

          <PageTabs homepageLink={URL.HOME} isShow={isShow} tabs={tabs} saveTabs={setTabs} />

          {this.renderMenu()}

          <Switch>
            {/*<Route path="/share/page" exact component={DashboardPage} />*/}

            <Route path="/share/page/(.*/)?card-details-new" component={CardDetailsPage} />
            {/* TODO change routes prefixes from /share/page to /v2 */}
            <Route path="/share/page/ui/journals" component={JournalsPage} />
            <Route path="/share/page/journalsDashboard" component={JournalsDashboardPage} />
            <Route path="/share/page/bpmn-designer" component={BPMNDesignerPage} />

            <Route path={URL.DASHBOARD_SETTINGS} component={DashboardSettingsPage} />
            <Route path={URL.DASHBOARD} exact component={DashboardPage} />

            <Route path="/v2/debug/formio-develop" component={FormIOPage} />
            <Route path="/v2/debug/ecos-form-example" component={EcosFormPage} />
            <Route path="/v2/debug/doc-preview" component={DocPreviewPage} />
            <Route path="/v2/debug/properties" component={PropertiesPage} />
            <Route path="/v2/debug/comments" component={this.renderComments} />
            <Route path="/v2/debug/tasks" exact component={TasksDashletPage} />
            {/*<Route component={NotFoundPage} />*/}
          </Switch>

          <div className="sticky-push" />
        </div>
        <Footer key="card-details-footer" theme={theme} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isInit: get(state, ['app', 'isInit']),
  isInitFailure: get(state, ['app', 'isInitFailure']),
  isMobile: get(state, ['view', 'isMobile']),
  theme: get(state, ['view', 'theme']),
  isAuthenticated: get(state, ['user', 'isAuthenticated']),
  isShow: get(state, ['pageTabs', 'isShow']),
  tabs: get(state, ['pageTabs', 'tabs']),
  menuType: get(state, ['menu', 'type'])
});

const mapDispatchToProps = dispatch => ({
  getShowTabsStatus: () => dispatch(getShowTabsStatus()),
  getTabs: () => dispatch(getTabs()),
  setTabs: tabs => dispatch(setTabs(tabs)),
  initMenuSettings: () => dispatch(initMenuSettings())
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
