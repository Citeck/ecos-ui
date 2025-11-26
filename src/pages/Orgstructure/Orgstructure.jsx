import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isNil from 'lodash/isNil';
import * as queryString from 'query-string';
import React from 'react';
import { connect } from 'react-redux';

import { URL, SourcesId } from '../../constants';
import Dashboard from '../Dashboard/Dashboard';

import Structure from './components/Structure';

import { getDashboardConfig, getDashboardTitle, setLoading } from '@/actions/dashboard';
import { setSelectedPerson } from '@/actions/orgstructure';
import { OrgStructApi } from '@/api/orgStruct';
import { DndUtils } from '@/components/Drag-n-Drop';
import Layout from '@/components/Layout';
import { ScrollArrow, Tabs } from '@/components/common';
import { OrgstructProvider } from '@/components/common/Orgstruct/OrgstructContext';
import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  DataTypes,
  GroupTypes,
  ROOT_GROUP_NAME,
  TabTypes
} from '@/components/common/Orgstruct/constants';
import { decodeLink, getSearchParams, getSortedUrlParams, pushHistoryLink, replaceHistoryLink } from '@/helpers/urls';
import { t } from '@/helpers/util';
import DashboardService from '@/services/dashboard';
import PageTabList from '@/services/pageTabs/PageTabList';

import './style.scss';

const api = new OrgStructApi();

const controlProps = {
  label: 'SelectOrgstruct',
  key: 'selectOrgstruct',
  type: 'selectOrgstruct',
  allowedAuthorityTypes: [AUTHORITY_TYPE_USER, AUTHORITY_TYPE_GROUP].join(', '),
  allowedGroupTypes: [GroupTypes.ROLE, GroupTypes.BRANCH].join(', '),
  rootGroupName: ROOT_GROUP_NAME,
  allowedGroupSubTypes: [],
  currentUserByDefault: false,
  excludeAuthoritiesByName: '',
  excludeAuthoritiesByType: [],
  openByDefault: true,
  modalTitle: null,
  isSelectedValueAsText: false,
  hideTabSwitcher: false,
  defaultTab: TabTypes.LEVELS,
  dataType: DataTypes.NODE_REF,
  userSearchExtraFields: '',
  isIncludedAdminGroup: false,
  onError: console.error,
  onChange: () => {},
  multiple: false,
  liveSearch: true
};

const Labels = {
  NO_DATA_TEXT: 'orgstructure-page-no-picked-person-text'
};

const getStateId = state => {
  return state.enableCache ? state.tabId || DashboardService.key : null;
};

class Orgstructure extends React.Component {
  state = {
    urlParams: getSortedUrlParams(),
    activeLayoutId: get(queryString.parse(window.location.search), 'activeLayoutId'),
    activeTab: null
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};
    const newUrlParams = getSortedUrlParams();
    const firstLayoutId = get(props.config, '[0].id');
    const activeTab = get(queryString.parse(window.location.search), 'activeTab', null);
    const activeLayoutId = get(queryString.parse(window.location.search), 'activeLayoutId');

    const isExistLayoutById = isArray(props.config) && !!props.config.find(layout => layout.id === activeLayoutId);
    const isExistLayoutByTab = isArray(props.config) && !isNil(activeTab) && !!props.config[Number(activeTab)];

    if (isNil(state.activeTab) && !isEmpty(props.config)) {
      newState.activeTab = isExistLayoutByTab ? Number(activeTab) : 0;
    }

    if (!state.activeLayoutId && !isEmpty(props.config)) {
      newState.activeLayoutId = isExistLayoutById ? activeLayoutId : firstLayoutId;
    }

    if (JSON.stringify(props.config) !== JSON.stringify(state.config)) {
      newState.config = props.config;
    }

    if (state.urlParams !== newUrlParams) {
      if (!props.enableCache) {
        props.resetDashboardConfig();
      }

      newState.urlParams = newUrlParams;
    }

    if (state.urlParams === newUrlParams && props.isLoadingDashboard && !isEmpty(props.config)) {
      props.setLoading(false);
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    if (!isNil(newState.activeTab)) {
      Dashboard.updateTabLink();
    }

    return newState;
  }

