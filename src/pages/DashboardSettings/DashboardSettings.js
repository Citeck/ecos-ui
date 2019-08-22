import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import * as queryString from 'query-string';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';

import { arrayCompare, deepClone, t } from '../../helpers/util';
import { getSortedUrlParams } from '../../helpers/urls';
import { DashboardTypes, Layouts, MenuTypes } from '../../constants/dashboard';
import { MENU_TYPE, SAVE_STATUS, URL } from '../../constants';
import { getAwayFromPage, initDashboardSettings, saveDashboardConfig } from '../../actions/dashboardSettings';
import { initMenuSettings } from '../../actions/menu';
import DashboardService from '../../services/dashboard';
import { DndUtils } from '../../components/Drag-n-Drop';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { EditTabs, Loader, ScrollArrow } from '../../components/common';
import { Btn, IcoBtn } from '../../components/common/btns';
import { Checkbox, Dropdown } from '../../components/common/form';

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
  config: get(state, ['dashboardSettings', 'config'], []),
  availableMenuItems: get(state, ['menu', 'availableMenuItems'], []),
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  availableWidgets: get(state, ['dashboardSettings', 'availableWidgets'], []),
  isLoading: get(state, ['dashboardSettings', 'isLoading']),
  saveResult: get(state, ['dashboardSettings', 'saveResult']),
  dashboardType: get(state, ['dashboardSettings', 'identification', 'type']),
  dashboardKey: get(state, ['dashboardSettings', 'identification', 'key']),
  dashboardKeyList: get(state, ['dashboardSettings', 'dashboardKeys'], [])
});

const mapDispatchToProps = dispatch => ({
  initMenuSettings: () => dispatch(initMenuSettings()),
  initDashboardSettings: payload => dispatch(initDashboardSettings(payload)),
  saveSettings: payload => dispatch(saveDashboardConfig(payload)),
  getAwayFromPage: payload => dispatch(getAwayFromPage(payload))
});

class DashboardSettings extends React.Component {
  static propTypes = {
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
    dashboardKey: PropTypes.string,
    dashboardType: PropTypes.string,
    dashboardKeyList: PropTypes.array
  };

  static defaultProps = {
    userData: {},
    menuType: '',
    menuLinks: [],
    config: [],
    availableWidgets: [],
    availableMenuItems: [],
    dashboardKey: '',
    dashboardType: '',
    dashboardKeyList: []
  };

