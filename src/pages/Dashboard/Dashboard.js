import React, { Component } from 'react';
import { connect } from 'react-redux';
import { path } from 'ramda';
import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';

const mapStateToProps = state => ({
  config: {
    menu: path(['app', 'menu'], state),
    ...path(['dashboard', 'config'], state)
  },
  isLoading: state.dashboard.isLoading,
  saveStatus: state.dashboard.saveStatus
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: ({ recordId, key }) => dispatch(getDashboardConfig({ recordId, key })),
  saveDashboardConfig: config => dispatch(saveDashboardConfig(config))
});

class Dashboard extends Component {
  static get pathInfo() {
    const path = window.location.href;
    const recordId = 123,
      key = '232f6349-9a07-49a9-baf0-9468d41e078e'; //fixme from url?

    return {
      path,
      recordId,
      key
    };
  }

  componentDidMount() {
    const { getDashboardConfig } = this.props;
    const { recordId, key } = Dashboard.pathInfo;

    getDashboardConfig({ recordId, key });
  }

  prepareWidgetsConfig = dataWidget => {
    const {
      saveDashboardConfig,
      config,
      config: { columns, menu }
    } = this.props;
    let widgetsFrom = columns[dataWidget.columnFrom].widgets || [];
    let widgetIndex = widgetsFrom.findIndex(item => item.id === dataWidget.id);
    let widget = widgetsFrom.splice(widgetIndex, 1);
    let newConfig = { ...config };

    newConfig.columns[dataWidget.columnFrom].widgets = widgetsFrom;
    newConfig.columns[dataWidget.columnTo].widgets.push(widget[0]); //fixme order

    saveDashboardConfig(newConfig);
  };

  renderLayout() {
    const {
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} saveDashboardConfig={this.prepareWidgetsConfig} />;
  }

  renderLoader() {
    let { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader className={`ecos-dashboard__loader-wrapper`} />;
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
