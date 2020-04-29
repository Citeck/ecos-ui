import React, { Component, lazy, Suspense } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router';
import { NotificationContainer } from 'react-notifications';
import { push } from 'connected-react-router';

import Header from '../Header';
import Notification from '../Notification';
import Menu from '../Sidebar/Sidebar';
import ReduxModal from '../ReduxModal';
import PageTabs from '../PageTabs';
import { ErrorBoundary } from '../ErrorBoundary';

import { initMenuSettings } from '../../actions/menu';
import { setTab, updateTab } from '../../actions/pageTabs';
import { MENU_TYPE, pagesWithOnlyContent, URL } from '../../constants';
import PageService, { Events } from '../../services/PageService';
import { isMobileAppWebView, t } from '../../helpers/util';
//test pages
import Tree from '../../pages/debug/Tree';

import './App.scss';

const LoginForm = lazy(() => import('../LoginForm'));

const BPMNDesignerPage = lazy(() => import('../../pages/BPMNDesignerPage'));
const DashboardPage = lazy(() => import('../../pages/Dashboard'));
const DashboardSettingsPage = lazy(() => import('../../pages/DashboardSettings'));
const JournalsPage = lazy(() => import('../../pages/JournalsPage'));
const MyTimesheetPage = lazy(() => import('../../pages/Timesheet/MyTimesheetPage'));
const SubordinatesTimesheetPage = lazy(() => import('../../pages/Timesheet/SubordinatesTimesheetPage'));
const VerificationTimesheetPage = lazy(() => import('../../pages/Timesheet/VerificationTimesheetPage'));
const DelegatedTimesheetsPage = lazy(() => import('../../pages/Timesheet/DelegatedTimesheetsPage'));

const FormIOPage = lazy(() => import('../../pages/debug/FormIOPage'));

class App extends Component {
  componentDidMount() {
    const { initMenuSettings } = this.props;

    initMenuSettings();
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
  }

  handleCustomEvent = event => {
    const {
      params: { link = '' }
    } = event;
    const { isShowTabs, isMobile, push, setTab, updateTab } = this.props;

    if (!(isShowTabs && !this.isOnlyContent && !isMobile)) {
      push.call(this, link);
      return;
    }

    const { reopen, closeActiveTab, updates, ...data } = PageService.parseEvent({ event }) || {};

    if (updates) {
      const { link } = updates;

      if (link) {
        this.props.history.replace(link);
      }

      updateTab({ updates });

      return;
    }
    setTab({ data, params: { reopen, closeActiveTab } });
  };

  get isOnlyContent() {
    const url = get(this.props, ['history', 'location', 'pathname'], '/');

    return isMobileAppWebView() || pagesWithOnlyContent.includes(url);
  }

  get wrapperStyle() {
    const tabs = document.querySelector('.page-tab');
    const alfrescoHeader = document.querySelector('#alf-hd');
    let height = [];

    if (tabs) {
      const style = window.getComputedStyle(tabs);
      const outerHeight = tabs.clientHeight + parseInt(style['margin-top'], 10) + parseInt(style['margin-bottom'], 10);

      height.push(`${outerHeight}px`);
    }

    if (alfrescoHeader) {
      const style = window.getComputedStyle(alfrescoHeader);
      const outerHeight = alfrescoHeader.clientHeight + parseInt(style['margin-top'], 10) + parseInt(style['margin-bottom'], 10);

      height.push(`${outerHeight}px`);
    }

    return { height: height.length ? `calc(100vh - (${height.join(' + ')}))` : '100%' };
  }

  renderMenu() {
    const { menuType } = this.props;

    if (this.isOnlyContent) {
      return null;
    }

    if (menuType === MENU_TYPE.LEFT) {
      return <Menu />;
    }

    return null;
  }

  renderHeader() {
    if (this.isOnlyContent) {
      if (isMobileAppWebView()) {
        return (
          <div id="alf-hd">
            <Notification />
          </div>
        );
      }

      return null;
    }

    return (
      <div id="alf-hd">
        <Header />
        <Notification />
      </div>
    );
  }

