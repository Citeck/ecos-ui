import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import * as queryString from 'query-string';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
  getDashboardConfig,
  getDashboardTitle,
  resetDashboardConfig,
  saveDashboardConfig,
  setLoading,
  setWarningMessage
} from '@/actions/dashboard';
import { saveMenuConfig } from '@/actions/menu';
import { deleteTab } from '@/actions/pageTabs.js';
import { DndUtils } from '@/components/Drag-n-Drop';
import Layout from '@/components/Layout';
import TopMenu from '@/components/Layout/TopMenu';
import Records from '@/components/Records';
import RecordUpdater from '@/components/Records/RecordUpdater';
import { Loader, ScrollArrow, Tabs } from '@/components/common';
import TitlePageLoader from '@/components/common/TitlePageLoader';
import DialogManager from '@/components/common/dialogs/Manager';
import { Badge } from '@/components/common/form';
import Components, { ComponentKeys } from '@/components/widgets/Components.js';
import { DocStatus } from '@/components/widgets/DocStatus';
import { LoaderTypes, URL } from '@/constants';
import { DashboardTypes } from '@/constants/dashboard';
import { MenuTypes } from '@/constants/menu';
import { showModalJson } from '@/helpers/tools';
import { decodeLink, getLinkWithWs, getSortedUrlParams, isDashboard, pushHistoryLink, replaceHistoryLink } from '@/helpers/urls';
import { getEnabledWorkspaces, isMobileAppWebView, t } from '@/helpers/util';
import { selectDashboardByKey, selectDashboardConfig, selectDashboardConfigVersion } from '@/selectors/dashboard';
import { selectCurrentWorkspaceIsBlocked } from '@/selectors/workspaces';
import PageService from '@/services/PageService';
import DashboardService from '@/services/dashboard';
import PageTabList from '@/services/pageTabs/PageTabList';

import './style.scss';

const getStateId = state => {
  return state.enableCache ? state.tabId || DashboardService.key : null;
};

const mapStateToProps = (state, ownProps) => {
  const enableCache = get(state, ['app', 'enableCache']);
  const isMobile = get(state, ['view', 'isMobile'], false);
  const stateKey = getStateId(ownProps);
  const dashboardState = selectDashboardByKey(state, stateKey);

  return {
    stateKey,
    enableCache,
    isBlockedCurrentWorkspace: selectCurrentWorkspaceIsBlocked(state),
    config: selectDashboardConfig(dashboardState, isMobile),
    isLoadingDashboard: get(dashboardState, 'isLoading'),
    saveResultDashboard: get(dashboardState, 'requestResult', {}),
    isLoadingMenu: get(state, ['menu', 'isLoading']),
    saveResultMenu: get(state, ['menu', 'requestResult']),
    menuType: get(state, ['menu', 'type']),
    links: get(state, ['menu', 'links']),
    dashboardType: get(dashboardState, ['identification', 'type']),
    identificationId: get(dashboardState, ['identification', 'id'], null),
    titleInfo: get(dashboardState, ['titleInfo'], {}),
    warningMessage: get(dashboardState, 'warningMessage', ''),
    isMobile,
    redirectToNewUi: get(state, 'app.redirectToNewUi', false),
    originalConfig: get(dashboardState, 'originalConfig', {}),
    configVersion: selectDashboardConfigVersion(dashboardState)
  };
};

const mapDispatchToProps = (dispatch, state) => ({
  getDashboardConfig: payload => dispatch(getDashboardConfig({ ...payload, key: getStateId(state) })),
  getDashboardTitle: payload => dispatch(getDashboardTitle({ ...payload, key: getStateId(state) })),
  saveDashboardConfig: payload => dispatch(saveDashboardConfig({ ...payload, key: getStateId(state) })),
  saveMenuConfig: config => dispatch(saveMenuConfig({ config, key: getStateId(state) })),
  setLoading: status => dispatch(setLoading({ status, key: getStateId(state) })),
  resetDashboardConfig: () => dispatch(resetDashboardConfig(getStateId(state))),
  deleteTab: tab => dispatch(deleteTab(tab)),
  closeWarningMessage: () => dispatch(setWarningMessage({ key: getStateId(state), message: '' }))
});

class Dashboard extends Component {
  state = {
    urlParams: getSortedUrlParams(),
    canDragging: false,
    activeLayoutId: null,
    activeTab: null,
    needGetConfig: false,
    openedTabs: new Set()
  };

