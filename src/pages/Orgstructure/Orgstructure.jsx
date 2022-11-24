import React from 'react';
import { connect } from 'react-redux';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isArray from 'lodash/isArray';
import classNames from 'classnames';

import Structure from './components/Structure';
import { setOrgstructureConfig, setSelectedPerson } from '../../actions/orgstructure';
import { getSearchParams } from '../../helpers/urls';
import { getDashboardConfig, getDashboardTitle, setDashboardIdentification } from '../../actions/dashboard';
import Layout from '../../components/Layout';
import PageTabList from '../../services/pageTabs/PageTabList';
import { DndUtils } from '../../components/Drag-n-Drop';
import Records from '../../components/Records';
import { t } from '../../helpers/util';
import DashboardService from '../../services/dashboard';

import './style.scss';

const Labels = {
  NO_DATA_TEXT: 'orgstructure-page-no-picked-person-text'
};

const getStateId = state => {
  return state.enableCache ? state.tabId || DashboardService.key : null;
};

class Orgstructure extends React.Component {
  constructor(props) {
    super(props);

    const { recordRef } = getSearchParams() || {};

    this.instanceRecord = Records.get(recordRef);
  }

  componentDidMount() {
    const { onSelectPerson, getDashboardConfig, getDashboardTitle } = this.props;
    const { recordRef } = getSearchParams() || {};

    getDashboardConfig({ recordRef });
    getDashboardTitle({ recordRef });

    if (recordRef) {
      onSelectPerson(recordRef);
    }
  }

  prepareWidgetsConfig = (data, dnd) => {
    const activeLayout = cloneDeep(this.activeLayout);
    const columns = activeLayout.columns || [];

    const { isWidget, columnFrom, columnTo } = data;
    const { source, destination } = dnd;

    if (isWidget) {
      let widgetsFrom = columns[columnFrom].widgets || [];
      let widgetsTo = columns[columnTo].widgets || [];
      let result = [];

      if (+columnFrom !== +columnTo) {
        result = DndUtils.move(widgetsFrom, widgetsTo, source, destination);
        widgetsFrom = result[source.droppableId];
        widgetsTo = result[destination.droppableId];

        activeLayout.columns[columnTo].widgets = widgetsTo;
        activeLayout.columns[columnFrom].widgets = widgetsFrom;
      } else {
        widgetsFrom = DndUtils.reorder(widgetsFrom, data.positionFrom, data.positionTo);
        activeLayout.columns[columnFrom].widgets = widgetsFrom;
      }
    }

    const config = this.updateActiveConfig(activeLayout);

    this.saveDashboardConfig({ config });
  };

  handleSaveWidgetProps = (id, props = {}) => {
    const { configVersion } = this.props;

    if (configVersion) {
      const originalConfig = cloneDeep(this.props.originalConfig);
      const widgets = get(originalConfig, [configVersion, 'widgets'], []);
      const widget = widgets.find(widget => widget.id === id);
      const { recordRef } = this.getPathInfo();

      if (widget) {
        widget.props = {
          ...widget.props,
          ...props
        };
      }

      this.saveDashboardConfig({ config: originalConfig, recordRef });

      return;
    }

    const activeLayout = cloneDeep(this.activeLayout);
    const columns = activeLayout.columns || [];
    const eachColumns = column => {
      const index = column.widgets.findIndex(widget => widget.id === id);

      if (index !== -1) {
        column.widgets[index].props = { ...column.widgets[index].props, ...props };
        return false;
      }

      return true;
    };

    columns.forEach(column => {
      if (isArray(column)) {
        column.forEach(eachColumns);
      } else {
        eachColumns(column);
      }
    });
    activeLayout.columns = columns;

    const config = this.updateActiveConfig(activeLayout);

    this.saveDashboardConfig({ config });
  };

  renderDashboard() {
    const { config } = this.props;
    const { recordRef } = getSearchParams() || {};

    if (!recordRef || !config) {
      return <div className="orgstructure-page__grid__empty-widgets">{t(Labels.NO_DATA_TEXT)}</div>;
    }

    const { menuType, isMobile, tabId, isLoading } = this.props;
    const { columns, type } = get(config, '0') || {};

    return (
      <div className="orgstructure-page__grid__layout">
        <Layout
          className={classNames({ 'ecos-layout_mobile': isMobile })}
          menuType={menuType}
          isMobile={isMobile}
          columns={columns}
          type={type}
          tabId={tabId}
          recordRef={recordRef}
          dashboardId={tabId}
          isActiveLayout={PageTabList.isActiveTab(tabId)}
          isLoading={isLoading}
          // todo: обработчики ниже реализовать по аналогии с Dashboard
          onSaveWidget={this.prepareWidgetsConfig}
          onSaveWidgetProps={this.handleSaveWidgetProps}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="orgstructure-page__grid__container">
        <div className="orgstructure-page__grid__main">
          <Structure tabId={this.props.tabId} />
        </div>

        {this.renderDashboard()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    recordRef: get(state, 'orgstructure.id'),
    config: get(state, ['dashboard', ownProps.tabId, 'config']),
    isLoading: get(state, ['dashboard', ownProps.tabId, 'isLoading'])
  };
};

const mapDispatchToProps = (dispatch, state) => ({
  getDashboardConfig: () => dispatch(getDashboardConfig({ key: state.tabId })),
  onSelectPerson: recordRef => dispatch(setSelectedPerson({ recordRef: recordRef, key: state.tabId })),
  setOrgstructureConfig: config => dispatch(setOrgstructureConfig(config)),
  setDashboardIdentification: payload => dispatch(setDashboardIdentification(payload)),
  getDashboardTitle: payload => dispatch(getDashboardTitle({ ...payload, key: getStateId(state) }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Orgstructure);