  renderTabs() {
    const { isShowTabs, isMobile } = this.props;

    return <PageTabs homepageLink={URL.DASHBOARD} isShow={isShowTabs && !this.isOnlyContent && !isMobile} />;
  }

  renderReduxModal() {
    if (this.isOnlyContent) {
      return null;
    }

    return <ReduxModal />;
  }

  render() {
    const { isInit, isInitFailure, isAuthenticated, isMobile, theme } = this.props;

    if (!isInit) {
      // TODO: Loading component
      return null;
    }

    if (isInitFailure) {
      // TODO: Crash app component
      return null;
    }

    if (!isAuthenticated) {
      return (
        <Suspense fallback={null}>
          <LoginForm theme={theme} />
        </Suspense>
      );
    }

    const appClassNames = classNames('app-container', { mobile: isMobile });
    const basePageClassNames = classNames('ecos-base-page', { 'ecos-base-page_headless': this.isOnlyContent });

    return (
      <ErrorBoundary title={t('page.error-loading.title')} message={t('page.error-loading.message')}>
        <div className={appClassNames}>
          {this.renderReduxModal()}

          <div className="ecos-sticky-wrapper" id="sticky-wrapper">
            {this.renderHeader()}
            <div className={basePageClassNames}>
              {this.renderMenu()}

              <div className="ecos-main-area">
                {this.renderTabs()}
                <div className="ecos-main-content" style={this.wrapperStyle}>
                  <Suspense fallback={null}>
                    <Switch>
                      <Route exact path="/share/page/bpmn-designer" render={() => <Redirect to={URL.BPMN_DESIGNER} />} />
                      <Route path={URL.DASHBOARD_SETTINGS} component={DashboardSettingsPage} />
                      <Route path={URL.DASHBOARD} exact component={DashboardPage} />
                      <Route path={URL.BPMN_DESIGNER} component={BPMNDesignerPage} />
                      <Route path={URL.JOURNAL} component={JournalsPage} />
                      <Route path={URL.TIMESHEET} exact component={MyTimesheetPage} />
                      <Route path={URL.TIMESHEET_SUBORDINATES} component={SubordinatesTimesheetPage} />
                      <Route path={URL.TIMESHEET_FOR_VERIFICATION} component={VerificationTimesheetPage} />
                      <Route path={URL.TIMESHEET_DELEGATED} component={DelegatedTimesheetsPage} />
                      <Route path={URL.TIMESHEET_IFRAME} exact component={MyTimesheetPage} />
                      <Route path={URL.TIMESHEET_IFRAME_SUBORDINATES} component={SubordinatesTimesheetPage} />
                      <Route path={URL.TIMESHEET_IFRAME_FOR_VERIFICATION} component={VerificationTimesheetPage} />
                      <Route path={URL.TIMESHEET_IFRAME_DELEGATED} component={DelegatedTimesheetsPage} />

                      {/* temporary routes */}
                      <Route path="/v2/debug/formio-develop" component={FormIOPage} />
                      <Route path="/v2/tree" component={Tree} />

                      <Redirect to={URL.DASHBOARD} />
                    </Switch>
                  </Suspense>
                </div>
              </div>
            </div>
          </div>

          <NotificationContainer />
        </div>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = state => ({
  isInit: get(state, ['app', 'isInit']),
  isInitFailure: get(state, ['app', 'isInitFailure']),
  isMobile: get(state, ['view', 'isMobile']),
  theme: get(state, ['view', 'theme']),
  isAuthenticated: get(state, ['user', 'isAuthenticated']),
  isShowTabs: get(state, ['pageTabs', 'isShow'], false),
  menuType: get(state, ['menu', 'type'])
});

const mapDispatchToProps = dispatch => ({
  initMenuSettings: () => dispatch(initMenuSettings()),
  setTab: params => dispatch(setTab(params)),
  updateTab: params => dispatch(updateTab(params)),
  push: url => dispatch(push(url))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
