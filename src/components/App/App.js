import React, { Component, Suspense } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router';
import { NotificationContainer } from 'react-notifications';
import { replace } from 'connected-react-router';
import * as queryString from 'query-string';

import CacheRoute, { CacheSwitch } from '../ReactRouterCache';

import Header from '../Header';
import Notification from '../Notification';
import Menu from '../Sidebar/Sidebar';
import ReduxModal from '../ReduxModal';
import Page from '../../pages';
import PageTabs from '../PageTabs';
import { ErrorBoundary } from '../ErrorBoundary';

import { initAppSettings } from '../../actions/app';
import { setTab, updateTab } from '../../actions/pageTabs';
import { Pages, pagesWithOnlyContent, URL } from '../../constants';
import { BASE_LEFT_MENU_ID, MenuTypes } from '../../constants/menu';
import { PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { isMobileAppWebView, t } from '../../helpers/util';
import PageService, { Events } from '../../services/PageService';
import pageTabList from '../../services/pageTabs/PageTabList';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { PopupContainer } from '../common/Popper';
import { MenuSettingsController } from '../MenuSettings';
import { decodeLink, pushHistoryLink, replaceHistoryLink } from '../../helpers/urls';
import { selectActiveThemeImage } from '../../selectors/view';
import { DefaultImages } from '../../constants/theme';

import './App.scss';

const allowedLinks = [
  URL.DASHBOARD,
  '/share/page/bpmn-designer',
  URL.FORM_COMPONENTS,
  '/v2/debug/tree',
  '/v2/debug/cmmn',
  URL.DASHBOARD_SETTINGS,
  URL.BPMN_DESIGNER,
  URL.JOURNAL,
  URL.DEV_TOOLS,
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
      params: { link = '', rerenderPage, replaceHistory }
    } = event;
    const { isShowTabs, isMobile, replace, setTab, updateTab } = this.props;

    if (!(isShowTabs && !this.isOnlyContent && !isMobile) || (rerenderPage && replaceHistory)) {
      const { url, query } = queryString.parseUrl(link);

      pushHistoryLink(window, {
        pathname: url,
        search: decodeLink(queryString.stringify(query))
      });

      replace(link);

      return;
    }

    const { reopen, closeActiveTab, updates, pushHistory, ...data } = PageService.parseEvent({ event }) || {};

    if (updates) {
      const { link } = updates;

      if (link) {
        if (pushHistory) {
          const { url, query } = queryString.parseUrl(link);

          pushHistoryLink(window, {
            pathname: url,
            search: decodeLink(queryString.stringify(query))
          });
        } else {
          replaceHistoryLink(window, link);
        }
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
      return <Menu id={BASE_LEFT_MENU_ID} />;
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
      enableCache: true,
      footer: this.renderFooter()
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
              render={props => <Page pageKey={Pages.DASHBOARD_SETTINGS} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.DASHBOARD}
              exact
              render={props => <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_DESIGNER}
              render={props => <Page pageKey={Pages.BPMN} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.JOURNAL}
              render={props => <Page pageKey={Pages.JOURNAL} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.DEV_TOOLS}
              render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET}
              exact
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME}
              exact
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} footer={null} />}
            />

            {/*temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} {...basePageProps} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} {...basePageProps} />} />
            <Route path="/v2/debug/cmmn" render={props => <Page pageKey={Pages.DEBUG_CMMN} {...props} {...basePageProps} />} />

            {/* Redirect not working: https://github.com/CJY0208/react-router-cache-route/issues/72 */}
            <Redirect to={URL.DASHBOARD} />
          </CacheSwitch>
        </Suspense>
      </div>
    );
  });

  renderRouter = () => {
    const basePageProps = {
      footer: this.renderFooter()
    };

    return (
      <div className="ecos-main-content" style={this.wrapperStyle}>
        <Suspense fallback={null}>
          <Switch>
            <Route exact path="/share/page/bpmn-designer" render={() => <Redirect to={URL.BPMN_DESIGNER} />} />
            <Route
              path={URL.DASHBOARD_SETTINGS}
              render={props => <Page pageKey={Pages.DASHBOARD_SETTINGS} {...props} {...basePageProps} />}
            />
            <Route path={URL.DASHBOARD} exact render={props => <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />} />
            <Route path={URL.BPMN_DESIGNER} render={props => <Page pageKey={Pages.BPMN} {...props} {...basePageProps} />} />
            <Route path={URL.JOURNAL} render={props => <Page pageKey={Pages.JOURNAL} {...props} {...basePageProps} />} />
            <Route path={URL.DEV_TOOLS} render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} {...basePageProps} />} />
            <Route path={URL.TIMESHEET} exact render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} />} />
            <Route
              path={URL.TIMESHEET_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} />}
            />
            <Route
              path={URL.TIMESHEET_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} />}
            />
            <Route
              path={URL.TIMESHEET_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME}
              exact
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} footer={null} />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} footer={null} />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} footer={null} />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} footer={null} />}
            />

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} {...basePageProps} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} {...basePageProps} />} />

            <Redirect to={URL.DASHBOARD} />
          </Switch>
        </Suspense>
      </div>
    );
  };

  renderFooter() {
    const { footer } = this.props;

    if (isEmpty(footer)) {
      return null;
    }

    return <div ref={this.setFooterRef} className="app-footer" dangerouslySetInnerHTML={{ __html: footer }} />;
  }

  render() {
    const { isInit, isInitFailure, isAuthenticated, isMobile, theme, loginLogo } = this.props;

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
          <Page pageKey={Pages.LOGIN} theme={theme} logo={loginLogo} />
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
            <div className={basePageClassNames}>
              {this.renderMenu()}

              <div className="ecos-main-area">{this.renderTabs()}</div>
            </div>
          </div>
          <NotificationContainer />
          <PopupContainer />
          <MenuSettingsController />
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
  footer: get(state, 'app.footer', null),
  loginLogo: selectActiveThemeImage(state, DefaultImages.LOGIN_LOGO)
});

const mapDispatchToProps = dispatch => ({
  initAppSettings: () => dispatch(initAppSettings()),

  setTab: params => dispatch(setTab(params)),
  updateTab: params => dispatch(updateTab(params)),
  replace: url => dispatch(replace(url))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
