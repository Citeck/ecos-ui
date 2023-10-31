import React, { Component, Suspense } from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router';
import { NotificationContainer } from 'react-notifications';
import { replace } from 'connected-react-router';

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
import { Pages, pagesWithOnlyContent, RELOCATED_URL, URL } from '../../constants';
import { BASE_LEFT_MENU_ID, MenuTypes } from '../../constants/menu';
import { PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { isMobileAppWebView, t } from '../../helpers/util';
import pageTabList from '../../services/pageTabs/PageTabList';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { PopupContainer } from '../common/Popper';
import { MenuSettingsController } from '../MenuSettings';
import EcosFormModal from '../EcosForm/EcosFormModal';

import './App.scss';

const allowedLinks = [
  URL.DASHBOARD,
  URL.BPMN_DESIGNER,
  URL.ADMIN_PAGE,
  URL.JOURNAL,
  URL.DEV_TOOLS,
  URL.BPMN_EDITOR,
  URL.CMMN_EDITOR,
  URL.DMN_EDITOR,

  URL.TIMESHEET,
  URL.TIMESHEET_SUBORDINATES,
  URL.TIMESHEET_FOR_VERIFICATION,
  URL.TIMESHEET_DELEGATED,
  URL.TIMESHEET_IFRAME,
  URL.TIMESHEET_IFRAME_SUBORDINATES,
  URL.TIMESHEET_IFRAME_FOR_VERIFICATION,
  URL.TIMESHEET_IFRAME_DELEGATED,

  URL.ORGSTRUCTURE,

  URL.BPMN_ADMIN_PROCESS,
  URL.BPMN_ADMIN_INSTANCE,
  URL.BPMN_MIGRATION
];

if (process.env.NODE_ENV === 'development') {
  allowedLinks.push(URL.FORM_COMPONENTS, '/v2/debug/cmmn', '/v2/debug/tree');
}

class App extends Component {
  componentDidMount() {
    this.props.initAppSettings();
    UserLocalSettingsService.checkDashletsUpdatedDate();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.isAuthenticated && !this.props.isAuthenticated) {
      EcosFormModal.countOpenedModals <= 0 && window.location.reload();
    }
  }

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

  renderRedirectOldRoots = () => {
    return Object.keys(RELOCATED_URL).map(key => <Redirect key={key} from={key} to={RELOCATED_URL[key]} />);
  };

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
              path={URL.DASHBOARD}
              exact
              render={props => <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="admin"
              path={URL.ADMIN_PAGE}
              render={props => <Page pageKey={Pages.BPMN} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.JOURNAL}
              render={props => <Page pageKey={Pages.JOURNAL} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="dev-tools"
              path={URL.DEV_TOOLS}
              render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_EDITOR}
              render={props => <Page pageKey={Pages.BPMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_ADMIN_PROCESS}
              render={props => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_ADMIN_INSTANCE}
              render={props => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.BPMN_MIGRATION}
              render={props => <Page pageKey={Pages.BPMN_MIGRATION} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.CMMN_EDITOR}
              render={props => <Page pageKey={Pages.CMMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.DMN_EDITOR}
              render={props => <Page pageKey={Pages.DMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            {/* --- TIMESHEETs start */}
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
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={URL.ORGSTRUCTURE}
              render={props => <Page pageKey={Pages.ORGSTRUCTURE} {...props} {...basePageProps} withoutFooter />}
            />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} {...basePageProps} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} {...basePageProps} />} />

            {this.renderRedirectOldRoots()}
            <Redirect to={URL.DASHBOARD} />
          </CacheSwitch>
        </Suspense>
      </div>
    );
  });

  renderRouter = () => {
    return (
      <div className="ecos-main-content" style={this.wrapperStyle}>
        <Suspense fallback={null}>
          <Switch>
            <Route path={URL.DASHBOARD} exact render={props => <Page pageKey={Pages.DASHBOARD} {...props} />} />
            <Route path={URL.ADMIN_PAGE} render={props => <Page pageKey={Pages.BPMN} {...props} />} />
            <Route path={URL.JOURNAL} render={props => <Page pageKey={Pages.JOURNAL} {...props} />} />
            <Route path={URL.DEV_TOOLS} render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} />} />
            <Route path={URL.BPMN_EDITOR} render={props => <Page pageKey={Pages.BPMN_EDITOR} {...props} />} />
            <Route path={URL.BPMN_ADMIN_PROCESS} render={props => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} />} />
            <Route path={URL.BPMN_ADMIN_INSTANCE} render={props => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} />} />
            <Route path={URL.BPMN_MIGRATION} render={props => <Page pageKey={Pages.BPMN_MIGRATION} {...props} />} />
            <Route path={URL.CMMN_EDITOR} render={props => <Page pageKey={Pages.CMMN_EDITOR} {...props} />} />
            <Route path={URL.DMN_EDITOR} render={props => <Page pageKey={Pages.DMN_EDITOR} {...props} />} />
            {/* --- TIMESHEETs start */}
            <Route path={URL.TIMESHEET} exact render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} />} />
            <Route path={URL.TIMESHEET_SUBORDINATES} render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} />} />
            <Route path={URL.TIMESHEET_FOR_VERIFICATION} render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} />} />
            <Route path={URL.TIMESHEET_DELEGATED} render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} />} />
            <Route path={URL.TIMESHEET_IFRAME} exact render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} withoutFooter />} />
            <Route
              path={URL.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} withoutFooter />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} withoutFooter />}
            />
            <Route
              path={URL.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} withoutFooter />}
            />
            <Route path={URL.ORGSTRUCTURE} render={props => <Page pageKey={Pages.ORGSTRUCTURE} {...props} withoutFooter />} />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} />} />
            {this.renderRedirectOldRoots()}
            <Redirect to={URL.DASHBOARD} />
          </Switch>
        </Suspense>
      </div>
    );
  };

  render() {
    const { isInit, isInitFailure, isMobile } = this.props;

    if (!isInit) {
      // TODO: Loading component
      return null;
    }

    if (isInitFailure) {
      // TODO: Crash app component
      return null;
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
  isShowTabs: get(state, ['pageTabs', 'isShow'], false),
  tabs: get(state, 'pageTabs.tabs', []),
  menuType: get(state, ['menu', 'type']),
  isAuthenticated: get(state, ['user', 'isAuthenticated'])
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
