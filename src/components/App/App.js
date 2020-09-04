import React, { Component, lazy, Suspense } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router';
import { NotificationContainer } from 'react-notifications';
import { push } from 'connected-react-router';

import CacheRoute, { CacheSwitch } from '../ReactRouterCache';

import Header from '../Header';
import Notification from '../Notification';
import Menu from '../Sidebar/Sidebar';
import ReduxModal from '../ReduxModal';
import PageTabs from '../PageTabs';
import { ErrorBoundary } from '../ErrorBoundary';

import { initAppSettings } from '../../actions/app';
import { setTab, updateTab } from '../../actions/pageTabs';
import { pagesWithOnlyContent, URL } from '../../constants';
import { MenuTypes } from '../../constants/menu';
import { PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { isMobileAppWebView, t } from '../../helpers/util';
import PageService, { Events } from '../../services/PageService';
import pageTabList from '../../services/pageTabs/PageTabList';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { PopupContainer } from '../common/Popper';
import { replaceHistoryLink } from '../../helpers/urls';

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
const TreePage = lazy(() => import('../../pages/debug/Tree'));

const allowedLinks = [
  URL.DASHBOARD,
  '/share/page/bpmn-designer',
  '/v2/debug/formio-develop',
  '/v2/debug/tree',
  URL.DASHBOARD_SETTINGS,
  URL.BPMN_DESIGNER,
  URL.JOURNAL,
  URL.TIMESHEET,
  URL.TIMESHEET_SUBORDINATES,
  URL.TIMESHEET_FOR_VERIFICATION,
  URL.TIMESHEET_DELEGATED,
  URL.TIMESHEET_IFRAME,
  URL.TIMESHEET_IFRAME_SUBORDINATES,
  URL.TIMESHEET_IFRAME_FOR_VERIFICATION,
  URL.TIMESHEET_IFRAME_DELEGATED
];

class App extends Component {
  _footerRef = null;

  componentDidMount() {
    const { initAppSettings } = this.props;

    initAppSettings();
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
    UserLocalSettingsService.checkDasletsUpdatedDate();
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
        replaceHistoryLink(this.props.history, link);
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
    const footerHeight = get(this._footerRef, 'offsetHeight', 0);
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

    if (footerHeight) {
      height.push(`${footerHeight}px`);
    }

    return { height: height.length ? `calc(100vh - (${height.join(' + ')}))` : '100%' };
  }

  get basePageStyle() {
    const { footer } = this.props;
    const styles = {};

    if (footer && this._footerRef) {
      const alfrescoHeader = document.querySelector('#alf-hd');

      styles.maxHeight = `calc(100vh - ${get(alfrescoHeader, 'offsetHeight', 0)}px - ${get(this._footerRef, 'offsetHeight', 0)}px)`;
    }

    return styles;
  }

  setFooterRef = ref => {
    if (ref) {
      this._footerRef = ref;
    }
  };

  renderMenu() {
    const { menuType } = this.props;

    if (this.isOnlyContent) {
      return null;
    }

    if (menuType === MenuTypes.LEFT) {
      return <Menu />;
    }

    return null;
  }

  renderHeader() {
    if (this.isOnlyContent) {
      if (isMobileAppWebView()) {
        return (
          <div id="alf-hd" className="app-header">
            <Notification />
          </div>
        );
      }

      return null;
    }

    return (
      <div id="alf-hd" className="app-header">
        <Header />
        <Notification />
      </div>
    );
  }

  renderTabs() {
    const { isShowTabs, isMobile, enableCache } = this.props;

    if (enableCache) {
      return (
        <PageTabs
          enableCache
          allowedLinks={allowedLinks}
          homepageLink={URL.DASHBOARD}
          isShow={isShowTabs && !this.isOnlyContent && !isMobile}
          ContentComponent={this.renderCachedRouter}
        />
      );
    }

    return (
      <>
        <PageTabs homepageLink={URL.DASHBOARD} isShow={isShowTabs && !this.isOnlyContent && !isMobile} />
        <div className={PANEL_CLASS_NAME}>{this.renderRouter()}</div>
      </>
    );
  }

  renderReduxModal() {
    if (this.isOnlyContent) {
      return null;
    }

    return <ReduxModal />;
  }

  renderCachedRouter = React.memo(props => {
    const { tab } = props;
    const isCurrent = pageTabList.isActiveTab(tab.id);
    const baseCacheRouteProps = {
      className: PANEL_CLASS_NAME,
      needUseFullPath: true,
      when: 'always',
      isCurrent,
      tabLink: tab.link
    };
    const basePageProps = {
      tabId: tab.id,
      tabLink: tab.link,
      enableCache: true
    };
    const styles = { ...this.wrapperStyle };

    if (!tab.isActive) {
      styles.display = 'none';
    }

    return (
      <div className="ecos-main-content" style={styles}>
        <Suspense fallback={null}>
          <CacheSwitch isCurrent={isCurrent} tabLink={tab.link}>
            <CacheRoute
              {...baseCacheRouteProps}
              exact
              path="/share/page/bpmn-designer"
              render={() => <Redirect to={URL.BPMN_DESIGNER} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.DASHBOARD_SETTINGS}
              render={props => <DashboardSettingsPage {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.DASHBOARD}
              exact
              render={props => <DashboardPage {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_DESIGNER}
              render={props => <BPMNDesignerPage {...props} {...basePageProps} />}
            />
            <CacheRoute {...baseCacheRouteProps} path={URL.JOURNAL} render={props => <JournalsPage {...props} {...basePageProps} />} />
            <CacheRoute
              {...baseCacheRouteProps}
              path={[URL.TIMESHEET, URL.TIMESHEET_IFRAME]}
              exact
              render={props => <MyTimesheetPage {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={[URL.TIMESHEET_SUBORDINATES, URL.TIMESHEET_IFRAME_SUBORDINATES]}
              render={props => <SubordinatesTimesheetPage {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={[URL.TIMESHEET_FOR_VERIFICATION, URL.TIMESHEET_IFRAME_FOR_VERIFICATION]}
              render={props => <VerificationTimesheetPage {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={[URL.TIMESHEET_DELEGATED, URL.TIMESHEET_IFRAME_DELEGATED]}
              render={props => <DelegatedTimesheetsPage {...props} {...basePageProps} />}
            />

            {/*temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <FormIOPage {...props} {...basePageProps} />} />
            <Route path="/v2/debug/tree" render={props => <TreePage {...props} {...basePageProps} />} />

            {/* Redirect not working: https://github.com/CJY0208/react-router-cache-route/issues/72 */}
            <Redirect to={URL.DASHBOARD} />
          </CacheSwitch>
        </Suspense>
      </div>
    );
  });

  renderRouter = () => (
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
          <Route path="/v2/debug/tree" component={TreePage} />

          <Redirect to={URL.DASHBOARD} />
        </Switch>
      </Suspense>
    </div>
  );

  renderFooter() {
    const { footer } = this.props;

    if (isEmpty(footer)) {
      return null;
    }

    return <div ref={this.setFooterRef} className="app-footer" dangerouslySetInnerHTML={{ __html: footer }} />;
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
    const basePageClassNames = classNames('app-content ecos-base-page', { 'ecos-base-page_headless': this.isOnlyContent });

    return (
      <ErrorBoundary title={t('page.error-loading.title')} message={t('page.error-loading.message')}>
        <div className={appClassNames}>
          {this.renderReduxModal()}

          <div className="ecos-sticky-wrapper" id="sticky-wrapper">
            {this.renderHeader()}
            <div className={basePageClassNames} style={this.basePageStyle}>
              {this.renderMenu()}

              <div className="ecos-main-area">{this.renderTabs()}</div>
            </div>

            {this.renderFooter()}
          </div>
          <NotificationContainer />
          <PopupContainer />
        </div>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = state => ({
  enableCache: get(state, ['app', 'enableCache']),
  isInit: get(state, ['app', 'isInit']),
  isInitFailure: get(state, ['app', 'isInitFailure']),
  isMobile: get(state, ['view', 'isMobile']),
  theme: get(state, ['view', 'theme']),
  isAuthenticated: get(state, ['user', 'isAuthenticated']),
  isShowTabs: get(state, ['pageTabs', 'isShow'], false),
  tabs: get(state, 'pageTabs.tabs', []),
  menuType: get(state, ['menu', 'type']),
  footer: get(state, 'app.footer', null)
});

const mapDispatchToProps = dispatch => ({
  initAppSettings: () => dispatch(initAppSettings()),

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
