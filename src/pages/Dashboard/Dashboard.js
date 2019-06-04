import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';

const mapStateToProps = state => ({
  config: state.dashboard.config,
  isLoading: state.dashboard.isLoading,
  saveStatus: state.dashboard.saveStatus
});

const mapDispatchToProps = dispatch => ({
  getDashboardConfig: () => dispatch(getDashboardConfig())
});

class Dashboard extends Component {
  componentDidMount() {
    const { getDashboardConfig } = this.props;

    getDashboardConfig();
  }

  render() {
    const {
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);