  componentDidMount() {
    const { onSelectPerson, getDashboardConfig, getDashboardTitle, setLoading } = this.props;
    const { recordRef = '' } = getSearchParams() || {};

    setLoading(true);

    if (recordRef && recordRef.startsWith(SourcesId.PERSON)) {
      getDashboardTitle({ recordRef });
      getDashboardConfig({ recordRef });

      onSelectPerson(recordRef);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { recordRef } = this.props;
    const { urlParams, activeTab, config } = this.state;

    if (nextState.urlParams !== urlParams || nextState.activeTab !== activeTab) {
      return true;
    }

    if (!isEqual(nextProps.config, config)) {
      return true;
    }

    if (nextProps.recordRef !== recordRef) {
      return true;
    }

    return false;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { config, recordRef, onSelectPerson } = this.props;

    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.get('recordRef') && !!recordRef) {
      onSelectPerson('');
    }

    if (!isEmpty(config)) {
      const activeTabIndex = get(queryString.parse(decodeLink(window.location.search)), 'activeTab');
      const layoutId = get(queryString.parse(decodeLink(window.location.search)), 'activeLayoutId');
      const isExistLayout = isArray(config) && !isNil(activeTabIndex) && !!config[Number(activeTabIndex)];

      if (!isNil(activeTabIndex) && !isExistLayout) {
        this.toggleToFirstTab();
      }

      if (isNil(activeTabIndex) && !!layoutId) {
        const searchParams = queryString.parse(window.location.search);
        const tabIndex = config.findIndex(layout => layout.id === layoutId);
        searchParams.activeTab = tabIndex === -1 ? 0 : tabIndex;
        delete searchParams.activeLayoutId;

        this.setState(
          {
            activeTab: tabIndex === -1 ? 0 : tabIndex
          },
          () => this.addSearchParams(searchParams)
        );
      }
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

  toggleToFirstTab = () => {
    const { config } = this.props;

    if (!config) {
      return;
    }
    const tabs = config.map((item, index) => ({ ...item.tab, index }));

    this.setActiveLink(0, tabs);
  };

  toggleTabLayout = index => {
    const { config } = this.props;

    if (!config) {
      return null;
    }

    const tabs = config.map((item, index) => ({ ...item.tab, index }));
    const tab = get(tabs, [index], {});
    this.setActiveLink(tab.index, tabs);
  };

  setActiveLink = (activeTabIndex, tabs) => {
    const searchParams = queryString.parse(window.location.search);

    if (tabs && tabs.length > 1) {
      searchParams.activeTab = activeTabIndex;
    }
    const idLayout = get(tabs[Number(activeTabIndex)], 'idLayout');
    this.setState({ activeTab: Number(activeTabIndex), activeLayoutId: idLayout }, () => this.addSearchParams(searchParams));
  };

  addSearchParams = searchParams => {
    const { urlParams } = this.state;
    const prevSearchParams = queryString.parse(urlParams);
    const isEqualLayoutIndexes = get(prevSearchParams, 'activeTab', '') === get(searchParams, 'activeTab');

    if (!urlParams || !isEqualLayoutIndexes) {
      replaceHistoryLink(this.props.history, `${URL.ORGSTRUCTURE}?${decodeLink(queryString.stringify(searchParams))}`, true);
    } else {
      pushHistoryLink(
        undefined,
        {
          pathname: URL.ORGSTRUCTURE,
          search: decodeLink(queryString.stringify(searchParams))
        },
        true
      );
    }

    Dashboard.updateTabLink();
  };

  renderTabs() {
    const { config } = this.props;

    if (!config) {
      return null;
    }
    const tabs = config.map(item => item.tab);

    const { isMobile } = this.props;
    const { activeTab } = this.state;

    if (isMobile) {
      return (
        <div className="ecos-dashboard__tabs ecos-dashboard__tabs_mobile">
          <Tabs
            isMobile
            items={tabs}
            onClick={this.toggleTabLayout}
            keyField="idLayout"
            activeTabKey={get(tabs[Number(activeTab)], 'idLayout')}
          />
        </div>
      );
    }

    return (
      <div className="orgstructure-page__tabs-wrapper">
        <ScrollArrow className="orgstructure-page__tabs-arrows" small>
          <Tabs
            hasHover
            hasHint
            narrow
            className="orgstructure-page__tabs-block"
            classNameTab="orgstructure-page__tabs-item"
            items={tabs}
            onClick={this.toggleTabLayout}
            keyField="idLayout"
            activeTabKey={get(tabs[Number(activeTab)], 'idLayout')}
          />
        </ScrollArrow>
      </div>
    );
  }

  renderDashboard() {
    const { config = {}, menuType, isMobile, tabId, isLoading, recordRef } = this.props;
    const { activeTab } = this.state;
    const activeLayout = config[activeTab];
    if (!recordRef || !activeLayout) {
      return <div className="orgstructure-page__grid-empty-widgets">{t(Labels.NO_DATA_TEXT)}</div>;
    }

    const { columns, type } = activeLayout ? activeLayout : get(config, '0') || {};

    return (
      <div className="orgstructure-page__grid-layout">
        {this.renderTabs()}
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
          onSaveWidget={this.prepareWidgetsConfig}
          onSaveWidgetProps={this.handleSaveWidgetProps}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="orgstructure-page__grid-container">
        <div className="orgstructure-page__grid-main">
          <OrgstructProvider orgStructApi={api} controlProps={controlProps}>
            <Structure tabId={this.props.tabId} toggleToFirstTab={this.toggleToFirstTab} />
          </OrgstructProvider>
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
  setLoading: status => dispatch(setLoading({ status, key: getStateId(state) })),
  getDashboardConfig: ({ recordRef }) => dispatch(getDashboardConfig({ key: state.tabId, recordRef })),
  getDashboardTitle: payload => dispatch(getDashboardTitle({ ...payload, key: getStateId(state) })),
  onSelectPerson: recordRef => dispatch(setSelectedPerson({ recordRef: recordRef, key: state.tabId }))
});

export default connect(mapStateToProps, mapDispatchToProps)(Orgstructure);
