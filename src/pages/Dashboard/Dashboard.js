import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as queryString from 'query-string';
import { get, isArray, isEmpty } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';

import { getDashboardConfig, resetDashboardConfig, saveDashboardConfig, setLoading } from '../../actions/dashboard';
import { getMenuConfig, saveMenuConfig } from '../../actions/menu';
import Layout from '../../components/Layout';
import { DndUtils } from '../../components/Drag-n-Drop';
import TopMenu from '../../components/Layout/TopMenu';
import { Loader, ScrollArrow, Tabs } from '../../components/common';
import { MENU_TYPE } from '../../constants';
import { DashboardTypes } from '../../constants/dashboard';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../constants/pageTabs';
import { deepClone, t } from '../../helpers/util';
import { getSortedUrlParams } from '../../helpers/urls';

import './style.scss';

const mapStateToProps = state => ({
  config: get(state, ['dashboard', 'config'], []),
  isLoadingDashboard: get(state, ['dashboard', 'isLoading']),
  saveResultDashboard: get(state, ['dashboard', 'saveResult']),
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  saveResultMenu: get(state, ['menu', 'saveResult']),
  menuType: get(state, ['menu', 'type']),
  links: get(state, ['menu', 'links']),
  dashboardType: get(state, ['dashboard', 'identification', 'type']),
  titleInfo: get(state, ['dashboard', 'titleInfo'])
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: payload => dispatch(getDashboardConfig(payload)),
  saveDashboardConfig: payload => dispatch(saveDashboardConfig(payload)),
  resetDashboardConfig: payload => dispatch(resetDashboardConfig(payload)),
  initMenuSettings: payload => dispatch(getMenuConfig(payload)),
  saveMenuConfig: config => dispatch(saveMenuConfig(config)),
  setLoading: flag => dispatch(setLoading(flag))
});

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      urlParams: getSortedUrlParams(),
      canDragging: false,
      activeLayoutId: null
    };
  }

  componentDidMount() {
    const { getDashboardConfig } = this.props;
    const { recordRef } = this.getPathInfo();

    getDashboardConfig({ recordRef });
  }

  componentWillReceiveProps(nextProps) {
    const { initMenuSettings, config, isLoadingDashboard, getDashboardConfig, resetDashboardConfig, setLoading } = nextProps;
    const { recordRef } = this.getPathInfo(nextProps);
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();

    if (urlParams !== newUrlParams) {
      this.setState({ urlParams: newUrlParams });
      resetDashboardConfig();
      getDashboardConfig({ recordRef });
      initMenuSettings();
    } else if (urlParams === newUrlParams && isLoadingDashboard && !isEmpty(config)) {
      setLoading(false);
    }

    if (JSON.stringify(config) !== JSON.stringify(this.props.config)) {
      this.setState({ config, activeLayoutId: get(config, '[0].id') });
    }
  }

  getPathInfo(props) {
    const {
      location: { search }
    } = props || this.props;
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId } = searchParams;

    return {
      recordRef,
      dashboardId,
      search
    };
  }

  get wrapperStyle() {
    const tabs = document.querySelector('.page-tab');
    const alfrescoHeader = document.querySelector('#alf-hd');
    const alfrescoFooter = document.querySelector('#alf-ft');
    let height = ['3px'];

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

    if (alfrescoFooter) {
      const style = window.getComputedStyle(alfrescoFooter);
      const outerHeight = alfrescoFooter.clientHeight + parseInt(style['margin-top'], 10) + parseInt(style['margin-bottom'], 10);

      height.push(`${outerHeight}px`);
    }

    return { height: `calc(100vh - (${height.join(' + ')}))` };
  }

  get activeLayout() {
    const { config, activeLayoutId } = this.state;

    if (!isEmpty(config) && isArray(config) && !!activeLayoutId) {
      return config.find(item => item.tab.idLayout === activeLayoutId);
    }

    return {};
  }

  get tabList() {
    const { config } = this.state;

    if (!isEmpty(config) && isArray(config)) {
      return config.map((item, index) => item.tab);
    }

    return [];
  }

  prepareWidgetsConfig = (data, dnd) => {
    const {
      config: currentConfig,
      config: { columns }
    } = this.state;
    const { isWidget, columnFrom, columnTo } = data;
    const { source, destination } = dnd;
    const config = JSON.parse(JSON.stringify(currentConfig));

    if (isWidget) {
      let widgetsFrom = columns[columnFrom].widgets || [];
      let widgetsTo = columns[columnTo].widgets || [];
      let result = [];

      if (+columnFrom !== +columnTo) {
        result = DndUtils.move(widgetsFrom, widgetsTo, source, destination);
        widgetsFrom = result[source.droppableId];
        widgetsTo = result[destination.droppableId];
        config.columns[columnTo].widgets = widgetsTo;
        config.columns[columnFrom].widgets = widgetsFrom;
      } else {
        widgetsFrom = DndUtils.reorder(widgetsFrom, data.positionFrom, data.positionTo);
        config.columns[columnFrom].widgets = widgetsFrom;
      }
    }

    this.setState({ config });
    this.saveDashboardConfig({ config });
  };

  saveDashboardConfig = payload => {
    this.props.saveDashboardConfig(payload);
  };

  handleSaveMenu = links => {
    const { saveMenuConfig, menuType } = this.props;

    saveMenuConfig({ type: menuType, links });
  };

  handleSaveWidgetProps = (id, props = {}) => {
    const config = deepClone(this.state.config);

    config.columns.forEach(column => {
      const index = column.widgets.findIndex(widget => widget.id === id);

      if (index !== -1) {
        column.widgets[index].props = { ...column.widgets[index].props, ...props };
        return false;
      }

      return true;
    });

    this.setState({ config });
    this.saveDashboardConfig({ config });
  };

  toggleTabLayout = index => {
    const tab = get(this.tabList, [index], {});

    this.setState({ activeLayoutId: tab.idLayout });
  };

  renderTabs() {
    if (this.tabList.length < 2) {
      return null;
    }

    const { activeLayoutId } = this.state;

    return (
      <ScrollArrow className="ecos-dashboard__tabs">
        <Tabs hasHover items={this.tabList} onClick={this.toggleTabLayout} keyField={'idLayout'} activeTabKey={activeLayoutId} />
      </ScrollArrow>
    );
  }

  renderLayout() {
    const { menuType } = this.props;
    const { canDragging } = this.state;
    const { columns, type } = this.activeLayout;

    return (
      <Layout
        columns={columns}
        onSaveWidget={this.prepareWidgetsConfig}
        type={type}
        menuType={menuType}
        onSaveWidgetProps={this.handleSaveWidgetProps}
        canDragging={canDragging}
      />
    );
  }

  renderTopMenu() {
    const { menuType, isLoadingMenu, links } = this.props;

    if (menuType !== MENU_TYPE.TOP) {
      return null;
    }

    return <TopMenu isShow isSortable isLoading={isLoadingMenu} links={links} onSave={this.handleSaveMenu} />;
  }

  renderHeader() {
    const {
      titleInfo: { modifierName = '', modifierUrl = '', date = '', name = '', version = '' },
      dashboardType
    } = this.props;
    let title = null;

    switch (dashboardType) {
      case DashboardTypes.CASE_DETAILS:
        title = (
          <React.Fragment>
            <div className="ecos-dashboard__header-title" key="title">
              {name && <div className="ecos-dashboard__header-name">{t(name)}</div>}
              {version && <div className="ecos-dashboard__header-version">{version}</div>}
            </div>

            <div className="ecos-dashboard__header-mod" key="subtitle">
              {t('cardlet.node-header.modified-by-user')}
              {modifierName && (
                <a
                  {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ecos-dashboard__header-user"
                  href={modifierUrl}
                  title={t(`Открыть профиль ${modifierName}`)}
                >
                  {modifierName}
                </a>
              )}
              {date && (
                <span className="ecos-dashboard__header-date">
                  {t('cardlet.node-header.modified-on')} {t(date)}
                </span>
              )}
            </div>
          </React.Fragment>
        );
        break;
      case DashboardTypes.USER:
      case DashboardTypes.SITE:
      default:
        title = <div className="ecos-dashboard__header-title">{name && <div className="ecos-dashboard__header-name">{t(name)}</div>}</div>;
        break;
    }

    return <div className="ecos-dashboard__header">{title}</div>;
  }

  renderLoader() {
    if (this.props.isLoadingDashboard) {
      return <Loader blur height={100} width={100} />;
    }

    return null;
  }

  render() {
    return (
      <div style={this.wrapperStyle}>
        <Scrollbars
          style={{ height: '100%' }}
          renderTrackHorizontal={props => <div {...props} hidden />}
          renderThumbHorizontal={props => <div {...props} hidden />}
        >
          {this.renderTopMenu()}
          {this.renderHeader()}
          {this.renderTabs()}
          {this.renderLayout()}
          {this.renderLoader()}
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