  constructor(props) {
    super(props);

    const state = {
      activeLayoutId: null,
      selectedDashboardKey: '',
      dashboardKeyForAllUsers: false,
      selectedLayout: {},
      selectedWidgets: {},
      selectedMenuItems: [],
      typeMenu: MenuTypes,
      availableWidgets: DndUtils.setDndId(props.availableWidgets),
      availableMenuItems: DndUtils.setDndId(props.availableMenuItems),
      urlParams: getSortedUrlParams(),
      tabs: [],
      scrollTabToEnd: false,
      isOpenKeys: false
    };

    this.state = {
      ...state,
      ...this.setStateByConfig(props, state),
      ...this.setStateMenu(props, state)
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();
    let { config, menuType, availableMenuItems, availableWidgets, saveResult = {} } = this.props;
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

    if (nextProps.saveResult && saveResult.status !== nextProps.saveResult.status && nextProps.saveResult.status !== SAVE_STATUS.FAILURE) {
      this.closePage(nextProps);
    }
  }

  fetchData(props = this.props) {
    const { initDashboardSettings, initMenuSettings } = props;
    const { recordRef, dashboardId } = this.getPathInfo(props);

    initDashboardSettings({ recordRef, dashboardId });
    initMenuSettings();
  }

  setStateByConfig(props, state = this.state) {
    const { config, dashboardKey } = props;

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

    return { selectedLayout, selectedWidgets, tabs, activeLayoutId, selectedDashboardKey: dashboardKey };
  }

  setStateMenu(props, state = this.state) {
    const { typeMenu } = state;

    let selectedMenuItems = get(props, 'menuLinks');
    selectedMenuItems = DndUtils.setDndId(selectedMenuItems);

    typeMenu.forEach(item => {
      item.isActive = item.type === this.getMenuType(props);
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

  getPathInfo(props = this.props) {
    const {
      location: { search }
    } = props;
    const searchParams = queryString.parse(search);
    const { recordRef, dashboardId } = searchParams;

    return {
      pathDashboard: URL.DASHBOARD + (recordRef ? `?recordRef=${recordRef}` : ''),
      recordRef,
      dashboardId
    };
  }

  getMenuType(props = this.props) {
    return get(props, 'menuType', '');
  }

  get menuWidth() {
    const menu = document.querySelector('.slide-menu');

    if (!menu) {
      return 0;
    }

    return -menu.clientWidth;
  }

  get bodyScrollTop() {
    const body = document.querySelector('body');

    if (!body) {
      return 0;
    }

    return body.scrollTop;
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
    return [DashboardTypes.USER].includes(this.props.dashboardType);
  }

  draggablePositionAdjustment = () => {
    const menuType = this.getMenuType();

    return {
      top: menuType === MENU_TYPE.LEFT ? this.bodyScrollTop : 0,
      left: menuType === MENU_TYPE.LEFT ? this.menuWidth : 0
    };
  };

  renderHeader() {
    let title = '';

    switch (this.props.dashboardType) {
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

  /*-------- start Keys --------*/
  getStateOpen = isOpenKeys => {
    this.setState({ isOpenKeys });
  };

  onChangeDashboardKey = field => {
    this.setState({ selectedDashboardKey: field.key });
  };

  onChangeKeyForAllUser = field => {
    this.setState({ dashboardKeyForAllUsers: field.checked });
  };

  renderDashboardKey() {
    const { dashboardKeyList, userData } = this.props;
    const { isOpenKeys, selectedDashboardKey, dashboardKeyForAllUsers } = this.state;

    return isEmpty(dashboardKeyList) ? null : (
      <div className="ecos-dashboard-settings__container">
        <h5 className="ecos-dashboard-settings__container-title">{t('Привязка к типу кейса')}</h5>
        <div className="ecos-dashboard-settings__keys-wrapper">
          <Dropdown
            source={dashboardKeyList}
            value={selectedDashboardKey}
            valueField={'key'}
            titleField={'displayName'}
            onChange={this.onChangeDashboardKey}
            getStateOpen={this.getStateOpen}
            hideSelected
            className={'ecos-dashboard-settings__keys-dropdown'}
          >
            <IcoBtn invert icon={isOpenKeys ? 'icon-up' : 'icon-down'} className={`ecos-btn_white2 ecos-btn_focus_no ecos-btn_drop-down`} />
          </Dropdown>
          {userData.isAdmin && (
            <Checkbox
              checked={dashboardKeyForAllUsers}
              onChange={this.onChangeKeyForAllUser}
              className={'ecos-dashboard-settings__keys-checkbox'}
            >
              {t('Для всех пользователей')}
            </Checkbox>
          )}
        </div>
      </div>
    );
  }

  /*-------- start Tabs --------*/
  onClickTabLayout = tab => {
    let { activeLayoutId } = this.state;

    if (tab.idLayout !== activeLayoutId) {
      this.setState({ activeLayoutId: tab.idLayout });
    }
  };

  onCreateTab = () => {
    const { tabs } = this.state;
    const idLayout = DashboardService.newIdLayout;
    const newTab = DashboardService.defaultDashboardTab(idLayout);

    newTab.label += ` ${tabs.length + 1}`;
    newTab.isNew = true;

    tabs.push(newTab);

    this.setState({ tabs, scrollTabToEnd: true }, () => {
      this.setState({ scrollTabToEnd: false });
    });
  };

  onEditTab = (tab, index) => {
    const { tabs } = this.state;
    const { label, idLayout } = tab;

    set(tabs, [index], { label, idLayout });

    this.setState({ tabs });
  };

  onDeleteTab = (tab, index) => {
    let { tabs, activeLayoutId } = this.state;

    tabs.splice(index, 1);

    if (tab.idLayout === activeLayoutId) {
      activeLayoutId = get(tabs, '[0].idLayout', null);
    }

    this.setState({ tabs, activeLayoutId });
  };

  onSortTabs = sortedTabs => {
    this.setState({
      tabs: sortedTabs.map(({ label, idLayout }) => ({ label, idLayout }))
    });
  };

  renderTabsBlock() {
    if (this.isUserType) {
      return null;
    }

    const { tabs, activeLayoutId, scrollTabToEnd } = this.state;
    const cloneTabs = deepClone(tabs);

    return (
      <React.Fragment>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.edit-number-contents')}</h6>
        <div className="ecos-dashboard-settings__tabs-wrapper">
          <ScrollArrow scrollToEnd={scrollTabToEnd}>
            <EditTabs
              className="ecos-dashboard-settings__tabs-block"
              classNameTab="ecos-dashboard-settings__tabs-item"
              hasHover
              items={cloneTabs}
              keyField={'idLayout'}
              onDelete={this.onDeleteTab}
              onSort={this.onSortTabs}
              onEdit={this.onEditTab}
              onClick={this.onClickTabLayout}
              disabled={cloneTabs.length < 2}
              activeTabKey={activeLayoutId}
            />
          </ScrollArrow>
          <IcoBtn
            icon="icon-big-plus"
            className={'ecos-dashboard-settings__tabs__add-tab ecos-btn_i ecos-btn_blue2 ecos-btn_hover_blue2'}
            onClick={this.onCreateTab}
          />
        </div>
      </React.Fragment>
    );
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

  /*-------- start Buttons --------*/

  handleCloseClick = () => {
    this.closePage();
  };

  handleAcceptClick = () => {
    const { saveSettings, getAwayFromPage } = this.props;
    const {
      selectedWidgets: widgets,
      selectedMenuItems: menuLinks,
      typeMenu,
      tabs,
      selectedLayout: layoutType,
      selectedDashboardKey: dashboardKey
    } = this.state;
    const activeMenuType = typeMenu.find(item => item.isActive);
    const menuType = activeMenuType ? activeMenuType.type : typeMenu[0].type;

    saveSettings({
      dashboardKey,
      layoutType,
      widgets,
      tabs,
      menuType,
      menuLinks
    });
    getAwayFromPage();
  };

  closePage = (props = this.props) => {
    const { pathDashboard } = this.getPathInfo(props);

    changeUrlLink(pathDashboard, { openNewTab: true, closeActiveTab: true });
  };

  renderButtons() {
    return (
      <div className={'ecos-dashboard-settings__actions'}>
        <Btn className={'ecos-btn_x-step_10'} onClick={this.handleCloseClick}>
          {t('dashboard-settings.button.cancel')}
        </Btn>
        <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.handleAcceptClick}>
          {t('dashboard-settings.button.save')}
        </Btn>
      </div>
    );
  }

  renderLoader() {
    let { isLoading, isLoadingMenu } = this.props;

    if (isLoading || isLoadingMenu) {
      return <Loader height={100} width={100} className={`ecos-dashboard-settings__loader-wrapper`} />;
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
        </div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSettings);