  constructor(props) {
    super(props);

    this.state.config = props.config || [];

    const recordRef = get(this.getPathInfo(), 'recordRef', null);

    this.instanceRecord = Records.get(recordRef);
    this.watcher = this.instanceRecord.watch(['version', 'name'], this.updateSomeDetails);

    this.recordUpdater = new RecordUpdater(this.instanceRecord);
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};
    const newUrlParams = getSortedUrlParams();
    const firstLayoutId = get(props.config, '[0].id');
    const activeTab = get(queryString.parse(window.location.search), 'activeTab', null);
    const activeLayoutId = get(queryString.parse(window.location.search), 'activeLayoutId');

    const isExistLayoutById = isArray(props.config) && !!props.config.find(layout => layout.id === activeLayoutId);
    const isExistLayoutByTab = isArray(props.config) && !isNil(activeTab) && !!props.config[Number(activeTab)];

    if (isNil(state.activeTab) && !isEmpty(props.config)) {
      newState.activeTab = isExistLayoutByTab ? Number(activeTab) : 0;
    }

    if (!state.activeLayoutId && !isEmpty(props.config)) {
      newState.activeLayoutId = isExistLayoutById ? activeLayoutId : firstLayoutId;
    }

    if (JSON.stringify(props.config) !== JSON.stringify(state.config)) {
      newState.config = props.config;
    }

    if (state.urlParams !== newUrlParams) {
      if (!props.enableCache) {
        props.resetDashboardConfig();
      }

      newState.urlParams = newUrlParams;

      if (isDashboard()) {
        newState.needGetConfig = true;
        newState.activeLayoutId = '';
        newState.activeTab = null;
      }
    }

    if (state.urlParams === newUrlParams && props.isLoadingDashboard && !isEmpty(props.config)) {
      props.setLoading(false);
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    if (!isNil(newState.activeTab)) {
      newState.openedTabs = state.openedTabs.add(Number(newState.activeTab));
      Dashboard.updateTabLink();
    }

    return newState;
  }

  static updateTabLink() {
    const link = unescape(decodeURI(`${window.location.pathname}${window.location.search}`));

    PageService.changeUrlLink(link, { updateUrl: true });
  }

  componentDidMount() {
    this.getConfig(this.state.urlParams);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return isDashboard() && !(nextProps.tabId && !PageTabList.isActiveTab(nextProps.tabId));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { tabId, stateKey, enableCache, config, resetDashboardConfig, isMobile, warningMessage } = this.props;
    const { needGetConfig, activeTab, urlParams } = this.state;

    if (this.tabList.length) {
      this.toggleTabLayoutFromUrl();
    }

    if (prevState.urlParams !== urlParams) {
      this.setState({ urlParams });
    }

    if (needGetConfig || (!prevProps.tabId && tabId) || (enableCache && prevProps.stateKey !== stateKey)) {
      if (isMobile) {
        resetDashboardConfig();
      }

      this.getConfig(urlParams);
    }

    if (isDashboard() && !isEmpty(config)) {
      const activeTabIndex = get(queryString.parse(decodeLink(window.location.search)), 'activeTab');
      const layoutId = get(queryString.parse(decodeLink(window.location.search)), 'activeLayoutId');
      const isExistLayout = isArray(config) && !isNil(activeTab) && !!config[Number(activeTabIndex)];
      const hasManyTabs = this.tabList && this.tabList.length > 1;

      switch (true) {
        case !isNil(activeTab) && !isExistLayout && hasManyTabs:
        case !!get(this.tabList, [activeTab, 'isEmpty']):
          this.setActiveLink(0);
          break;

        default:
          break;
      }

      if (isNil(activeTabIndex) && !!layoutId) {
        const searchParams = queryString.parse(window.location.search);
        const tabIndex = config.findIndex(layout => layout.id === layoutId);

        if (hasManyTabs) {
          searchParams.activeTab = tabIndex === -1 ? 0 : tabIndex;
        }
        delete searchParams.activeLayoutId;

        this.setState(
          {
            activeTab: tabIndex === -1 ? 0 : tabIndex
          },
          () => this.addSearchParams(searchParams)
        );
      }
    }

    if (!!warningMessage) {
      this.showWarningMessage();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
    this.showWarningMessage.cancel();
    this.recordUpdater.dispose();
  }

  showWarningMessage = debounce(() => {
    const { warningMessage, isBlockedCurrentWorkspace } = this.props;

    if (isBlockedCurrentWorkspace) {
      return null;
    }

    const openHomeDashboard = () => {
      const link = getEnabledWorkspaces() ? getLinkWithWs(URL.DASHBOARD) : URL.DASHBOARD;
      PageService.changeUrlLink(link, { openNewTab: true, closeActiveTab: true, needUpdateTabs: true });
    };

    DialogManager.showCustomDialog({
      isVisible: !!warningMessage,
      title: t('error.access'),
      body: warningMessage,
      modalClass: 'ecos-modal_width-xs ecos-modal_level-4 ecos-dashboard__warning-modal',
      onHide: () => openHomeDashboard(),
      buttons: [
        {
          className: 'ecos-btn_blue ecos-dashboard__warning-modal_btn',
          key: 'home-page',
          onClick: () => openHomeDashboard(),
          label: t('go-to.home-page')
        }
      ]
    });
  }, 0);

  getPathInfo(data = window.location.search) {
    const search = decodeLink(data);
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId, dashboardKey } = searchParams;

    return {
      recordRef: isArray(recordRef) ? recordRef.shift() : recordRef,
      dashboardId,
      dashboardKey,
      search
    };
  }

