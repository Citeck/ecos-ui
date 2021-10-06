import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isNull from 'lodash/isNull';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';
import last from 'lodash/last';
import { Container } from 'reactstrap';

import {
  getCheckUpdatedDashboardConfig,
  initDashboardSettings,
  resetConfigToDefault,
  resetDashboardConfig,
  saveDashboardConfig,
  setCheckUpdatedDashboardConfig
} from '../../actions/dashboardSettings';
import { getDashboardConfig as getDashboardConfigPage, resetAllDashboardsConfig } from '../../actions/dashboard';
import { selectStateByKey } from '../../selectors/dashboardSettings';
import { decodeLink, getSearchParams, getSortedUrlParams, SearchKeys } from '../../helpers/urls';
import { t } from '../../helpers/util';
import { removeItems } from '../../helpers/ls';
import { RequestStatuses } from '../../constants';
import { DefaultWidgetsByLayout, Layouts, LayoutTypes } from '../../constants/layout';
import { DashboardTypes, DeviceTabs } from '../../constants/dashboard';
import DashboardSettingsConverter from '../../dto/dashboardSettings';
import DashboardService from '../../services/dashboard';
import PageTabList from '../../services/pageTabs/PageTabList';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { DndUtils } from '../../components/Drag-n-Drop';
import { Loader, Tabs } from '../../components/common';
import { Btn } from '../../components/common/btns';
import { TunableDialog } from '../../components/common/dialogs';
import { clearCache } from '../ReactRouterCache';

import SetBind from './parts/SetBind';
import SetTabs from './parts/SetTabs';
import SetLayouts from './parts/SetLayouts';
import SetWidgets from './parts/SetWidgets';

import './style.scss';

const DESK_VER = find(DeviceTabs, ['key', 'desktop']);

const findLayout = type => Layouts.find(layout => layout.type === type) || {};

export const getStateId = props => get(getSearchParams(), SearchKeys.DASHBOARD_ID, props.tabId || 'base');

