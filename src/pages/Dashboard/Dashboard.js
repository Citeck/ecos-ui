import React, { Component } from 'react';
import { connect } from 'react-redux';
import { path } from 'ramda';
import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import { getUserMenuConfig, saveUserMenuConfig } from '../../actions/menu';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';
import { DndUtils } from '../../components/Drag-n-Drop';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    menu: path(['menu', 'user'], state),
    ...path(['dashboard', 'config'], state)
  },
  isLoadingDashboard: path(['dashboard', 'isLoading'], state),
  saveResultDashboard: path(['dashboard', 'saveResult'], state),
  isLoadingMenu: path(['menu', 'isLoading'], state),
  saveResultMenu: path(['menu', 'saveResult'], state)
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: ({ recordId }) => dispatch(getDashboardConfig({ recordId })),
  getUserMenuConfig: () => dispatch(getUserMenuConfig()),
  saveDashboardConfig: config => dispatch(saveDashboardConfig(config)),
  saveUserMenuConfig: config => dispatch(saveUserMenuConfig(config))
});

class Dashboard extends Component {
  get pathInfo() {
    const { url, params } = this.props.match;
    const recordId = params.id;

    return {
      url,
      recordId
    };
  }

  componentDidMount() {
    const { getDashboardConfig, getUserMenuConfig } = this.props;
    const { recordId } = this.pathInfo;

    getDashboardConfig({ recordId });
    getUserMenuConfig();
  }

  prepareWidgetsConfig = (data, dnd) => {
    const {
      config,
      config: { columns }
    } = this.props;
    const { isWidget, columnFrom, columnTo } = data;
    const { source, destination } = dnd;
    let newConfig = { ...config };

    if (isWidget) {
      let widgetsFrom = columns[columnFrom].widgets || [];
      let widgetsTo = columns[columnTo].widgets || [];
      let result = [];

      if (+columnFrom !== +columnTo) {
        result = DndUtils.move(widgetsFrom, widgetsTo, source, destination);
        widgetsFrom = result[source.droppableId];
        widgetsTo = result[destination.droppableId];
      } else {
        widgetsFrom = DndUtils.reorder(widgetsFrom, source, destination);
      }

      newConfig.columns[columnFrom].widgets = widgetsFrom;
      newConfig.columns[columnTo].widgets = widgetsTo;
    }

    this.saveDashboardConfig(newConfig);
  };

  saveDashboardConfig = config => {
    this.props.saveSettings(config);
  };

  saveUserMenuConfig = config => {
    this.props.saveUserMenuConfig(config.menu);
  };

  renderLayout() {
    const {
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} onSaveMenu={this.saveUserMenuConfig} onSaveWidget={this.prepareWidgetsConfig} />;
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
