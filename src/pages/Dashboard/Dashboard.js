import React, { Component } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { RectShape, RoundShape } from 'react-placeholder/lib/placeholders';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

import { LoaderTypes, MENU_TYPE, URL } from '../../constants';
import { DashboardTypes } from '../../constants/dashboard';
import { deepClone, isMobileAppWebView, t } from '../../helpers/util';
import { getSortedUrlParams, isDashboard } from '../../helpers/urls';
import { getDashboardConfig, getDashboardTitle, resetDashboardConfig, saveDashboardConfig, setLoading } from '../../actions/dashboard';
import { getMenuConfig, saveMenuConfig } from '../../actions/menu';
import { Loader, ScrollArrow, Tabs } from '../../components/common';
import { Badge } from '../../components/common/form';
import { DocStatus } from '../../components/widgets/DocStatus';
import Layout from '../../components/Layout';
import { DndUtils } from '../../components/Drag-n-Drop';
import TopMenu from '../../components/Layout/TopMenu';
import Records from '../../components/Records';
import DashboardService from '../../services/dashboard';
import pageTabList from '../../services/pageTabs/PageTabList';
import { selectDashboardByKey } from '../../selectors/dashboard';
import PageService from '../../services/PageService';

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
    config: get(dashboardState, [isMobile ? 'mobileConfig' : 'config'], []),
    isLoadingDashboard: get(dashboardState, ['isLoading']),
    saveResultDashboard: get(dashboardState, ['requestResult'], {}),
    isLoadingMenu: get(state, ['menu', 'isLoading']),
    saveResultMenu: get(state, ['menu', 'requestResult']),
    menuType: get(state, ['menu', 'type']),
    links: get(state, ['menu', 'links']),
    dashboardType: get(dashboardState, ['identification', 'type']),
    identificationId: get(dashboardState, ['identification', 'id'], null),
    titleInfo: get(dashboardState, ['titleInfo'], {}),
    isMobile
  };
};

const mapDispatchToProps = (dispatch, state) => ({
  getDashboardConfig: payload => dispatch(getDashboardConfig({ ...payload, key: getStateId(state) })),
  getDashboardTitle: payload => dispatch(getDashboardTitle({ ...payload, key: getStateId(state) })),
  saveDashboardConfig: payload => dispatch(saveDashboardConfig({ ...payload, key: getStateId(state) })),
  initMenuSettings: payload => dispatch(getMenuConfig({ ...payload, key: getStateId(state) })),
  saveMenuConfig: config => dispatch(saveMenuConfig({ config, key: getStateId(state) })),
  setLoading: status => dispatch(setLoading({ status, key: getStateId(state) })),
  resetDashboardConfig: () => dispatch(resetDashboardConfig(getStateId(state)))
});

class Dashboard extends Component {
  state = {
    urlParams: getSortedUrlParams(),
    canDragging: false,
    activeLayoutId: null,
    needGetConfig: false,
    openedTabs: new Set()
  };

  constructor(props) {
    super(props);

    this.state.config = props.config || [];
    this.instanceRecord = Records.get(this.getPathInfo().recordRef);
    this.watcher = this.instanceRecord.watch(['version', 'name'], this.updateSomeDetails);
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};
    const newUrlParams = getSortedUrlParams();
    const firstLayoutId = get(props.config, '[0].id');
    const activeLayoutId = get(queryString.parse(window.location.search), 'activeLayoutId');
    const isExistLayout = isArray(props.config) && !!props.config.find(layout => layout.id === activeLayoutId);

    if (!state.activeLayoutId && !isEmpty(props.config)) {
      newState.activeLayoutId = isExistLayout ? activeLayoutId : firstLayoutId;
    }

    if (JSON.stringify(props.config) !== JSON.stringify(state.config)) {
      newState.config = props.config;
    }

    if (state.urlParams !== newUrlParams) {
      if (!props.enableCache) {
        props.resetDashboardConfig();
      }

      props.initMenuSettings();
      newState.urlParams = newUrlParams;

      if (isDashboard()) {
        newState.needGetConfig = true;
      }
    }

    if (state.urlParams === newUrlParams && props.isLoadingDashboard && !isEmpty(props.config)) {
      props.setLoading(false);
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    if (newState.activeLayoutId) {
      newState.openedTabs = state.openedTabs.add(newState.activeLayoutId);
      Dashboard.updateTabLink();
    }

    return newState;
  }

  static updateTabLink() {
    PageService.changeUrlLink(unescape(`${window.location.pathname}${window.location.search}`), { updateUrl: true });
  }

  componentDidMount() {
    this.getConfig();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return !(nextProps.tabId && !pageTabList.isActiveTab(nextProps.tabId));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.tabList.length) {
      this.toggleTabLayoutFromUrl();
    }

    if (
      this.state.needGetConfig ||
      (!prevProps.tabId && this.props.tabId) ||
      (this.props.enableCache && prevProps.stateKey !== this.props.stateKey)
    ) {
      this.getConfig();
    }

    if (this.state.activeLayoutId !== get(queryString.parse(window.location.search), 'activeLayoutId')) {
      this.setActiveLink(this.state.activeLayoutId);
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  getPathInfo(search = window.location.search) {
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId, dashboardKey } = searchParams;

    return {
      recordRef,
      dashboardId,
      dashboardKey,
      search
    };
  }

  getConfig() {
    const { getDashboardConfig, getDashboardTitle, tabId } = this.props;

    if (tabId && !pageTabList.isActiveTab(tabId)) {
      return;
    }

    const { recordRef } = this.getPathInfo();

    getDashboardConfig({ recordRef });
    getDashboardTitle({ recordRef });

    this.setState({ needGetConfig: false });
  }

