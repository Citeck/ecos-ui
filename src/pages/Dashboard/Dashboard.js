import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';

const mapStateToProps = state => ({
  config: state.dashboard.config,
  isLoading: state.dashboard.isLoading,
  saveStatus: state.dashboard.saveStatus
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: () => dispatch(getDashboardConfig()),
  saveDashboardConfig: config => dispatch(saveDashboardConfig(config))
});

class Dashboard extends Component {
  componentDidMount() {
    const { getDashboardConfig } = this.props;

    getDashboardConfig();
  }

  render() {
    const {
      saveDashboardConfig,
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} saveDashboardConfig={saveDashboardConfig} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
