/* eslint-disable */ // Eslint breaks the tests
import classNames from 'classnames';
import { replace } from 'connected-react-router';
import get from 'lodash/get';
import React, { Component, Suspense } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router';

import EcosFormModal from '../EcosForm/EcosFormModal';
import { ErrorBoundary } from '../ErrorBoundary';
import Header from '../Header';
import { MenuSettingsController } from '../MenuSettings';
import Notification from '../Notification';
import PageTabs from '../PageTabs';
import CacheRoute, { CacheSwitch } from '../ReactRouterCache';
import ReduxModal from '../ReduxModal';
import Menu from '../Sidebar/Sidebar';
import { PopupContainer } from '../common/Popper';
import UploadStatus from '../common/UploadStatus';
import AIAssistantContainer from '../AIAssistant/AIAssistantContainer';

import { initAppSettings } from '@/actions/app';
import { addTab, setTab, updateTab } from '@/actions/pageTabs';
import {goToDefaultFromBlockedWs, joinToWorkspace, updateUIWorkspace} from '@/actions/workspaces';
import { BASE_URLS_REDIRECT, Pages, pagesWithOnlyContent, RELOCATED_URL, URL as Urls } from '@/constants';
import { allowedModes } from '@/constants';
import { BASE_LEFT_MENU_ID, MenuTypes } from '@/constants/menu';
import { PANEL_CLASS_NAME } from '@/constants/pageTabs';
import { showWarningMessage } from '@/helpers/tools';
import { initClassToColorMap } from "@/helpers/lexical";
import { getLinkWithWs, getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, isMobileAppWebView, t } from '@/helpers/util';
import Page from '@/pages';
import {
  selectCurrentWorkspaceBlocked,
  selectCurrentWorkspaceIsBlocked,
  selectWorkspaceById,
  selectWorkspaceIsLoadingAction
} from '@/selectors/workspaces';
import { NotificationContainer } from '@/services/notifications';
import PageTabList from '@/services/pageTabs/PageTabList';
import PageLoader from '@/components/PageLoader';
import Server from '../common/icons/Server';
import UserLocalSettingsService from '@/services/userLocalSettings';

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
  Urls.BPMN_MIGRATION,
];

if (allowedModes.includes(process.env.NODE_ENV)) {
  allowedLinks.push(Urls.FORM_COMPONENTS, '/v2/debug/cmmn', '/v2/debug/tree');
}

class App extends Component {
  #homePageLink = Urls.DASHBOARD;

  componentDidMount() {
    this.props.initAppSettings();
    UserLocalSettingsService.checkDashletsUpdatedDate();

    // In order not to make a permanent tree render in the future,
    // it is necessary to request all the colors once (optimization)
    initClassToColorMap();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {
      location,
      defaultWorkspace,
      workspace,
      addTab,
      isBlockedCurrentWorkspace,
      updateUIWorkspace
    } = this.props;
    const { homePageLink = '' } = workspace || {};

    const prevSearch = get(prevProps, 'location.search');
    const search = get(location, 'search');

    const searchParams = search ? new URLSearchParams(search) : new URLSearchParams();
    const prevSearchParams = prevSearch ? new URLSearchParams(prevSearch) : new URLSearchParams();

    const workspaceId = getWorkspaceId(defaultWorkspace, search);
    const enabledWorkspaces = getEnabledWorkspaces();

    const propsWarning = this.propsWarningBlockedWorkspace;

    // If the workspace is no longer blocked, you need to update the dialog box so that it closes
    if (!!propsWarning.warningMessage || (prevProps.isBlockedCurrentWorkspace && !isBlockedCurrentWorkspace)) {
      showWarningMessage(propsWarning);
    }

    if (enabledWorkspaces && !isBlockedCurrentWorkspace && homePageLink) {
      const newHomePageLink = getLinkWithWs(homePageLink, workspaceId);

      if (newHomePageLink && newHomePageLink !== this.#homePageLink) {
        this.#homePageLink = newHomePageLink;

        if (BASE_URLS_REDIRECT.includes(location.pathname)) {
          addTab({
            data: { link: newHomePageLink, isActive: true, isLoading: true },
            params: { workspaceId },
          });
        }
      }
    }

    const prevWsId = prevSearchParams.get('ws');
    const nextWsId = searchParams.get('ws') || workspaceId;

    if (enabledWorkspaces && prevWsId !== nextWsId && !isBlockedCurrentWorkspace) {
      updateUIWorkspace();
    }

    if (prevProps.isAuthenticated && !this.props.isAuthenticated) {
      EcosFormModal.countOpenedModals <= 0 && window.location.reload();
    }
  }