const Labels = {
  USER_TITLE: 'dashboard-settings.page-title',
  CARD_TITLE: 'dashboard-settings.card-settings',
  DEFAULT_TITLE: 'dashboard-settings.page-display-settings',
  SPEC_ID: 'dashboard-settings.spec.id',
  BTN_CANCEL: 'dashboard-settings.button.cancel',
  BTN_SAVE: 'dashboard-settings.button.save',
  DIALOG_CONFIRM_TITLE: 'dashboard-settings.confirm-changes',
  DIALOG_BOARD_EXISTS: 'dashboard-settings.already-exists',
  DIALOG_BTN_CANCEL: 'dashboard-settings.cancel',
  DIALOG_BTN_REPLACE: 'dashboard-settings.replace',
  DEVICE_TITLE: 'dashboard-settings.device.title'
};

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
    isMobile: PropTypes.bool,
    updateDashboard: PropTypes.bool,
    modalRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    dashboardId: PropTypes.string,
    recordRef: PropTypes.string,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    onSetDialogProps: PropTypes.func
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
    this.props.resetConfigState();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.tabId && !PageTabList.isActiveTab(nextProps.tabId)) {
      return false;
    }

    return true;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();
    let { config, mobileConfig, availableWidgets } = this.props;
    let state = {};

    if (!PageTabList.isActiveTab(nextProps.tabId)) {
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
      !isEqualWith(availableWidgets, nextProps.availableWidgets, isEqual) ||
      !isEqualWith(nextProps.availableWidgets, this.state.availableWidgets, (a, b) => isEqual(a['name'], b['name']))
    ) {
      state.availableWidgets = DndUtils.setDndId(nextProps.availableWidgets);
    }

    this.setState({ ...state });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.checkRequestResult(prevProps);

    const { onSetDialogProps, identification } = this.props;
    const type = get(identification, 'type');

    if (type !== get(prevProps, 'identification.type') && typeof onSetDialogProps === 'function') {
      onSetDialogProps({ title: this.getTitleByType(type) });
    }
  }

  fetchData(props = this.props) {
    const { initSettings } = props;
    let { recordRef, dashboardId } = props;

    if (isEmpty(recordRef)) {
      recordRef = get(this.getPathInfo(), 'recordRef');
    }

    if (isEmpty(dashboardId)) {
      dashboardId = get(this.getPathInfo(), 'dashboardId');
    }

    if (!dashboardId && !recordRef) {
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
    const oldSaveWay = get(prevProps, 'requestResult.saveWay', null);
    const checkResult = get(this.props, 'requestResult', {});
    const newRStatus = checkResult.status;
    const newSaveWay = checkResult.saveWay;

    if (newRStatus && oldRStatus !== newRStatus) {
      const { updateDashboard, getDashboardConfig, resetAllDashboardsConfig, onSave, identification } = this.props;
      let { recordRef } = this.props;

      clearCache();
      this.clearLocalStorage();

      switch (newRStatus) {
        case RequestStatuses.SUCCESS: {
          if (isEmpty(recordRef)) {
            recordRef = get(this.getPathInfo(), 'recordRef');
          }

          updateDashboard ? getDashboardConfig({ recordRef }) : resetAllDashboardsConfig(identification);
          typeof onSave === 'function' && onSave();

          return;
        }
        case RequestStatuses.RESET: {
          getDashboardConfig({ recordRef });
          return;
        }
        default:
          return;
      }
    }

    if (newSaveWay && oldSaveWay !== newSaveWay && newSaveWay !== DashboardService.SaveWays.CONFIRM) {
      this.handleAcceptChanges(checkResult.dashboardId);
    }
  }

  clearLocalStorage = () => {
    const { removedWidgets } = this.state;

    removeItems(removedWidgets.map(id => UserLocalSettingsService.getDashletKey(id)));
  };

  getPathInfo() {
    return queryString.parse(decodeLink(this.state.urlParams));
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

  getTitleByType = type => {
    let title = '';

    switch (type) {
      case DashboardTypes.USER:
        title = t(Labels.USER_TITLE);
        break;
      case DashboardTypes.CASE_DETAILS:
        title = t(Labels.CARD_TITLE);
        break;
      default:
        title = t(Labels.DEFAULT_TITLE);
        break;
    }

    return title;
  };

  getPositionOffset = () => {
    const defaultOffset = { left: 0, top: 0 };
    const modal = get(this, 'props.modalRef.current._dialog');

    if (!modal) {
      return defaultOffset;
    }

    const content = modal.querySelector('.modal-content');

    if (!content) {
      return defaultOffset;
    }

    const positions = content.getBoundingClientRect();

    return {
      left: -positions.left,
      top: -positions.top
    };
  };

  renderSpecificationsBlock() {
    const { identification } = this.props;

    return (
      <div className="ecos-dashboard-settings__spec">
        <div className="ecos-dashboard-settings__spec-block">
          <span className="ecos-dashboard-settings__spec-label">{t(Labels.SPEC_ID)}:</span>
          <span className="ecos-dashboard-settings__spec-value">{identification.id}</span>
        </div>
      </div>
    );
  }

  renderOwnershipBlock() {
    const { dashboardKeyItems, userData, resetConfigToDefault, isDefaultConfig, isLoadingKeys } = this.props;
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
          isLoadingKeys={isLoadingKeys}
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
      const lastItem = last(tabs) || {};

      if (isMob) {
        if (!isEmpty(tabs)) {
          state.mobileTabs = tabs;
        }

        if (!isEmpty(activeTabKey)) {
          state.mobileActiveLayoutTabId = activeTabKey;
        }

        if (lastItem.isNew) {
          const { mobileSelectedWidgets } = this.state;

          state.mobileSelectedWidgets = {
            ...mobileSelectedWidgets,
            [lastItem.idLayout]: DefaultWidgetsByLayout[LayoutTypes.MOBILE]
          };
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

          tab &&
            tab.forEach(column => {
              column.forEach(widget => {
                removedWidgets.push(widget.id);
              });
            });

          state.selectedWidgets = selectedWidgets;
          state.removedWidgets = removedWidgets;
        }

        if (lastItem.isNew) {
          const { selectedWidgets, selectedLayout } = this.state;

          state.selectedWidgets = {
            ...selectedWidgets,
            [lastItem.idLayout]: DefaultWidgetsByLayout[LayoutTypes.TWO_COLUMNS_BS]
          };

          state.selectedLayout = {
            ...selectedLayout,
            [lastItem.idLayout]: LayoutTypes.TWO_COLUMNS_BS
          };
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
      identification: { type, key }
    } = this.props;
    const typeByRecord = key && key.includes('workspace://SpacesStore/') ? key : null;

    const setData = layout => {
      const { activeLayoutTabId, selectedWidgets, selectedLayout } = cloneDeep(this.state);

      selectedLayout[activeLayoutTabId] = layout.type;
      selectedWidgets[activeLayoutTabId] = this.setSelectedWidgets(layout, selectedWidgets[activeLayoutTabId]);

      this.setState({ selectedWidgets, selectedLayout });
    };

    return (
      <div className="ecos-dashboard-settings__container">
        <SetLayouts
          dashboardType={type || typeByRecord}
          activeLayout={this.activeData.layout}
          setData={setData}
          isMobile={this.isSelectedMobileVer}
        />
      </div>
    );
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
    const { activeLayoutTabId, mobileActiveLayoutTabId } = this.state;
    const selectedWidgets = cloneDeep(this.state.selectedWidgets);
    const mobileSelectedWidgets = cloneDeep(this.state.mobileSelectedWidgets);
    const { modelAttributes } = this.props;
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
      <div className="ecos-dashboard-settings__container">
        <SetWidgets
          availableWidgets={this.availableWidgets}
          activeWidgets={this.activeData.widgets}
          columns={this.selectedTypeLayout.columns}
          setData={setData}
          isMobile={isMob}
          positionAdjustment={this.getPositionOffset}
          modelAttributes={modelAttributes}
        />
      </div>
    );
  }

  handleCloseSettings = () => {
    const { onClose } = this.props;

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  handleCheckChanges = () => {
    /**
     * @todo rethink checking of changing / exist. Do easier: full check with confirms via saga & DialogManager
     */
    const { checkUpdatedSettings } = this.props;
    const { selectedDashboardKey: dashboardKey, isForAllUsers } = this.state;

    checkUpdatedSettings({ isForAllUsers, dashboardKey });
  };

  handleAcceptChanges = checkResultId => {
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

  renderButtons() {
    const { identification } = this.props;

    return (
      <div className="ecos-dashboard-settings__actions">
        <Btn className="ecos-btn_x-step_10" onClick={this.handleCloseSettings}>
          {t(Labels.BTN_CANCEL)}
        </Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleCheckChanges} disabled={!get(identification, 'key')}>
          {t(Labels.BTN_SAVE)}
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
          title={t(Labels.DIALOG_CONFIRM_TITLE)}
          content={t(Labels.DIALOG_BOARD_EXISTS)}
          footer={[
            <Btn key="handleCancel" onClick={handleCancel}>
              {t(Labels.DIALOG_BTN_CANCEL)}
            </Btn>,
            <Btn key="handleReplace" onClick={handleReplace} className="ecos-btn_blue">
              {t(Labels.DIALOG_BTN_REPLACE)}
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
      <Container className="ecos-dashboard-settings ecos-dashboard-settings_modal">
        {this.renderLoader()}
        {this.renderSpecificationsBlock()}
        {this.renderOwnershipBlock()}
        <div className="ecos-dashboard-settings__section">
          {this.renderDeviceTabsBlock()}
          <h5 className="ecos-dashboard-settings__container-title">{t(Labels.DEVICE_TITLE)}</h5>
          {this.renderLayoutTabsBlock()}
          {this.renderLayoutsBlock()}
          {this.renderWidgetsBlock()}
        </div>
        {this.renderButtons()}
        {this.renderDialogs()}
      </Container>
    );
  }
}

export const mapStateToProps = (state, ownProps) => ({
  userData: {
    userName: get(state, 'user.userName'),
    isAdmin: get(state, 'user.isAdmin', false)
  },
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  menuType: get(state, ['menu', 'type']),
  ...selectStateByKey(state, getStateId(ownProps))
});

export const mapDispatchToProps = (dispatch, ownProps) => {
  const key = getStateId(ownProps);

  return {
    initSettings: payload => dispatch(initDashboardSettings({ ...payload, key })),
    checkUpdatedSettings: payload => dispatch(getCheckUpdatedDashboardConfig({ ...payload, key })),
    saveSettings: payload => dispatch(saveDashboardConfig({ ...payload, key })),
    setCheckUpdatedConfig: payload => dispatch(setCheckUpdatedDashboardConfig({ ...payload, key })),
    resetConfigState: () => dispatch(resetDashboardConfig(key)),
    resetConfigToDefault: payload => dispatch(resetConfigToDefault({ ...payload, key })),
    getDashboardConfig: payload => dispatch(getDashboardConfigPage({ ...payload, key: ownProps.tabId })),
    resetAllDashboardsConfig: payload => dispatch(resetAllDashboardsConfig({ ...payload }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
