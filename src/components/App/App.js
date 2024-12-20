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

import { selectCurrentWorkspaceIsBlocked, selectWorkspaceById } from '../../selectors/workspaces';
import { initAppSettings } from '../../actions/app';
import { addTab, setTab, updateTab } from '../../actions/pageTabs';
import { BASE_URLS_REDIRECT, Pages, pagesWithOnlyContent, RELOCATED_URL, URL as Urls } from '../../constants';
import { BASE_LEFT_MENU_ID, MenuTypes } from '../../constants/menu';
import { showWarningMessage } from '../../helpers/tools';
import { goToDefaultFromBlockedWs, updateUIWorkspace } from '../../actions/workspaces';
import { PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { isMobileAppWebView, t } from '../../helpers/util';
import pageTabList from '../../services/pageTabs/PageTabList';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { PopupContainer } from '../common/Popper';
import { getLinkWithWs, getWorkspaceId } from '../../helpers/urls';
import { MenuSettingsController } from '../MenuSettings';
import PageService from '../../services/PageService';
import PageTabList from '../../services/pageTabs/PageTabList';
import EcosFormModal from '../EcosForm/EcosFormModal';
import UploadStatus from '../common/UploadStatus';

import './App.scss';

const allowedLinks = [
  Urls.DASHBOARD,
  Urls.BPMN_DESIGNER,
  Urls.ADMIN_PAGE,
  Urls.JOURNAL,
  Urls.DEV_TOOLS,
  Urls.BPMN_EDITOR,
  Urls.CMMN_EDITOR,
  Urls.DMN_EDITOR,

  Urls.TIMESHEET,
  Urls.TIMESHEET_SUBORDINATES,
  Urls.TIMESHEET_FOR_VERIFICATION,
  Urls.TIMESHEET_DELEGATED,
  Urls.TIMESHEET_IFRAME,
  Urls.TIMESHEET_IFRAME_SUBORDINATES,
  Urls.TIMESHEET_IFRAME_FOR_VERIFICATION,
  Urls.TIMESHEET_IFRAME_DELEGATED,

  Urls.ORGSTRUCTURE,

  Urls.BPMN_ADMIN_PROCESS,
  Urls.BPMN_ADMIN_INSTANCE,
  Urls.BPMN_MIGRATION
];

if (process.env.NODE_ENV === 'development') {
  allowedLinks.push(Urls.FORM_COMPONENTS, '/v2/debug/cmmn', '/v2/debug/tree');
}

class App extends Component {
  #homePageLink = Urls.DASHBOARD;

  componentDidMount() {
    this.props.initAppSettings();
    UserLocalSettingsService.checkDashletsUpdatedDate();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {
      location,
      defaultWorkspace,
      workspace,
      replace,
      addTab,
      blockedCurrentWorkspace,
      goToDefaultFromBlockedWs,
      updateUIWorkspace
    } = this.props;
    const { homePageLink = '' } = workspace || {};

    const prevSearch = get(prevProps, 'location.search');
    const search = get(location, 'search');

    const searchParams = new URLSearchParams(search);
    const prevSearchParams = new URLSearchParams(prevSearch);

    const workspaceId = getWorkspaceId(defaultWorkspace);
    const enabledWorkspaces = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    const propsWarning = {
      className: 'ecos-modal__btn_full',
      warningMessage: enabledWorkspaces && blockedCurrentWorkspace && t('workspaces.error-blocked.msg'),
      actionCallback: () => goToDefaultFromBlockedWs(),
      actionLabel: t('workspaces.error-blocked.action.msg'),
      onHide: () => showWarningMessage(propsWarning)
    };

    showWarningMessage(propsWarning);

    if (enabledWorkspaces && !blockedCurrentWorkspace) {
      if (search.includes('ws=') && !searchParams.get('ws') && workspaceId && !BASE_URLS_REDIRECT.includes(location.pathname)) {
        const newUrl = search
          ? `${location.pathname}${search.replace(/ws=[^&]*/, `ws=${workspaceId}`)}`
          : `${location.pathname}?ws=${workspaceId}`;

        replace(newUrl);
      }

      if (!search.includes('ws=') && !BASE_URLS_REDIRECT.includes(location.pathname)) {
        const activePrev = PageTabList.activeTab;

        const newUrl = search ? `${location.pathname}${search}&ws=${workspaceId}` : `${location.pathname}?ws=${workspaceId}`;

        PageService.changeUrlLink(newUrl, { openNewTab: true });

        if (activePrev) {
          PageTabList.delete(activePrev);
        }
      }

      const newHomePageLink = getLinkWithWs(homePageLink, workspaceId);
      if (homePageLink && newHomePageLink && newHomePageLink !== this.#homePageLink) {
        this.#homePageLink = newHomePageLink;

        if (BASE_URLS_REDIRECT.includes(location.pathname)) {
          addTab({
            data: { link: newHomePageLink, isActive: true, isLoading: true },
            params: { workspaceId }
          });
        }
      }
    }

    if (enabledWorkspaces && prevSearchParams.get('ws') !== searchParams.get('ws')) {
      updateUIWorkspace();
    }

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
          homepageLink={this.#homePageLink}
          isShow={isShowTabs && !this.isOnlyContent && !isMobile}
          ContentComponent={this.renderCachedRouter}
        />
      );
    }

    return (
      <>
        <PageTabs homepageLink={this.#homePageLink} isShow={isShowTabs && !this.isOnlyContent && !isMobile} />
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
    const enabledWorkspaces = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);
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
            {!enabledWorkspaces && (
              <CacheRoute
                {...baseCacheRouteProps}
                path={Urls.DASHBOARD}
                exact
                render={props => <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />}
              />
            )}
            {enabledWorkspaces && (
              <CacheRoute
                {...baseCacheRouteProps}
                path={Urls.DASHBOARD}
                exact
                render={props =>
                  get(props, 'location.search', '').includes('ws=') && get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false) ? (
                    <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />
                  ) : (
                    <Redirect to={this.#homePageLink} />
                  )
                }
              />
            )}
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="admin"
              path={Urls.ADMIN_PAGE}
              render={props => <Page pageKey={Pages.BPMN} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.JOURNAL}
              render={props => <Page pageKey={Pages.JOURNAL} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="dev-tools"
              path={Urls.DEV_TOOLS}
              render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_EDITOR}
              render={props => <Page pageKey={Pages.BPMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_ADMIN_PROCESS}
              render={props => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_ADMIN_INSTANCE}
              render={props => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_MIGRATION}
              render={props => <Page pageKey={Pages.BPMN_MIGRATION} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.CMMN_EDITOR}
              render={props => <Page pageKey={Pages.CMMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.DMN_EDITOR}
              render={props => <Page pageKey={Pages.DMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            {/* --- TIMESHEETs start */}
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET}
              exact
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME}
              exact
              render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.ORGSTRUCTURE}
              render={props => <Page pageKey={Pages.ORGSTRUCTURE} {...props} {...basePageProps} withoutFooter />}
            />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} {...basePageProps} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} {...basePageProps} />} />

            {this.renderRedirectOldRoots()}
            <Redirect to={this.#homePageLink} />
          </CacheSwitch>
        </Suspense>
      </div>
    );
  });

  renderRouter = () => {
    const enabledWorkspaces = get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false);

    return (
      <div className="ecos-main-content" style={this.wrapperStyle}>
        <Suspense fallback={null}>
          <Switch>
            {!enabledWorkspaces && <Route path={Urls.DASHBOARD} exact render={props => <Page pageKey={Pages.DASHBOARD} {...props} />} />}
            {enabledWorkspaces && (
              <Route
                path={Urls.DASHBOARD}
                exact
                render={props =>
                  get(props, 'location.search', '').includes('ws=') ? (
                    <Page pageKey={Pages.DASHBOARD} {...props} />
                  ) : (
                    <Redirect to={this.#homePageLink} />
                  )
                }
              />
            )}
            <Route path={Urls.ADMIN_PAGE} render={props => <Page pageKey={Pages.BPMN} {...props} />} />
            <Route path={Urls.JOURNAL} render={props => <Page pageKey={Pages.JOURNAL} {...props} />} />
            <Route path={Urls.DEV_TOOLS} render={props => <Page pageKey={Pages.DEV_TOOLS} {...props} />} />
            <Route path={Urls.BPMN_EDITOR} render={props => <Page pageKey={Pages.BPMN_EDITOR} {...props} />} />
            <Route path={Urls.BPMN_ADMIN_PROCESS} render={props => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} />} />
            <Route path={Urls.BPMN_ADMIN_INSTANCE} render={props => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} />} />
            <Route path={Urls.BPMN_MIGRATION} render={props => <Page pageKey={Pages.BPMN_MIGRATION} {...props} />} />
            <Route path={Urls.CMMN_EDITOR} render={props => <Page pageKey={Pages.CMMN_EDITOR} {...props} />} />
            <Route path={Urls.DMN_EDITOR} render={props => <Page pageKey={Pages.DMN_EDITOR} {...props} />} />
            {/* --- TIMESHEETs start */}
            <Route path={Urls.TIMESHEET} exact render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} />} />
            <Route path={Urls.TIMESHEET_SUBORDINATES} render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} />} />
            <Route path={Urls.TIMESHEET_FOR_VERIFICATION} render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} />} />
            <Route path={Urls.TIMESHEET_DELEGATED} render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} />} />
            <Route path={Urls.TIMESHEET_IFRAME} exact render={props => <Page pageKey={Pages.TIMESHEET_MY} {...props} withoutFooter />} />
            <Route
              path={Urls.TIMESHEET_IFRAME_SUBORDINATES}
              render={props => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} withoutFooter />}
            />
            <Route
              path={Urls.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={props => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} withoutFooter />}
            />
            <Route
              path={Urls.TIMESHEET_IFRAME_DELEGATED}
              render={props => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} withoutFooter />}
            />
            <Route path={Urls.ORGSTRUCTURE} render={props => <Page pageKey={Pages.ORGSTRUCTURE} {...props} withoutFooter />} />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={props => <Page pageKey={Pages.DEBUG_FORMIO} {...props} />} />
            <Route path="/v2/debug/tree" render={props => <Page pageKey={Pages.DEBUG_TREE} {...props} />} />
            {this.renderRedirectOldRoots()}
            <Redirect to={this.#homePageLink} />
          </Switch>
        </Suspense>
      </div>
    );
  };

  render() {
    const { isInit, isInitFailure, isMobile, isViewNewJournal } = this.props;

    if (!isInit) {
      // TODO: Loading component
      return null;
    }

    if (isInitFailure) {
      // TODO: Crash app component
      return null;
    }

    const appClassNames = classNames('app-container', { mobile: isMobile, new: isViewNewJournal });
    const basePageClassNames = classNames('app-content ecos-base-page', {
      'ecos-base-page_headless': this.isOnlyContent,
      'ecos-base-page__new': isViewNewJournal
    });

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
          <UploadStatus />
        </div>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = state => {
  const defaultWorkspace = get(state, ['workspaces', 'defaultWorkspace']);
  const workspaceId = getWorkspaceId(defaultWorkspace);

  return {
    isViewNewJournal: get(state, ['view', 'isViewNewJournal']),
    blockedCurrentWorkspace: selectCurrentWorkspaceIsBlocked(state),
    workspace: selectWorkspaceById(state, workspaceId),
    enableCache: get(state, ['app', 'enableCache']),
    isInit: get(state, ['app', 'isInit']),
    isInitFailure: get(state, ['app', 'isInitFailure']),
    isMobile: get(state, ['view', 'isMobile']),
    isShowTabs: get(state, ['pageTabs', 'isShow'], false),
    tabs: get(state, 'pageTabs.tabs', []),
    menuType: get(state, ['menu', 'type']),
    isAuthenticated: get(state, ['user', 'isAuthenticated']),
    defaultWorkspace
  };
};

const mapDispatchToProps = dispatch => ({
  initAppSettings: () => dispatch(initAppSettings()),

  goToDefaultFromBlockedWs: () => dispatch(goToDefaultFromBlockedWs()),
  updateUIWorkspace: () => dispatch(updateUIWorkspace()),
  setTab: params => dispatch(setTab(params)),
  addTab: params => dispatch(addTab(params)),
  updateTab: params => dispatch(updateTab(params)),
  replace: url => dispatch(replace(url))
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