  getConfig(search = window.location.search) {
    const { getDashboardConfig, getDashboardTitle, tabId } = this.props;

    if (tabId && !PageTabList.isActiveTab(tabId)) {
      return;
    }

    const { recordRef, dashboardId } = this.getPathInfo(search);
    getDashboardConfig({ dashboardId, recordRef });
    getDashboardTitle({ dashboardId, recordRef });

    this.setState({ needGetConfig: false });
  }

  get activeLayout() {
    const { config, activeTab } = this.state;

    if (!isEmpty(config) && isArray(config) && !isNil(activeTab)) {
      return config[Number(activeTab)] || {};
    }

    return {};
  }

  getLayout = layoutId => {
    const { config } = this.state;

    if (!isEmpty(config) && isArray(config) && !!layoutId) {
      return config.find(item => item.id === layoutId) || {};
    }

    return {};
  };

  getIsEmptyTab = (columns = []) => {
    let isEmpty = true;

    columns.flat().forEach(column => {
      const widgets = get(column, 'widgets');

      if (widgets && !!isEmpty) {
        widgets.forEach(widget => {
          const Widget = Components.getRaw(widget.name);

          if (!!Widget && !!isEmpty) {
            if (widget.name === ComponentKeys.JOURNAL) {
              const isExistJournal = get(widget, 'isExistJournal', false);
              const journalConfig = get(widget, 'props.config') || {};
              const versionConfigJournal = journalConfig[get(journalConfig, 'version') || 'v2'];
              const journalId = get(versionConfigJournal, 'journalId');

              if (!versionConfigJournal || !journalId || isExistJournal) {
                isEmpty = false;
              }
            } else {
              if (isFunction(Widget.then)) {
                Widget.then(module => {
                  if (!!module) {
                    isEmpty = false;
                  }
                });
              } else {
                isEmpty = false;
              }
            }
          }
        });
      }
    });

    return isEmpty;
  };

  get tabList() {
    const { config } = this.state;

    if (!isEmpty(config) && isArray(config)) {
      return config.map((item, index) => ({ ...item.tab, index, isEmpty: this.getIsEmptyTab(get(item, 'columns', [])) }));
    }

    return [];
  }

  get isShowTabs() {
    return this.tabList.length > 1 && !isMobileAppWebView();
  }

  updateSomeDetails = () => {
    const { getDashboardTitle } = this.props;
    const { dashboardId, recordRef } = this.getPathInfo();

    getDashboardTitle({ dashboardId, recordRef });
  };

  saveDashboardConfig = payload => {
    this.props.saveDashboardConfig && this.props.saveDashboardConfig(payload);
  };

  updateActiveConfig(activeLayout) {
    const { config, activeTab } = this.state;
    const upConfig = cloneDeep(config || []);

    upConfig.forEach((item, i) => {
      if (i === activeTab) {
        upConfig[i] = activeLayout;
      }
    });

    this.setState({ config: upConfig });

    return upConfig;
  }

  prepareWidgetsConfig = (data, dnd) => {
    const activeLayout = cloneDeep(this.activeLayout);
    const columns = activeLayout.columns || [];

    const { isWidget, columnFrom, columnTo } = data;
    const { source, destination } = dnd;

    if (isWidget) {
      let widgetsFrom = columns[columnFrom].widgets || [];
      let widgetsTo = columns[columnTo].widgets || [];
      let result = [];

      if (+columnFrom !== +columnTo) {
        result = DndUtils.move(widgetsFrom, widgetsTo, source, destination);
        widgetsFrom = result[source.droppableId];
        widgetsTo = result[destination.droppableId];

        activeLayout.columns[columnTo].widgets = widgetsTo;
        activeLayout.columns[columnFrom].widgets = widgetsFrom;
      } else {
        widgetsFrom = DndUtils.reorder(widgetsFrom, data.positionFrom, data.positionTo);
        activeLayout.columns[columnFrom].widgets = widgetsFrom;
      }
    }

    const config = this.updateActiveConfig(activeLayout);

    this.saveDashboardConfig({ config });
  };