  get propsWarningBlockedWorkspace() {
    const { isBlockedCurrentWorkspace, blockedCurrentWorkspace, goToDefaultFromBlockedWs, joinToWorkspace, isLoadingActionWorkspace = false } = this.props;
    const enabledWorkspaces = getEnabledWorkspaces();

    const isPublicWorkspace = get(blockedCurrentWorkspace, 'visibility') === 'PUBLIC';

    const warningMessage = isPublicWorkspace && blockedCurrentWorkspace.name ?
      t('workspaces.error-blocked-public.msg', { wsName: blockedCurrentWorkspace.name }) : t('workspaces.error-blocked.msg');

    const goToDefaultWorkspaceLabelBtn = t('workspaces.error-blocked.action.msg');
    const joinToWorkspaceLabelBtn = t('workspaces.join.message');

    const buttons = isPublicWorkspace ? [
      {
        loading: isLoadingActionWorkspace,
        className: 'ecos-btn_blue',
        key: 'join-action',
        onClick: () => joinToWorkspace({ wsId: get(blockedCurrentWorkspace, 'id') }),
        label: joinToWorkspaceLabelBtn
      },
      {
        key: 'action',
        onClick: () => goToDefaultFromBlockedWs(),
        label: goToDefaultWorkspaceLabelBtn
      }
    ] : [
      {
        className: 'ecos-btn_blue',
        key: 'action',
        onClick: () => goToDefaultFromBlockedWs(),
        label: goToDefaultWorkspaceLabelBtn
      }
    ];

    const propsWarning = {
      className: 'ecos-modal__btn_full app-warning-message',
      warningMessage: enabledWorkspaces && isBlockedCurrentWorkspace && warningMessage,
      onHide: () => showWarningMessage(propsWarning),
      buttons
    }

    return propsWarning;
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
          isShowSidebarLoader={this.props.menuType !== MenuTypes.LEFT || this.isOnlyContent}
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
    return Object.keys(RELOCATED_URL).map((key) => <Redirect key={key} from={key} to={RELOCATED_URL[key]} />);
  };

