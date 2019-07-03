import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as queryString from 'query-string';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import { getMenuConfig, saveMenuConfig } from '../../actions/menu';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';
import { DndUtils } from '../../components/Drag-n-Drop';
import TopMenu from '../../components/Layout/TopMenu';
import { MENU_TYPE } from '../../constants';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    ...get(state, ['dashboard', 'config'])
  },
  isLoadingDashboard: get(state, ['dashboard', 'isLoading']),
  saveResultDashboard: get(state, ['dashboard', 'saveResult']),
  dashboardId: get(state, ['dashboard', 'config', 'dashboardId']),
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  saveResultMenu: get(state, ['menu', 'saveResult']),
  menuType: get(state, ['menu', 'type']),
  links: get(state, ['menu', 'links'])
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
      dashboardId: '',
      config: props.config
    };
  }

  componentDidMount() {
    const { getDashboardConfig, config } = this.props;
    const { recordRef, dashboardId } = this.pathInfo;

    this.setState({ dashboardId, config });
    getDashboardConfig({ recordRef, dashboardId });
  }

  componentWillReceiveProps(nextProps) {
    const {
      location: { search },
      getDashboardConfig,
      initMenuSettings,
      config
    } = nextProps;
    const { dashboardId, recordRef } = queryString.parse(search);
    const { dashboardId: oldDashboardId } = this.state;

    if (dashboardId !== oldDashboardId) {
      this.setState({ dashboardId });
      getDashboardConfig({ recordRef, dashboardId });
      initMenuSettings();
    }

    if (JSON.stringify(config) !== JSON.stringify(this.props.config)) {
      this.setState({ config });
    }
  }

  get pathInfo() {
    const {
      location: { search }
    } = this.props;
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId } = searchParams;

    return {
      recordRef,
      dashboardId
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
    const { dashboardId } = this.pathInfo;
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
    this.saveDashboardConfig({ config, dashboardId });
  };

  saveDashboardConfig = payload => {
    this.props.saveDashboardConfig(payload);
  };

  handleSaveMenu = links => {
    const { saveMenuConfig, menuType } = this.props;

    saveMenuConfig({ type: menuType, links });
  };

  renderLayout() {
    const {
      config: { columns, type }
    } = this.state;

    return <Layout columns={columns} onSaveWidget={this.prepareWidgetsConfig} type={type} />;
  }

  renderLoader() {
    let { isLoadingDashboard, isLoadingMenu } = this.props;

    if (isLoadingDashboard || isLoadingMenu) {
      return <Loader className={`ecos-dashboard__loader-wrapper`} />;
    }

    return null;
  }

  renderTopMenu() {
    const { menuType, isLoadingMenu, links } = this.props;

    if (menuType !== MENU_TYPE.TOP) {
      return null;
    }

    return <TopMenu isShow isSortable isLoading={isLoadingMenu} links={links} onSave={this.handleSaveMenu} />;
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
          {this.renderLoader()}
          {this.renderLayout()}
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