  setActiveLink = activeTabIndex => {
    const searchParams = queryString.parse(window.location.search);

    if (this.tabList && this.tabList.length > 1) {
      searchParams.activeTab = activeTabIndex;
    }

    this.addSearchParams(searchParams);
  };

  addSearchParams = searchParams => {
    const { urlParams } = this.state;
    const prevSearchParams = queryString.parse(urlParams);
    const isEqualRefs = get(prevSearchParams, 'recordRef', '') === get(searchParams, 'recordRef');
    const isEqualLayoutIndexes = get(prevSearchParams, 'activeTab', '') === get(searchParams, 'activeTab');

    if (!urlParams || (isEqualRefs && !isEqualLayoutIndexes)) {
      replaceHistoryLink(
        cloneDeep(this.props.history),
        `${URL.DASHBOARD}${isEmpty(searchParams) ? '' : '?' + decodeLink(queryString.stringify(searchParams))}`,
        true
      );
    } else {
      pushHistoryLink(
        undefined,
        isEmpty(searchParams)
          ? {
              pathname: URL.DASHBOARD
            }
          : {
              pathname: URL.DASHBOARD,
              search: decodeLink(queryString.stringify(searchParams))
            },
        true
      );
    }

    Dashboard.updateTabLink();
  };

  handleSaveMenu = links => {
    const { saveMenuConfig, menuType } = this.props;

    saveMenuConfig({ type: menuType, links });
  };

  handleSaveWidgetProps = (id, props = {}, callback) => {
    const { configVersion } = this.props;

    if (configVersion) {
      const originalConfig = cloneDeep(this.props.originalConfig);
      const widgets = get(originalConfig, [configVersion, 'widgets'], []);
      const widget = widgets.find(widget => widget.id === id);
      const { recordRef } = this.getPathInfo();

      if (widget) {
        widget.props = {
          ...widget.props,
          ...props
        };
      }

      this.saveDashboardConfig({ config: originalConfig, recordRef, callback });

      return;
    }

    const activeLayout = cloneDeep(this.activeLayout);
    const columns = activeLayout.columns || [];
    const eachColumns = column => {
      const index = column.widgets.findIndex(widget => widget.id === id);

      if (index !== -1) {
        column.widgets[index].props = { ...column.widgets[index].props, ...props };
        return false;
      }

      return true;
    };

    columns.forEach(column => {
      if (isArray(column)) {
        column.forEach(eachColumns);
      } else {
        eachColumns(column);
      }
    });
    activeLayout.columns = columns;

    const config = this.updateActiveConfig(activeLayout);

    this.saveDashboardConfig({ config, callback });
  };

  handleReloadContent = event => {
    if (event.ctrlKey) {
      event.stopPropagation();
      this.setState({ reloadContent: true }, () => this.setState({ reloadContent: false }));
    }
  };

