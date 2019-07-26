import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as queryString from 'query-string';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import { getMenuConfig, saveMenuConfig } from '../../actions/menu';
import Layout from '../../components/Layout';
import { DndUtils } from '../../components/Drag-n-Drop';
import TopMenu from '../../components/Layout/TopMenu';
import Loader from '../../components/common/Loader/Loader';
import { MENU_TYPE } from '../../constants';
import { DASHBOARD_TYPE } from '../../constants/dashboard';
import { deepClone, t } from '../../helpers/util';
import { getSortedUrlParams } from '../../helpers/urls';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../constants/pageTabs';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    ...get(state, ['dashboard', 'config'])
  },
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
  initMenuSettings: payload => dispatch(getMenuConfig(payload)),
  saveMenuConfig: config => dispatch(saveMenuConfig(config))
});

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      urlParams: getSortedUrlParams(),
      canDragging: false
    };
  }

  componentDidMount() {
    const { getDashboardConfig, config } = this.props;
    const { recordRef } = this.getPathInfo();

    this.setState({ config });
    getDashboardConfig({ recordRef });
  }

  componentWillReceiveProps(nextProps) {
    const { getDashboardConfig, initMenuSettings, config } = nextProps;
    const { recordRef } = this.getPathInfo(nextProps);
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();

    if (urlParams !== newUrlParams) {
      this.setState({ urlParams: newUrlParams });
      getDashboardConfig({ recordRef });
      initMenuSettings();
    }

    if (JSON.stringify(config) !== JSON.stringify(this.props.config)) {
      this.setState({ config });
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

  renderLayout() {
    const { menuType } = this.props;
    const {
      config: { columns, type },
      canDragging
    } = this.state;

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
      case DASHBOARD_TYPE.CASE_DETAILS:
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
      case DASHBOARD_TYPE.USER:
      case DASHBOARD_TYPE.SITE:
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
