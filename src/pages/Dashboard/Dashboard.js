import React, { Component } from 'react';
import { connect } from 'react-redux';
import { path } from 'ramda';
import queryString from 'query-string';
import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';
import { DndUtils } from '../../components/Drag-n-Drop';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    ...path(['dashboard', 'config'], state)
  },
  isLoadingDashboard: path(['dashboard', 'isLoading'], state),
  saveResultDashboard: path(['dashboard', 'saveResult'], state),
  dashboardId: path(['dashboard', 'config', 'dashboardId'], state),
  isLoadingMenu: path(['menu', 'isLoading'], state),
  saveResultMenu: path(['menu', 'saveResult'], state)
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: payload => dispatch(getDashboardConfig(payload)),
  saveDashboardConfig: payload => dispatch(saveDashboardConfig(payload))
});

class Dashboard extends Component {
  state = {
    dashboardId: ''
  };

  componentDidMount() {
    const { getDashboardConfig } = this.props;
    const { recordRef, dashboardId } = this.pathInfo;

    this.setState({ dashboardId });
    getDashboardConfig({ recordRef, dashboardId });
  }

  componentWillReceiveProps(nextProps) {
    const {
      location: { search },
      getDashboardConfig
    } = nextProps;
    const { dashboardId, recordRef } = queryString.parse(search);
    const { dashboardId: oldDashboardId } = this.state;

    if (dashboardId !== oldDashboardId) {
      this.setState({ dashboardId });
      getDashboardConfig({ recordRef, dashboardId });
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

  prepareWidgetsConfig = (data, dnd) => {
    const {
      config: currentConfig,
      config: { columns }
    } = this.props;
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

    this.saveDashboardConfig({ config, dashboardId });
  };

  saveDashboardConfig = payload => {
    this.props.saveDashboardConfig(payload);
  };

  renderLayout() {
    const {
      config: { columns, type }
    } = this.props;

    return <Layout columns={columns} onSaveWidget={this.prepareWidgetsConfig} type={type} />;
  }

  renderLoader() {
    let { isLoadingDashboard, isLoadingMenu } = this.props;

    if (isLoadingDashboard || isLoadingMenu) {
      return <Loader className={`ecos-dashboard__loader-wrapper`} />;
    }

    return null;
  }

  render() {
    return (
      <React.Fragment>
        {this.renderLoader()}
        {this.renderLayout()}
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