  handleShowConfig = event => {
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) {
      event.stopPropagation();
      showModalJson(this.props.originalConfig);
    }
  };

  toggleTabLayout = index => {
    const tab = get(this.tabList, [index], {});

    this.setState(state => ({ openedTabs: state.openedTabs.add(tab.index) }));
    this.setActiveLink(tab.index);
  };

  toggleTabLayoutFromUrl = () => {
    const searchParams = queryString.parse(window.location.search);
    const { activeTab: activeTabFromUrl } = searchParams;
    const activeTab = Number(activeTabFromUrl);
    if (!isNil(activeTabFromUrl) && activeTab !== Number(this.state.activeTab)) {
      const tab = this.tabList[activeTab];

      if (tab && activeTab !== Number(this.state.activeTab)) {
        this.setState(state => ({
          activeTab,
          openedTabs: state.openedTabs.add(activeTab)
        }));
        return;
      }

      if (!isNil(activeTabFromUrl) && !tab) {
        delete searchParams.activeTab;

        pushHistoryLink(this.props.history, {
          pathname: URL.DASHBOARD,
          search: queryString.stringify(searchParams)
        });
      }
    }
  };

  renderTabs() {
    if (!this.isShowTabs) {
      return null;
    }

    const { isMobile } = this.props;
    const { activeTab } = this.state;

    if (isMobile) {
      return (
        <div className="ecos-dashboard__tabs ecos-dashboard__tabs_mobile">
          <Tabs
            isMobile
            items={this.tabList}
            onClick={this.toggleTabLayout}
            keyField="idLayout"
            activeTabKey={get(this.tabList[activeTab], 'idLayout')}
          />
        </div>
      );
    }

    return (
      <div className="ecos-dashboard__tabs-wrapper">
        <ScrollArrow className="ecos-dashboard__tabs-arrows" small>
          <Tabs
            hasHover
            hasHint
            narrow
            className="ecos-dashboard__tabs-block"
            classNameTab="ecos-dashboard__tabs-item"
            items={this.tabList}
            onClick={this.toggleTabLayout}
            keyField="idLayout"
            activeTabKey={get(this.tabList[activeTab], 'idLayout')}
          />
        </ScrollArrow>
      </div>
    );
  }

  renderLayout = React.memo(props => {
    return <Layout className={classNames({ 'ecos-layout_mobile': props.isMobile })} {...props} />;
  });

  renderTopMenu() {
    const { menuType, isLoadingMenu, links } = this.props;

    if (menuType !== MenuTypes.TOP) {
      return null;
    }

    return <TopMenu isShow isSortable isLoading={isLoadingMenu} links={links} onSave={this.handleSaveMenu} />;
  }

  renderHeader() {
    if (isMobileAppWebView()) {
      return null;
    }

    const {
      titleInfo: { name = '', version = '' },
      dashboardType,
      isMobile,
      isLoadingDashboard,
      stateKey
    } = this.props;
    const { recordRef } = this.getPathInfo();

    let title;

    switch (dashboardType) {
      case DashboardTypes.CASE_DETAILS:
        title = (
          <div className="ecos-dashboard__header-title" key="title">
            <TitlePageLoader isReady={!!name} withBadge>
              <div className="ecos-dashboard__header-name">{t(name)}</div>
              {version && <Badge text={version} size={isMobile ? 'small' : 'large'} />}
            </TitlePageLoader>
          </div>
        );
        break;
      case DashboardTypes.PROFILE:
      case DashboardTypes.WIKI:
        title = null;
        break;
      case DashboardTypes.USER:
      case DashboardTypes.SITE:
      default:
        title = <div className="ecos-dashboard__header-title">{name && <div className="ecos-dashboard__header-name">{t(name)}</div>}</div>;
        break;
    }

    const showStatus = isMobile && [DashboardTypes.CASE_DETAILS].includes(dashboardType);

    return (
      <div
        className={classNames('ecos-dashboard__header', {
          'ecos-dashboard__header_mobile': isMobile,
          'ecos-dashboard__header_no-next': isMobile && !this.isShowTabs
        })}
        onDoubleClick={this.handleReloadContent}
        onClick={this.handleShowConfig}
      >
        {title}
        {showStatus && (
          <DocStatus
            stateId={stateKey}
            record={recordRef}
            className="ecos-dashboard__header-status"
            loaderType={LoaderTypes.POINTS}
            noLoader={isLoadingDashboard}
          />
        )}
      </div>
    );
  }

  renderLoader() {
    if (this.props.isLoadingDashboard) {
      return <Loader height={100} width={100} />;
    }

    return null;
  }

  renderContent() {
    const { menuType, isMobile, tabId, identificationId } = this.props;
    const { canDragging, activeTab, openedTabs } = this.state;

    return this.tabList.map(tab => {
      const { columns, type } = this.getLayout(tab.idLayout);
      const styles = {};
      const isActive = tab.index === activeTab;

      if (!isActive) {
        styles.display = 'none';
      }

      if (!isActive && !openedTabs.has(tab.index)) {
        return null;
      }

      return (
        <div style={styles} key={tab.idLayout}>
          <this.renderLayout
            menuType={menuType}
            isMobile={isMobile}
            canDragging={canDragging}
            columns={columns}
            type={type}
            tabId={tabId}
            dashboardId={identificationId}
            isActiveLayout={PageTabList.isActiveTab(tabId)}
            onSaveWidget={this.prepareWidgetsConfig}
            onSaveWidgetProps={this.handleSaveWidgetProps}
          />
        </div>
      );
    });
  }

  render() {
    return (
      <>
        {this.renderTopMenu()}
        {this.renderHeader()}
        {this.renderTabs()}
        {!this.state.reloadContent && this.renderContent()}
        {this.renderLoader()}
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
