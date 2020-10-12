import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import isNull from 'lodash/isNull';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import find from 'lodash/find';
import * as queryString from 'query-string';
import { Col, Container, Row } from 'reactstrap';

import { decodeLink, getSortedUrlParams } from '../../helpers/urls';
import { DndUtils } from '../../components/Drag-n-Drop';
import pageTabList from '../../services/pageTabs/PageTabList';
import { arrayCompare, deepClone, t } from '../../helpers/util';
import { RequestStatuses, URL } from '../../constants';
import { clearCache } from '../../components/ReactRouterCache';
import DashboardService from '../../services/dashboard';
import { removeItems } from '../../helpers/ls';
import UserLocalSettingsService from '../../services/userLocalSettings';

import { Layouts, LayoutTypes } from '../../constants/layout';
import { DashboardTypes, DeviceTabs } from '../../constants/dashboard';
import DashboardSettingsConverter from '../../dto/dashboardSettings';
import SetBind from './SetBind';
import { Loader, Tabs } from '../../components/common';
import cloneDeep from 'lodash/cloneDeep';
import SetTabs from './SetTabs';
import SetLayouts from './SetLayouts';
import SetWidgets from './SetWidgets';
import PageService from '../../services/PageService';
import { Btn } from '../../components/common/btns';
import { TunableDialog } from '../../components/common/dialogs';

const DESK_VER = find(DeviceTabs, ['key', 'desktop']);

const findLayout = type => Layouts.find(layout => layout.type === type) || {};

