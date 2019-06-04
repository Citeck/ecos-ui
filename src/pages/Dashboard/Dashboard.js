import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';

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

  renderLayout() {
    const {
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} />;
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
