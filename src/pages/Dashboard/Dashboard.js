import React, { Component } from 'react';
import { connect } from 'react-redux';
import { path } from 'ramda';
import { getDashboardConfig, saveDashboardConfig } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import Loader from '../../components/common/Loader/Loader';
import { DndUtils } from '../../components/Drag-n-Drop';

const mapStateToProps = state => ({
  config: {
    menu: path(['app', 'menu'], state),
    ...path(['dashboard', 'config'], state)
  },
  isLoading: path(['dashboard', 'isLoading'], state),
  saveStatus: path(['dashboard', 'saveStatus'], state)
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

  prepareWidgetsConfig = (data, dnd) => {
    const {
      config,
      config: { columns, menu }
    } = this.props;
    const { isWidget, columnFrom, columnTo, id } = data;
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
    this.props.saveDashboardConfig(config);
  };

  renderLayout() {
    const {
      config: { columns, menu }
    } = this.props;

    return <Layout columns={columns} menu={menu} onSaveMenu={this.saveDashboardConfig} onSaveWidget={this.prepareWidgetsConfig} />;
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
