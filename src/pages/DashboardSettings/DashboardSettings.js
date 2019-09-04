import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isNull from 'lodash/isNull';

import { arrayCompare, t, documentScrollTop } from '../../helpers/util';
import { getSortedUrlParams } from '../../helpers/urls';
import { DashboardTypes, Layouts, MenuTypes } from '../../constants/dashboard';
import { MENU_TYPE, RequestStatuses, URL } from '../../constants';
import DashboardService from '../../services/dashboard';
import {
  getAwayFromPage,
  getCheckUpdatedDashboardConfig,
  initDashboardSettings,
  saveDashboardConfig,
  setCheckUpdatedDashboardConfig
} from '../../actions/dashboardSettings';
import { initMenuSettings } from '../../actions/menu';
import { DndUtils } from '../../components/Drag-n-Drop';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { Loader } from '../../components/common';
import { Btn } from '../../components/common/btns';
import { TunableDialog } from '../../components/common/dialogs';

import SetBind from './SetBind';
import SetTabs from './SetTabs';
import SetLayouts from './SetLayouts';
import SetWidgets from './SetWidgets';
import SetMenu from './SetMenu';

import './style.scss';

const mapStateToProps = state => ({
  userData: {
    userName: get(state, 'user.userName'),
    isAdmin: get(state, 'user.isAdmin', false)
  },
  menuType: get(state, 'menu.type'),
  menuLinks: get(state, 'menu.links', []),
  availableMenuItems: get(state, ['menu', 'availableMenuItems'], []),
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  config: get(state, ['dashboardSettings', 'config'], []),
  availableWidgets: get(state, ['dashboardSettings', 'availableWidgets'], []),
  isLoading: get(state, ['dashboardSettings', 'isLoading']),
  requestResult: get(state, ['dashboardSettings', 'requestResult'], {}),
  identification: get(state, ['dashboardSettings', 'identification'], {}),
  dashboardKeyItems: get(state, ['dashboardSettings', 'dashboardKeys'], [])
});

const mapDispatchToProps = dispatch => ({
  initMenuSettings: () => dispatch(initMenuSettings()),
  initDashboardSettings: payload => dispatch(initDashboardSettings(payload)),
  checkUpdatedSettings: payload => dispatch(getCheckUpdatedDashboardConfig(payload)),
  saveSettings: payload => dispatch(saveDashboardConfig(payload)),
  getAwayFromPage: payload => dispatch(getAwayFromPage(payload)),
  setCheckUpdatedDashboardConfig: payload => dispatch(setCheckUpdatedDashboardConfig(payload))
});