  get activeLayout() {
    const { config, activeLayoutId } = this.state;

    if (!isEmpty(config) && isArray(config) && !!activeLayoutId) {
      return config.find(item => item.id === activeLayoutId) || {};
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

  get tabList() {
    const { config } = this.state;

    if (!isEmpty(config) && isArray(config)) {
      return config.map(item => item.tab);
    }

    return [];
  }

  get isShowTabs() {
    return this.tabList.length > 1 && !isMobileAppWebView();
  }

  updateSomeDetails = () => {
    const { getDashboardTitle } = this.props;
    const { recordRef } = this.getPathInfo();

    getDashboardTitle({ recordRef });
  };

  saveDashboardConfig = payload => {
    this.props.saveDashboardConfig && this.props.saveDashboardConfig(payload);
  };

  updateActiveConfig(activeLayout) {
    const { config, activeLayoutId } = this.state;
    const upConfig = deepClone(config, []);

    upConfig.forEach((item, i) => {
      if (item.id === activeLayoutId) {
        upConfig[i] = activeLayout;
      }
    });

    this.setState({ config: upConfig });

    return upConfig;
  }

  prepareWidgetsConfig = (data, dnd) => {
    const activeLayout = deepClone(this.activeLayout, {});
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

  setActiveLink = idLayout => {
    const searchParams = queryString.parse(window.location.search);

    searchParams.activeLayoutId = idLayout;

    this.props.history.push({
      pathname: URL.DASHBOARD,
      search: queryString.stringify(searchParams)
    });

    Dashboard.updateTabLink();
  };

  handleSaveMenu = links => {
    const { saveMenuConfig, menuType } = this.props;

    saveMenuConfig({ type: menuType, links });
  };

  handleSaveWidgetProps = (id, props = {}) => {
    const activeLayout = deepClone(this.activeLayout, {});
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
      if (Array.isArray(column)) {
        column.forEach(eachColumns);
      } else {
        eachColumns(column);
      }
    });
    activeLayout.columns = columns;

    const config = this.updateActiveConfig(activeLayout);

    this.saveDashboardConfig({ config });
  };

  toggleTabLayout = index => {
    const tab = get(this.tabList, [index], {});

    this.setState(state => ({ openedTabs: state.openedTabs.add(tab.idLayout) }));
    this.setActiveLink(tab.idLayout);
  };

  toggleTabLayoutFromUrl = () => {
    const searchParams = queryString.parse(window.location.search);
    const { activeLayoutId } = searchParams;

    if (activeLayoutId !== this.state.activeLayoutId) {
      const tab = this.tabList.find(el => el.idLayout === activeLayoutId);

      if (tab && this.state.activeLayoutId !== activeLayoutId) {
        this.setState(state => ({
          activeLayoutId,
          openedTabs: state.openedTabs.add(activeLayoutId)
        }));
        return;
      }

      if (activeLayoutId && !tab) {
        delete searchParams.activeLayoutId;
        this.props.history.push({
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
    const { activeLayoutId } = this.state;

    if (isMobile) {
      return (
        <div className="ecos-dashboard__tabs ecos-dashboard__tabs_mobile">
          <Tabs items={this.tabList} onClick={this.toggleTabLayout} keyField="idLayout" activeTabKey={activeLayoutId} />
        </div>
      );
    }

    return (
      <div className="ecos-dashboard__tabs-wrapper">
        <ScrollArrow className="ecos-dashboard__tabs-arrows" small>
          <Tabs
            hasHover
            hasHint
            className="ecos-dashboard__tabs-block"
            classNameTab="ecos-dashboard__tabs-item"
            items={this.tabList}
            onClick={this.toggleTabLayout}
            keyField="idLayout"
            activeTabKey={activeLayoutId}
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

    if (menuType !== MENU_TYPE.TOP) {
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
      isLoadingDashboard
    } = this.props;
    const { recordRef } = this.getPathInfo();

    let title = null;

    switch (dashboardType) {
      case DashboardTypes.CASE_DETAILS:
        title = (
          <div className="ecos-dashboard__header-title" key="title">
            <ReactPlaceholder
              type="textRow"
              ready={!!name}
              showLoadingAnimation={true}
              customPlaceholder={
                <div className="ecos-dashboard__header-placeholder">
                  <RectShape color="#b7b7b7" style={{ width: 150, height: 20, borderRadius: 10 }} />
                  <RoundShape color="#b7b7b7" style={{ width: 32, height: 20 }} />
                </div>
              }
            >
              <div className="ecos-dashboard__header-name">{t(name)}</div>
              {version && <Badge text={version} size={isMobile ? 'small' : 'large'} />}
            </ReactPlaceholder>
          </div>
        );
        break;
      case DashboardTypes.PROFILE:
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
      >
        {title}
        {showStatus && (
          <DocStatus
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
    const { menuType, isMobile, tabId } = this.props;
    const { canDragging, activeLayoutId, openedTabs } = this.state;

    return this.tabList.map(tab => {
      const { columns, type } = this.getLayout(tab.idLayout);
      const styles = {};
      const isActive = tab.idLayout === activeLayoutId;

      if (!isActive) {
        styles.display = 'none';
      }

      if (!isActive && !openedTabs.has(tab.idLayout)) {
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
            isActiveLayout={pageTabList.isActiveTab(tabId)}
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
        {this.renderContent()}
        {this.renderLoader()}
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