class Settings extends Component {
  static propTypes = {
    identification: PropTypes.object,
    userData: PropTypes.object,
    config: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        widgets: PropTypes.array,
        tab: PropTypes.object
      })
    ),
    mobileConfig: PropTypes.array,
    availableWidgets: PropTypes.array,
    dashboardKeyItems: PropTypes.array,
    requestResult: PropTypes.object,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    identification: {},
    userData: {},
    config: [],
    mobileConfig: [],
    availableWidgets: [],
    dashboardKeyItems: [],
    requestResult: {}
  };

  state = {
    selectedDashboardKey: '',
    isForAllUsers: false,

    activeDeviceTabId: DESK_VER.key,

    tabs: [],
    mobileTabs: [],

    activeLayoutTabId: null,
    mobileActiveLayoutTabId: null,

    selectedLayout: {},

    selectedWidgets: {},
    mobileSelectedWidgets: {},

    urlParams: getSortedUrlParams(),

    removedWidgets: []
  };

  constructor(props) {
    super(props);

    const state = {
      ...this.state,
      availableWidgets: DndUtils.setDndId(props.availableWidgets)
    };

    this.state = {
      ...state,
      ...this.setStateConfig(props),
      ...this.setStateMobileConfig(props)
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    this.props.resetConfig();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.tabId && !pageTabList.isActiveTab(nextProps.tabId)) {
      return false;
    }

    return true;
  }

  componentWillReceiveProps(nextProps) {
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();
    let { config, mobileConfig, availableWidgets } = this.props;
    let state = {};

    if (!pageTabList.isActiveTab(nextProps.tabId)) {
      return;
    }

    if (decodeLink(urlParams) !== decodeLink(newUrlParams)) {
      this.setState({ urlParams: newUrlParams }, () => {
        this.fetchData(nextProps);
      });
    }

    if (JSON.stringify(config) !== JSON.stringify(nextProps.config)) {
      const resultConfig = this.setStateConfig(nextProps);

      state = { ...state, ...resultConfig };
    }

    if (JSON.stringify(mobileConfig) !== JSON.stringify(nextProps.mobileConfig)) {
      const resultConfig = this.setStateMobileConfig(nextProps);

      state = { ...state, ...resultConfig };
    }

    if (
      !arrayCompare(availableWidgets, nextProps.availableWidgets) ||
      !arrayCompare(nextProps.availableWidgets, this.state.availableWidgets, 'name')
    ) {
      state.availableWidgets = DndUtils.setDndId(nextProps.availableWidgets);
    }

    this.setState({ ...state });
  }

  componentDidUpdate(prevProps, prevState) {
    this.checkRequestResult(prevProps);
  }

  fetchData(props = this.props) {
    const { initSettings } = props;
    const { recordRef, dashboardId } = this.getPathInfo();

    console.warn({ recordRef, dashboardId });

    if (!dashboardId || !pageTabList.isActiveTab(props.tabId)) {
      return;
    }

    initSettings({ recordRef, dashboardId });
  }

  setStateConfig(props) {
    const selectedDashboardKey = get(props, 'identification.key', '');
    const isForAllUsers = isNull(get(props, 'identification.user', null));
    const { config } = props;

    let activeLayoutTabId = null;
    let tabs = [];
    let selectedLayout = {};
    let selectedWidgets = {};

    if (!isEmpty(config) && isArray(config)) {
      activeLayoutTabId = config[0].id;

      config.forEach(item => {
        let idLayout = item.id;

        tabs.push(item.tab);
        selectedLayout[idLayout] = item.type;

        let layout = findLayout(item.type);
        let widgets = this.setSelectedWidgets(layout, item.widgets);

        widgets.map(item => DndUtils.setDndId(item));
        selectedWidgets[idLayout] = widgets;
      });
    }

    return { selectedLayout, selectedWidgets, tabs, activeLayoutTabId, selectedDashboardKey, isForAllUsers };
  }

  setStateMobileConfig(props) {
    const { mobileConfig } = props;
    let mobileActiveLayoutTabId = null;
    let mobileTabs = [];
    let mobileSelectedWidgets = {};

    if (!isEmpty(mobileConfig) && isArray(mobileConfig)) {
      mobileActiveLayoutTabId = mobileConfig[0].id;

      mobileConfig.forEach(item => {
        let idLayout = item.id;

        mobileTabs.push(item.tab);

        let layout = findLayout(item.type);
        let widgets = this.setSelectedWidgets(layout, item.widgets);

        widgets.map(item => DndUtils.setDndId(item));
        mobileSelectedWidgets[idLayout] = widgets;
      });
    }

    return { mobileSelectedWidgets, mobileTabs, mobileActiveLayoutTabId };
  }

  setSelectedWidgets(item, availableWidgets) {
    const columns = item ? item.columns || [] : [];
    const newWidgets = new Array([].concat.apply([], columns).length);

    newWidgets.fill([]);
    newWidgets.forEach((value, index) => {
      if (availableWidgets && index < availableWidgets.length) {
        newWidgets[index] = availableWidgets[index] || [];
      }
    });

    return newWidgets;
  }

  checkRequestResult(prevProps) {
    const oldRStatus = get(prevProps, 'requestResult.status', null);
    const newRStatus = get(this.props, 'requestResult.status', null);
    const oldSaveWay = get(prevProps, 'requestResult.saveWay', null);
    const checkResult = get(this.props, 'requestResult', {});
    const newSaveWay = checkResult.saveWay;

    if (newRStatus && oldRStatus !== newRStatus && newRStatus === RequestStatuses.SUCCESS) {
      clearCache();
      this.clearLocalStorage();
      this.closePage(this.props);
    } else if (newSaveWay && oldSaveWay !== newSaveWay && newSaveWay !== DashboardService.SaveWays.CONFIRM) {
      this.acceptChanges(checkResult.dashboardId);
    }
  }

  clearLocalStorage = () => {
    const { removedWidgets } = this.state;

    removeItems(removedWidgets.map(id => UserLocalSettingsService.getDashletKey(id)));
  };

  getPathInfo() {
    return queryString.parse(decodeLink(this.state.urlParams));
  }

  getUrlToDashboard() {
    const { recordRef } = this.getPathInfo();
    const pathDashboardParams = {};

    if (recordRef) {
      pathDashboardParams.recordRef = recordRef;
    }

    return URL.DASHBOARD + (isEmpty(pathDashboardParams) ? '' : `?${queryString.stringify(pathDashboardParams)}`);
  }

  get selectedTypeLayout() {
    return findLayout(this.activeData.layout);
  }

  get activeData() {
    const { activeLayoutTabId, selectedWidgets, selectedLayout, mobileActiveLayoutTabId, mobileSelectedWidgets } = this.state;

    return {
      widgets: this.isSelectedMobileVer
        ? get(mobileSelectedWidgets, mobileActiveLayoutTabId, [])
        : get(selectedWidgets, activeLayoutTabId, []),
      layout: this.isSelectedMobileVer ? LayoutTypes.MOBILE : get(selectedLayout, activeLayoutTabId, '')
    };
  }

  get isUserType() {
    return [DashboardTypes.USER].includes(get(this, 'props.identification.type', ''));
  }

  get isSelectedMobileVer() {
    return find(DeviceTabs, ['key', 'mobile']).key === this.state.activeDeviceTabId;
  }

  get availableWidgets() {
    const { availableWidgets, selectedWidgets, tabs } = this.state;
    const isMobile = this.isSelectedMobileVer;

    if (!isMobile) {
      return availableWidgets;
    }

    return DashboardSettingsConverter.getSelectedWidgetsFromDesktop(selectedWidgets, tabs);
  }

  renderHeader() {
    let title = '';

    switch (get(this, 'props.identification.type', '')) {
      case DashboardTypes.USER:
        title = t('dashboard-settings.page-title');
        break;
      case DashboardTypes.CASE_DETAILS:
        title = t('dashboard-settings.card-settings');
        break;
      default:
        title = t('dashboard-settings.page-display-settings');
        break;
    }
    return (
      <Row>
        <Col md={12}>
          <div className="ecos-dashboard-settings__header">{title}</div>
        </Col>
      </Row>
    );
  }

  renderOwnershipBlock() {
    const { dashboardKeyItems, userData, resetConfigToDefault, isDefaultConfig } = this.props;
    const { selectedDashboardKey, isForAllUsers } = this.state;
    const { recordRef } = this.getPathInfo();

    const setData = data => {
      this.setState(data);
    };

    const reset = () => {
      resetConfigToDefault({ recordRef });
    };

    return (
      <div className="ecos-dashboard-settings__container">
        <SetBind
          keys={dashboardKeyItems}
          selectedDashboardKey={selectedDashboardKey}
          isAdmin={userData.isAdmin}
          isForAllUsers={isForAllUsers}
          isDefaultConfig={isDefaultConfig}
          setData={setData}
          resetConfig={reset}
        />
      </div>
    );
  }

  renderDeviceTabsBlock() {
    const { activeDeviceTabId } = this.state;

    const toggleTab = index => {
      const tab = DeviceTabs[index];

      if (tab.key !== activeDeviceTabId) {
        this.setState({ activeDeviceTabId: tab.key });
      }
    };

    return (
      <Tabs
        hasHover
        className="ecos-dashboard-settings__device-tabs"
        classNameTab="ecos-dashboard-settings__device-tabs-item"
        items={DeviceTabs.map(item => ({ ...item, label: t(item.label) }))}
        onClick={toggleTab}
        activeTabKey={activeDeviceTabId}
        keyField="key"
      />
    );
  }

  renderLayoutTabsBlock() {
    if (this.isUserType) {
      return null;
    }

    const isMob = this.isSelectedMobileVer;
    const state = {};

    const setData = ({ tabs, activeTabKey, removedTab }) => {
      if (isMob) {
        if (!isEmpty(tabs)) {
          state.mobileTabs = tabs;
        }

        if (!isEmpty(activeTabKey)) {
          state.mobileActiveLayoutTabId = activeTabKey;
        }
      } else {
        if (!isEmpty(tabs)) {
          state.tabs = tabs;
        }

        if (!isEmpty(activeTabKey)) {
          state.activeLayoutTabId = activeTabKey;
        }

        if (!isEmpty(removedTab)) {
          const { removedWidgets } = this.state;
          const selectedWidgets = cloneDeep(this.state.selectedWidgets);
          const tab = selectedWidgets[removedTab];

          delete selectedWidgets[removedTab];

          tab.forEach(column => {
            column.forEach(widget => {
              removedWidgets.push(widget.id);
            });
          });

          state.selectedWidgets = selectedWidgets;
          state.removedWidgets = removedWidgets;
        }
      }
      this.setState(state);
    };

    const { tabs, activeLayoutTabId, mobileActiveLayoutTabId, mobileTabs } = this.state;

    const currentTabs = isMob ? mobileTabs : tabs;
    const active = isMob ? mobileActiveLayoutTabId : activeLayoutTabId;

    return <SetTabs tabs={currentTabs} activeTabKey={active} setData={setData} />;
  }

  renderLayoutsBlock() {
    const {
      identification: { type }
    } = this.props;
    const setData = layout => {
      const { activeLayoutTabId, selectedWidgets, selectedLayout } = deepClone(this.state);

      selectedLayout[activeLayoutTabId] = layout.type;
      selectedWidgets[activeLayoutTabId] = this.setSelectedWidgets(layout, selectedWidgets[activeLayoutTabId]);

      this.setState({ selectedWidgets, selectedLayout });
    };

    return <SetLayouts dashboardType={type} activeLayout={this.activeData.layout} setData={setData} isMobile={this.isSelectedMobileVer} />;
  }

  handleRemoveMobileWidgets = (widgets = this.state.removedWidgets) => {
    const { mobileSelectedWidgets } = this.state;

    Object.keys(mobileSelectedWidgets).forEach(key => {
      if (mobileSelectedWidgets[key].length) {
        mobileSelectedWidgets[key][0] = mobileSelectedWidgets[key][0].filter(widget => !widgets.includes(widget.id));
      }
    });

    this.setState({ mobileSelectedWidgets });
  };

  renderWidgetsBlock() {
    const { activeLayoutTabId, selectedWidgets, mobileSelectedWidgets, mobileActiveLayoutTabId } = this.state;
    const isMob = this.isSelectedMobileVer;

    const setData = (data, removedWidgets) => {
      if (isMob) {
        mobileSelectedWidgets[mobileActiveLayoutTabId] = data;
        this.setState({ mobileSelectedWidgets });
      } else {
        selectedWidgets[activeLayoutTabId] = data;
        this.setState({ selectedWidgets });
      }

      if (removedWidgets) {
        this.setState({ removedWidgets });

        this.handleRemoveMobileWidgets(removedWidgets);
      }
    };

    return (
      <SetWidgets
        availableWidgets={this.availableWidgets}
        activeWidgets={this.activeData.widgets}
        columns={this.selectedTypeLayout.columns}
        setData={setData}
        isMobile={isMob}
      />
    );
  }

  handleCloseSettings = () => {
    this.closePage();
  };

  handleCheckChanges = () => {
    const { checkUpdatedSettings } = this.props;
    const { selectedDashboardKey: dashboardKey, isForAllUsers } = this.state;

    checkUpdatedSettings({ isForAllUsers, dashboardKey });
  };

  acceptChanges = checkResultId => {
    const { saveSettings, identification, userData } = this.props;
    const { recordRef } = this.getPathInfo();

    const {
      selectedWidgets: widgets,
      selectedLayout: layoutType,
      selectedDashboardKey: dashboardKey,
      tabs,
      isForAllUsers,
      mobileSelectedWidgets,
      mobileTabs
    } = this.state;
    const userName = isForAllUsers ? null : identification.user || userData.userName;
    const newIdentification = { user: userName, key: dashboardKey, id: checkResultId };

    saveSettings({
      newIdentification,
      layoutType,
      widgets,
      tabs,
      recordRef,
      mobile: {
        widgets: mobileSelectedWidgets,
        tabs: mobileTabs
      }
    });
  };

  closePage = () => {
    const urlGoTo = this.getUrlToDashboard();

    this.props.getAwayFromPage();
    PageService.changeUrlLink(urlGoTo, { openNewTab: true, closeActiveTab: true });
  };

  renderButtons() {
    const { identification } = this.props;

    return (
      <div className="ecos-dashboard-settings__actions">
        <Btn className="ecos-btn_x-step_10" onClick={this.handleCloseSettings}>
          {t('dashboard-settings.button.cancel')}
        </Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleCheckChanges} disabled={!get(identification, 'key')}>
          {t('dashboard-settings.button.save')}
        </Btn>
      </div>
    );
  }

  renderDialogs() {
    const { setCheckUpdatedConfig, requestResult } = this.props;

    if (requestResult.saveWay === DashboardService.SaveWays.CONFIRM) {
      const handleReplace = () => {
        setCheckUpdatedConfig({ ...requestResult, saveWay: DashboardService.SaveWays.UPDATE });
      };

      const handleCancel = () => {
        setCheckUpdatedConfig({});
      };

      return (
        <TunableDialog
          isOpen
          onClose={handleCancel}
          title={t('dashboard-settings.confirm-changes')}
          content={t('dashboard-settings.already-exists')}
          footer={[
            <Btn key="handleCancel" onClick={handleCancel}>
              {t('dashboard-settings.cancel')}
            </Btn>,
            <Btn key="handleReplace" onClick={handleReplace} className="ecos-btn_blue">
              {t('dashboard-settings.replace')}
            </Btn>
          ]}
        />
      );
    }

    return null;
  }

  renderLoader() {
    let { isLoading } = this.props;

    if (isLoading) {
      return <Loader height={100} width={100} className="ecos-dashboard-settings__loader-wrapper" blur />;
    }

    return null;
  }

  render() {
    return (
      <Container className="ecos-dashboard-settings">
        {this.renderLoader()}
        {this.renderHeader()}
        {this.renderOwnershipBlock()}
        {this.renderDeviceTabsBlock()}
        {this.renderLayoutTabsBlock()}
        <div className="ecos-dashboard-settings__container">
          {this.renderLayoutsBlock()}
          {this.renderWidgetsBlock()}
          {this.renderButtons()}
        </div>
        {this.renderDialogs()}
      </Container>
    );
  }
}

export default Settings;