class DashboardSettings extends React.Component {
  static propTypes = {
    identification: PropTypes.object,
    userData: PropTypes.object,
    menuType: PropTypes.string,
    menuLinks: PropTypes.array,
    config: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        widgets: PropTypes.array,
        tab: PropTypes.object
      })
    ).isRequired,
    availableMenuItems: PropTypes.array,
    availableWidgets: PropTypes.array,
    dashboardKeyItems: PropTypes.array,
    requestResult: PropTypes.object
  };

  static defaultProps = {
    identification: {},
    userData: {},
    menuType: '',
    menuLinks: [],
    config: [],
    availableWidgets: [],
    availableMenuItems: [],
    dashboardKeyItems: [],
    requestResult: {}
  };

  state = {
    activeLayoutId: null,
    selectedDashboardKey: '',
    isForAllUsers: false,
    selectedLayout: {},
    selectedWidgets: {},
    selectedMenuItems: [],
    typeMenu: MenuTypes,
    urlParams: getSortedUrlParams(),
    tabs: []
  };

  constructor(props) {
    super(props);

    const state = {
      ...this.state,
      availableWidgets: DndUtils.setDndId(props.availableWidgets),
      availableMenuItems: DndUtils.setDndId(props.availableMenuItems)
    };

    this.state = {
      ...state,
      ...this.setStateByConfig(props),
      ...this.setStateMenu(props, state)
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();
    let { config, menuType, availableMenuItems, availableWidgets } = this.props;
    let state = {};

    if (urlParams !== newUrlParams) {
      this.setState({ urlParams: newUrlParams });
      this.fetchData(nextProps);
    }

    if (JSON.stringify(config) !== JSON.stringify(nextProps.config)) {
      const resultConfig = this.setStateByConfig(nextProps);

      state = { ...state, ...resultConfig };
    }

    if (menuType !== nextProps.menuType) {
      const resultMenu = this.setStateMenu(nextProps);

      state = { ...state, ...resultMenu };
    }

    if (!arrayCompare(availableMenuItems, nextProps.availableMenuItems)) {
      state.availableMenuItems = DndUtils.setDndId(nextProps.availableMenuItems);
    }

    if (
      !arrayCompare(availableWidgets, nextProps.availableWidgets) ||
      !arrayCompare(nextProps.availableWidgets, this.state.availableWidgets, 'name')
    ) {
      state.availableWidgets = DndUtils.setDndId(nextProps.availableWidgets);
    }

    this.setState({ ...state });
    this.checkRequestResult(nextProps);
  }

  fetchData(props = this.props) {
    const { initDashboardSettings, initMenuSettings } = props;
    const { recordRef, dashboardId } = this.getPathInfo(props);

    initDashboardSettings({ recordRef, dashboardId });
    initMenuSettings();
  }

  setStateByConfig(props) {
    const selectedDashboardKey = get(props, 'identification.key', '');
    const isForAllUsers = isNull(get(props, 'identification.user', null));
    const { config } = props;

    let activeLayoutId = null;
    let tabs = [];
    let selectedLayout = {};
    let selectedWidgets = {};

    if (!isEmpty(config) && isArray(config)) {
      activeLayoutId = config[0].id;

      config.forEach(item => {
        let idLayout = item.id;

        tabs.push(item.tab);
        selectedLayout[idLayout] = item.type;

        let layout = Layouts.find(layout => layout.type === item.type) || {};
        let widgets = this.setSelectedWidgets(layout, item.widgets);

        widgets.map(item => DndUtils.setDndId(item));
        selectedWidgets[idLayout] = widgets;
      });
    }

    return { selectedLayout, selectedWidgets, tabs, activeLayoutId, selectedDashboardKey, isForAllUsers };
  }

  setStateMenu(props, state = this.state) {
    const { typeMenu } = state;

    let selectedMenuItems = get(props, 'menuLinks');
    selectedMenuItems = DndUtils.setDndId(selectedMenuItems);

    typeMenu.forEach(item => {
      item.isActive = item.type === get(props, 'menuType', '');
    });

    return { typeMenu, selectedMenuItems };
  }

  setSelectedWidgets(item, availableWidgets) {
    const columns = item ? item.columns || [] : [];
    let newWidgets = new Array(columns.length);

    newWidgets.fill([]);
    newWidgets.forEach((value, index) => {
      if (availableWidgets && index < availableWidgets.length) {
        newWidgets[index] = availableWidgets[index] || [];
      }
    });

    return newWidgets;
  }

  checkRequestResult(nextProps) {
    const oldRStatus = get(this.props, 'requestResult.status', null);
    const newRStatus = get(nextProps, 'requestResult.status', null);
    const oldSaveWay = get(this.props, 'requestResult.saveWay', null);
    const newSaveWay = get(nextProps, 'requestResult.saveWay', null);

    if (newRStatus && oldRStatus !== newRStatus && newRStatus === RequestStatuses.SUCCESS) {
      this.closePage(nextProps);
    } else if (newSaveWay && oldSaveWay !== newSaveWay && newSaveWay !== DashboardService.SaveWays.CONFIRM) {
      this.acceptChanges(newSaveWay === DashboardService.SaveWays.CREATE);
    }
  }

  getPathInfo(props = this.props) {
    const {
      location: { search }
    } = props;
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId } = searchParams;

    return {
      recordRef,
      dashboardId
    };
  }

  getUrlToDashboard() {
    const { identification = {}, dashboardKeyItems = [] } = this.props;
    const { selectedDashboardKey } = this.state;
    const { recordRef } = this.getPathInfo();
    const pathDashboardParams = {};

    if (recordRef) {
      pathDashboardParams.recordRef = recordRef;
    }

    const oldKeyI = dashboardKeyItems.findIndex(k => k.key === identification.key);
    const newKeyI = dashboardKeyItems.findIndex(k => k.key === selectedDashboardKey);

    if (oldKeyI < newKeyI) {
      pathDashboardParams.dashboardKey = selectedDashboardKey;
    }

    return URL.DASHBOARD + (isEmpty(pathDashboardParams) ? '' : `?${queryString.stringify(pathDashboardParams)}`);
  }

  get menuWidth() {
    const menu = document.querySelector('.slide-menu');

    if (!menu) {
      return 0;
    }

    return -menu.clientWidth;
  }

  get selectedTypeLayout() {
    return Layouts.find(layout => layout.type === this.activeData.layout) || {};
  }

  get activeData() {
    const { activeLayoutId, selectedWidgets, selectedLayout } = this.state;

    return {
      widgets: selectedWidgets[activeLayoutId] || [],
      layout: selectedLayout[activeLayoutId] || ''
    };
  }

  get isUserType() {
    return [DashboardTypes.USER].includes(get(this, 'props.identification.type', ''));
  }

  draggablePositionAdjustment = () => {
    const menuType = get(this.props, 'menuType', '');

    return {
      top: menuType === MENU_TYPE.LEFT ? documentScrollTop() : 0,
      left: menuType === MENU_TYPE.LEFT ? this.menuWidth : 0
    };
  };

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
          <h1 className="ecos-dashboard-settings__header">{title}</h1>
        </Col>
      </Row>
    );
  }

  renderDashboardKey() {
    const { dashboardKeyItems, userData } = this.props;
    const { selectedDashboardKey, isForAllUsers } = this.state;

    const setData = data => {
      this.setState(data);
    };

    return isEmpty(dashboardKeyItems) ? null : (
      <div className="ecos-dashboard-settings__container">
        <SetBind
          keys={dashboardKeyItems}
          selectedDashboardKey={selectedDashboardKey}
          isAdmin={userData.isAdmin}
          isForAllUsers={isForAllUsers}
          setData={setData}
        />
      </div>
    );
  }

  renderTabsBlock() {
    if (this.isUserType) {
      return null;
    }

    const setData = data => {
      this.setState(data);
    };

    const { tabs, activeLayoutId } = this.state;

    return <SetTabs tabs={tabs} activeLayoutId={activeLayoutId} setData={setData} />;
  }

  renderLayoutsBlock() {
    const setData = layout => {
      const { activeLayoutId, selectedWidgets, selectedLayout } = this.state;

      selectedLayout[activeLayoutId] = layout.type;
      selectedWidgets[activeLayoutId] = this.setSelectedWidgets(layout, selectedWidgets[activeLayoutId]);

      this.setState({ selectedWidgets, selectedLayout });
    };

    return <SetLayouts activeLayout={this.activeData.layout} setData={setData} />;
  }

  renderWidgetsBlock() {
    const { availableWidgets, activeLayoutId, selectedWidgets } = this.state;

    const setData = data => {
      selectedWidgets[activeLayoutId] = data;

      this.setState({ selectedWidgets });
    };

    return (
      <SetWidgets
        availableWidgets={availableWidgets}
        activeWidgets={this.activeData.widgets}
        columns={this.selectedTypeLayout.columns}
        activeLayoutId={activeLayoutId}
        positionAdjustment={this.draggablePositionAdjustment}
        setData={setData}
      />
    );
  }

  renderMenuBlock() {
    const { selectedMenuItems, availableMenuItems, typeMenu } = this.state;

    const setData = data => {
      this.setState(data);
    };

    return this.isUserType ? (
      <SetMenu
        typeMenu={typeMenu}
        availableMenuItems={availableMenuItems}
        selectedMenuItems={selectedMenuItems}
        setData={setData}
        positionAdjustment={this.draggablePositionAdjustment}
      />
    ) : null;
  }

  handleCloseSettings = () => {
    this.closePage();
  };

  handleCheckChanges = () => {
    const { checkUpdatedSettings } = this.props;
    const { selectedDashboardKey: dashboardKey, isForAllUsers } = this.state;

    checkUpdatedSettings({ isForAllUsers, dashboardKey });
  };

  acceptChanges = (create = false) => {
    const { saveSettings, identification, userData } = this.props;
    const {
      selectedWidgets: widgets,
      selectedMenuItems: menuLinks,
      typeMenu,
      tabs,
      selectedLayout: layoutType,
      selectedDashboardKey: dashboardKey,
      isForAllUsers
    } = this.state;
    const activeMenuType = typeMenu.find(item => item.isActive);
    const menuType = activeMenuType ? activeMenuType.type : typeMenu[0].type;
    const userName = isForAllUsers ? null : identification.user || userData.userName;
    const newIdentification = { user: userName, key: dashboardKey };

    if (create) {
      newIdentification.id = '';
    }

    saveSettings({
      newIdentification,
      layoutType,
      widgets,
      tabs,
      menuType,
      menuLinks
    });
  };

  closePage = () => {
    const urlGoTo = this.getUrlToDashboard();

    this.props.getAwayFromPage();

    changeUrlLink(urlGoTo, { openNewTab: true, closeActiveTab: true });
  };

  renderButtons() {
    return (
      <div className={'ecos-dashboard-settings__actions'}>
        <Btn className={'ecos-btn_x-step_10'} onClick={this.handleCloseSettings}>
          {t('dashboard-settings.button.cancel')}
        </Btn>
        <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.handleCheckChanges}>
          {t('dashboard-settings.button.save')}
        </Btn>
      </div>
    );
  }

  renderDialogs() {
    const { setCheckUpdatedDashboardConfig, requestResult } = this.props;

    if (requestResult.saveWay === DashboardService.SaveWays.CONFIRM) {
      const handleReplace = () => {
        setCheckUpdatedDashboardConfig({ saveWay: DashboardService.SaveWays.UPDATE });
      };

      const handleCancel = () => {
        setCheckUpdatedDashboardConfig({});
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
            <Btn key="handleReplace" onClick={handleReplace} className={'ecos-btn_blue'}>
              {t('dashboard-settings.replace')}
            </Btn>
          ]}
        />
      );
    }

    return null;
  }

  renderLoader() {
    let { isLoading, isLoadingMenu } = this.props;

    if (isLoading || isLoadingMenu) {
      return <Loader height={100} width={100} className="ecos-dashboard-settings__loader-wrapper" darkened />;
    }

    return null;
  }

  render() {
    return (
      <Container className="ecos-dashboard-settings">
        {this.renderLoader()}
        {this.renderHeader()}
        {this.renderDashboardKey()}
        {this.renderTabsBlock()}
        <div className="ecos-dashboard-settings__container">
          {this.renderLayoutsBlock()}
          {this.renderWidgetsBlock()}
          {this.renderMenuBlock()}
          {this.renderButtons()}
          {this.renderDialogs()}
        </div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSettings);