  renderCachedRouter = React.memo((props) => {
    const { tab, isShowSidebarLoader } = props;
    const isCurrent = PageTabList.isActiveTab(tab.id);
    const baseCacheRouteProps = {
      className: PANEL_CLASS_NAME,
      needUseFullPath: true,
      when: 'always',
      isCurrent,
      tabLink: tab.link,
    };
    const basePageProps = {
      tabId: tab.id,
      tabLink: tab.link,
      enableCache: true,
    };
    const styles = { ...this.wrapperStyle };

    if (!tab.isActive) {
      styles.display = 'none';
    }

    return (
      <div className="ecos-main-content" style={styles}>
        <Suspense fallback={<PageLoader withoutHeader withoutSidebar={!isShowSidebarLoader} />}>
          <CacheSwitch isCurrent={isCurrent} tabLink={tab.link}>
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.DASHBOARD}
              exact
              render={(props) => <Page pageKey={Pages.DASHBOARD} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="admin"
              path={Urls.ADMIN_PAGE}
              render={(props) => <Page pageKey={Pages.BPMN} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.JOURNAL}
              render={(props) => <Page pageKey={Pages.JOURNAL} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              cacheKey="dev-tools"
              path={Urls.DEV_TOOLS}
              render={(props) => <Page pageKey={Pages.DEV_TOOLS} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_EDITOR}
              render={(props) => <Page pageKey={Pages.BPMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_ADMIN_PROCESS}
              render={(props) => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_ADMIN_INSTANCE}
              render={(props) => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.BPMN_MIGRATION}
              render={(props) => <Page pageKey={Pages.BPMN_MIGRATION} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.CMMN_EDITOR}
              render={(props) => <Page pageKey={Pages.CMMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.DMN_EDITOR}
              render={(props) => <Page pageKey={Pages.DMN_EDITOR} {...props} {...basePageProps} footer={null} />}
            />
            {/* --- TIMESHEETs start */}
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET}
              exact
              render={(props) => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME}
              exact
              render={(props) => <Page pageKey={Pages.TIMESHEET_MY} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_SUBORDINATES}
              render={(props) => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_SUBORDINATES}
              render={(props) => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_FOR_VERIFICATION}
              render={(props) => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={(props) => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_DELEGATED}
              render={(props) => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.TIMESHEET_IFRAME_DELEGATED}
              render={(props) => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} {...basePageProps} withoutFooter />}
            />
            <CacheRoute
              {...baseCacheRouteProps}
              path={Urls.ORGSTRUCTURE}
              render={(props) => <Page pageKey={Pages.ORGSTRUCTURE} {...props} {...basePageProps} withoutFooter />}
            />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route
              path="/v2/debug/formio-develop"
              render={(props) => <Page pageKey={Pages.DEBUG_FORMIO} {...props} {...basePageProps} />}
            />
            <Route path="/v2/debug/tree" render={(props) => <Page pageKey={Pages.DEBUG_TREE} {...props} {...basePageProps} />} />

            {this.renderRedirectOldRoots()}
            <Redirect to={this.#homePageLink} />
          </CacheSwitch>
        </Suspense>
      </div>
    );
  });

  renderRouter = () => {
    return (
      <div className="ecos-main-content" style={this.wrapperStyle}>
        <Suspense fallback={<PageLoader withoutHeader  withoutSidebar={this.props.menuType === MenuTypes.LEFT && !this.isOnlyContent} />}>
          <Switch>
            <Route path={Urls.DASHBOARD} exact render={(props) => <Page pageKey={Pages.DASHBOARD} {...props} />} />
            <Route path={Urls.ADMIN_PAGE} render={(props) => <Page pageKey={Pages.BPMN} {...props} />} />
            <Route path={Urls.JOURNAL} render={(props) => <Page pageKey={Pages.JOURNAL} {...props} />} />
            <Route path={Urls.DEV_TOOLS} render={(props) => <Page pageKey={Pages.DEV_TOOLS} {...props} />} />
            <Route path={Urls.BPMN_EDITOR} render={(props) => <Page pageKey={Pages.BPMN_EDITOR} {...props} />} />
            <Route path={Urls.BPMN_ADMIN_PROCESS} render={(props) => <Page pageKey={Pages.BPMN_ADMIN_PROCESS} {...props} />} />
            <Route path={Urls.BPMN_ADMIN_INSTANCE} render={(props) => <Page pageKey={Pages.BPMN_ADMIN_INSTANCE} {...props} />} />
            <Route path={Urls.BPMN_MIGRATION} render={(props) => <Page pageKey={Pages.BPMN_MIGRATION} {...props} />} />
            <Route path={Urls.CMMN_EDITOR} render={(props) => <Page pageKey={Pages.CMMN_EDITOR} {...props} />} />
            <Route path={Urls.DMN_EDITOR} render={(props) => <Page pageKey={Pages.DMN_EDITOR} {...props} />} />
            {/* --- TIMESHEETs start */}
            <Route path={Urls.TIMESHEET} exact render={(props) => <Page pageKey={Pages.TIMESHEET_MY} {...props} />} />
            <Route path={Urls.TIMESHEET_SUBORDINATES} render={(props) => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} />} />
            <Route path={Urls.TIMESHEET_FOR_VERIFICATION} render={(props) => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} />} />
            <Route path={Urls.TIMESHEET_DELEGATED} render={(props) => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} />} />
            <Route path={Urls.TIMESHEET_IFRAME} exact render={(props) => <Page pageKey={Pages.TIMESHEET_MY} {...props} withoutFooter />} />
            <Route
              path={Urls.TIMESHEET_IFRAME_SUBORDINATES}
              render={(props) => <Page pageKey={Pages.TIMESHEET_SUBORDINATES} {...props} withoutFooter />}
            />
            <Route
              path={Urls.TIMESHEET_IFRAME_FOR_VERIFICATION}
              render={(props) => <Page pageKey={Pages.TIMESHEET_VERIFICATION} {...props} withoutFooter />}
            />
            <Route
              path={Urls.TIMESHEET_IFRAME_DELEGATED}
              render={(props) => <Page pageKey={Pages.TIMESHEET_DELEGATED} {...props} withoutFooter />}
            />
            <Route path={Urls.ORGSTRUCTURE} render={(props) => <Page pageKey={Pages.ORGSTRUCTURE} {...props} withoutFooter />} />
            {/* --- TIMESHEETs end */}

            {/* temporary routes */}
            <Route path="/v2/debug/formio-develop" render={(props) => <Page pageKey={Pages.DEBUG_FORMIO} {...props} />} />
            <Route path="/v2/debug/tree" render={(props) => <Page pageKey={Pages.DEBUG_TREE} {...props} />} />
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
      return <PageLoader  />;
    }

    const appClassNames = classNames('app-container', { mobile: isMobile, new: isViewNewJournal });
    const basePageClassNames = classNames('app-content ecos-base-page', {
      'ecos-base-page_headless': this.isOnlyContent,
      'ecos-base-page__new': isViewNewJournal,
    });

    if (isInitFailure) {
      return (
        <div className={appClassNames}>
          {this.renderReduxModal()}

          <div className="ecos-sticky-wrapper app-error">
            <Server width={400} height={250}/>

            <h2>{t('server.connection.error.title')}</h2>
            <p>{t('server.connection.error.message')}</p>
          </div>
          <NotificationContainer />
        </div>
      );
    }

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
          <AIAssistantContainer />
        </div>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = (state) => {
  const defaultWorkspace = get(state, ['workspaces', 'defaultWorkspace']);
  const workspaceId = getWorkspaceId(defaultWorkspace);

  return {
    isViewNewJournal: get(state, ['view', 'isViewNewJournal']),
    isLoadingActionWorkspace: selectWorkspaceIsLoadingAction(state),
    isBlockedCurrentWorkspace: selectCurrentWorkspaceIsBlocked(state),
    blockedCurrentWorkspace: selectCurrentWorkspaceBlocked(state),
    workspace: selectWorkspaceById(state, workspaceId),
    enableCache: get(state, ['app', 'enableCache']),
    isInit: get(state, ['app', 'isInit']),
    isInitFailure: get(state, ['app', 'isInitFailure']),
    isMobile: get(state, ['view', 'isMobile']),
    isShowTabs: get(state, ['pageTabs', 'isShow'], false),
    tabs: get(state, 'pageTabs.tabs', []),
    menuType: get(state, ['menu', 'type']),
    isAuthenticated: get(state, ['user', 'isAuthenticated']),
    defaultWorkspace,
  };
};

const mapDispatchToProps = (dispatch) => ({
  initAppSettings: () => dispatch(initAppSettings()),

  goToDefaultFromBlockedWs: () => dispatch(goToDefaultFromBlockedWs()),
  updateUIWorkspace: () => dispatch(updateUIWorkspace()),
  joinToWorkspace: ({ wsId }) => dispatch(joinToWorkspace({ wsId })),
  setTab: (params) => dispatch(setTab(params)),
  addTab: (params) => dispatch(addTab(params)),
  updateTab: (params) => dispatch(updateTab(params)),
  replace: (url) => dispatch(replace(url)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
