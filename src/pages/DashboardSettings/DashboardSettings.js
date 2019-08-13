import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import * as queryString from 'query-string';
import { cloneDeep, get, isArray, isEmpty } from 'lodash';

import { arrayCompare, t } from '../../helpers/util';
import { LAYOUTS, TYPE_MENU } from '../../constants/dashboard';
import { MENU_TYPE, SAVE_STATUS, URL } from '../../constants';
import { getAwayFromPage, initDashboardSettings, saveDashboardConfig } from '../../actions/dashboardSettings';
import { initMenuSettings } from '../../actions/menu';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import { DndUtils, DragDropContext, DragItem, Droppable } from '../../components/Drag-n-Drop';
import { Btn, IcoBtn } from '../../components/common/btns';
import { Loader, Tabs } from '../../components/common';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { getSortedUrlParams } from '../../helpers/urls';

import './style.scss';

const mapStateToProps = state => ({
  menuType: get(state, 'menu.type'),
  menuLinks: get(state, 'menu.links'),
  config: get(state, ['dashboardSettings', 'config']),
  availableMenuItems: get(state, ['menu', 'availableMenuItems']),
  isLoadingMenu: get(state, ['menu', 'isLoading']),
  availableWidgets: get(state, ['dashboardSettings', 'availableWidgets']),
  isLoading: get(state, ['dashboardSettings', 'isLoading']),
  saveResult: get(state, ['dashboardSettings', 'saveResult'])
});

const mapDispatchToProps = dispatch => ({
  initMenuSettings: () => dispatch(initMenuSettings()),
  initDashboardSettings: payload => dispatch(initDashboardSettings(payload)),
  saveSettings: payload => dispatch(saveDashboardConfig(payload)),
  getAwayFromPage: payload => dispatch(getAwayFromPage(payload))
});

const DROPPABLE_ZONE = {
  MENU_FROM: 'availableMenuItems',
  MENU_TO: 'selectedMenuItems',
  WIDGETS_FROM: 'availableWidgets',
  WIDGETS_TO: 'selectedWidgets'
};

class DashboardSettings extends React.Component {
  static propTypes = {
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
    availableWidgets: PropTypes.array
  };

  static defaultProps = {
    menuType: '',
    menuLinks: [],
    config: [],
    availableWidgets: [],
    availableMenuItems: []
  };

  constructor(props) {
    super(props);

    const state = {
      activeLayoutId: null,
      selectedLayout: {},
      selectedWidgets: {},
      selectedMenuItems: [],
      typeMenu: TYPE_MENU,
      isShowMenuConstructor: false,
      availableWidgets: DndUtils.setDndId(props.availableWidgets),
      availableMenuItems: DndUtils.setDndId(props.availableMenuItems),
      urlParams: getSortedUrlParams(),
      tabs: []
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

    if (JSON.stringify(menuType) !== JSON.stringify(nextProps.menuType)) {
      const resultMenu = this.setStateMenu(nextProps);

      state = { ...state, ...resultMenu };
    }

    if (JSON.stringify(availableMenuItems) !== JSON.stringify(nextProps.availableMenuItems)) {
      state.availableMenuItems = DndUtils.setDndId(nextProps.availableMenuItems);
    }

    if (
      JSON.stringify(availableWidgets) !== JSON.stringify(nextProps.availableWidgets) ||
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
    const { config } = props;
    const activeConfig = this.getActiveLayout(props);

    let activeLayoutId = activeConfig.id;
    let tabs = [];
    let selectedLayout = {};
    let selectedWidgets = {};

    if (!isEmpty(config) && isArray(config)) {
      config.forEach((item, index) => {
        let idLayout = item.id;

        tabs.push({ ...item.tab, label: t(item.tab.label), idLayout, onClick: () => this.onClickTabLayout(item.id) });

        selectedLayout[idLayout] = item.type;

        let layout = LAYOUTS.find(layout => layout.type === item.type) || {};
        let widgets = this.setSelectedWidgets(layout, activeConfig.widgets);

        widgets.map(item => DndUtils.setDndId(item));
        selectedWidgets[idLayout] = widgets;
      });
    }

    return { selectedLayout, selectedWidgets, tabs, activeLayoutId };
  }

  setStateMenu(props, state = this.state) {
    const { typeMenu } = state;

    let selectedMenuItems = get(props, 'menuLinks');
    selectedMenuItems = DndUtils.setDndId(selectedMenuItems);

    typeMenu.forEach(item => {
      item.isActive = item.type === this.getMenuType(props);
    });

    const isShowMenuConstructor = this.getMenuType(props) === MENU_TYPE.TOP;

    return { typeMenu, selectedMenuItems, isShowMenuConstructor };
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

  getActiveLayout(props = this.props) {
    const { config } = props || [];

    if (!isEmpty(config) && isArray(config)) {
      return config.find(item => item.tab.isActive) || config[0];
    }

    return {};
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
    return LAYOUTS.find(layout => layout.type === this.activeData.layout) || {};
  }

  get filterAvailableMenuItems() {
    const { availableMenuItems, selectedMenuItems } = this.state;

    return availableMenuItems.filter(item => !selectedMenuItems.find(elm => item.id === elm.id));
  }

  get activeData() {
    const { activeLayoutId, selectedWidgets, selectedLayout } = this.state;

    return {
      widgets: selectedWidgets[activeLayoutId] || [],
      layout: selectedLayout[activeLayoutId] || ''
    };
  }

  draggablePositionAdjusment = () => {
    const menuType = this.getMenuType();

    return {
      top: menuType === MENU_TYPE.LEFT ? this.bodyScrollTop : 0,
      left: menuType === MENU_TYPE.LEFT ? this.menuWidth : 0
    };
  };

  renderHeader() {
    return (
      <Row>
        <Col md={12}>
          <h1 className="ecos-dashboard-settings__header">{t('dashboard-settings.page-title')}</h1>
        </Col>
      </Row>
    );
  }

  /*-------- start Tabs --------*/
  onClickTabLayout = activeLayoutId => {
    let { tabs } = this.state;

    tabs.forEach(item => {
      item.isActive = item.idLayout === activeLayoutId;
    });

    this.setState({ tabs, activeLayoutId });
  };

  onClickNewTab = () => {
    const { tabs } = this.state;
    const idLayout = tabs.length;

    tabs.push({ label: 'new tab', idLayout, onClick: () => this.onClickTabLayout(idLayout) });

    this.setState({ tabs });
  };

  renderTabsBlock() {
    const { tabs } = this.state;
    const active = tabs.find(tab => tab.isActive) || {};

    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('Вкладки')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('Установите необходимые вкладки дашборда')}</h6>
        <div className="ecos-dashboard-settings__container-group">
          <Tabs className="ecos-dashboard-settings__tabs" hasHover items={tabs} />
          <IcoBtn
            icon={'icon-big-plus'}
            className={'ecos-btn_i ecos-btn_i-big-plus ecos-btn_blue ecos-btn_hover_light-blue'}
            onClick={this.onClickNewTab}
          />
        </div>
        <h6 className="ecos-dashboard-settings__container-subtitle">
          {t('Настройте контент для выбранной вкладки') + ': ' + active.label}
        </h6>
      </React.Fragment>
    );
  }

  /*-------- start Layouts --------*/

  handleClickColumn(layout) {
    const { activeLayoutId, selectedWidgets, selectedLayout } = this.state;

    if (this.activeData.layout === layout.type) {
      return;
    }

    selectedLayout[activeLayoutId] = layout.type;
    selectedWidgets[activeLayoutId] = this.setSelectedWidgets(layout, selectedWidgets[activeLayoutId]);

    this.setState({ selectedWidgets, selectedLayout });
  }

  handleClickMenu(menu) {
    let typeMenu = cloneDeep(this.state.typeMenu);
    let isShowMenuConstructor = false;

    if (menu.isActive) {
      return;
    }

    typeMenu = typeMenu.map(item => {
      item.isActive = item.type === menu.type;
      isShowMenuConstructor = menu.type === MENU_TYPE.TOP;

      return item;
    });

    this.setState({ typeMenu, isShowMenuConstructor });
  }

  renderColumnLayouts() {
    return LAYOUTS.map(layout => (
      <ColumnsLayoutItem
        key={`${layout.position}-${layout.type}`}
        onClick={this.handleClickColumn.bind(this, layout)}
        active={layout.type === this.activeData.layout}
        config={{ columns: layout.columns || [] }}
        className="ecos-dashboard-settings__container-group-item"
      />
    ));
  }

  renderMenuLayouts() {
    const { typeMenu } = this.state;

    return typeMenu.map(menu => (
      <MenuLayoutItem
        key={`${menu.position}-${menu.type}`}
        onClick={this.handleClickMenu.bind(this, menu)}
        active={menu.isActive}
        config={{ menu }}
        description={t(menu.description)}
        className="ecos-dashboard-settings__container-group-item"
      />
    ));
  }

  renderLayoutsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.columns.title')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.columns.subtitle')}</h6>
        <div className="ecos-dashboard-settings__container-group">{this.renderColumnLayouts()}</div>
      </React.Fragment>
    );
  }

  /*-------- start Menu --------*/

  handleDropEndMenu = result => {
    const { source, destination } = result;
    const state = {};

    this.setState({ draggableDestination: '' });

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const menuReorder = DndUtils.reorder(this.state[source.droppableId], source.index, destination.index);

      if (source.droppableId === DROPPABLE_ZONE.MENU_TO) {
        state.selectedMenuItems = menuReorder;
      }
    } else {
      const menuMove = DndUtils.move(this.filterAvailableMenuItems, this.state[destination.droppableId], source, destination);

      state.availableMenuItems = menuMove[DROPPABLE_ZONE.MENU_FROM];
      state.selectedMenuItems = menuMove[DROPPABLE_ZONE.MENU_TO];
    }

    this.setState(state);
  };

  handleRemoveMenuItem = ({ item }) => {
    const { selectedMenuItems, availableMenuItems } = this.state;

    if (!availableMenuItems.find(elm => elm.id === item.id)) {
      availableMenuItems.push(item);
    }

    this.setState({
      selectedMenuItems: selectedMenuItems.filter(menu => menu.id !== item.id),
      availableMenuItems
    });
  };

  renderMenuConstructor() {
    const { selectedMenuItems, isShowMenuConstructor, draggableDestination } = this.state;
    const filterMenuItems = this.filterAvailableMenuItems;

    if (!isShowMenuConstructor) {
      return null;
    }

    return (
      <React.Fragment>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.menu-constructor.subtitle')}</h6>
        <div className="ecos-dashboard-settings__drag ecos-dashboard-settings__drag_menu">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndMenu}>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_FROM}
              className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__drag-container_menu-from"
              placeholder={t('dashboard-settings.menu-constructor.placeholder1')}
              style={{ marginRight: '10px' }}
              direction="horizontal"
              isDropDisabled
              scrollHeight={270}
            >
              {filterMenuItems &&
                filterMenuItems.length &&
                filterMenuItems.map((item, index) => (
                  <DragItem
                    title={item.label}
                    key={`all-${item.id}-${item.dndId}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                  />
                ))}
            </Droppable>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_TO}
              placeholder={t('dashboard-settings.menu-constructor.placeholder2')}
              className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__drag-container_menu-to"
              childPosition="column"
              isDragingOver={draggableDestination === DROPPABLE_ZONE.MENU_TO}
              scrollHeight={270}
              // style={{ height: '270px' }}
            >
              {selectedMenuItems &&
                selectedMenuItems.length &&
                selectedMenuItems.map((item, index) => (
                  <DragItem
                    className="ecos-dashboard-settings__column-widgets__items__cell ecos-drag-item_full"
                    title={item.label}
                    key={`selected-${item.id}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                    removeItem={this.handleRemoveMenuItem}
                    selected={true}
                    canRemove={true}
                    item={item}
                  />
                ))}
            </Droppable>
          </DragDropContext>
        </div>
      </React.Fragment>
    );
  }

  renderMenuBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.menu.title')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.menu.subtitle')}</h6>
        <div className="ecos-dashboard-settings__container-group ecos-dashboard-settings__container-group_row">
          {this.renderMenuLayouts()}
        </div>
        {this.renderMenuConstructor()}
      </React.Fragment>
    );
  }

  /*-------- start Widgets --------*/

  handleDragUpdate = provided => {
    const { destination, source } = provided;

    if (!destination || !source) {
      this.setState({ draggableDestination: '' });
      return;
    }

    this.setState({
      draggableDestination: source.droppableId !== destination.droppableId ? destination.droppableId : ''
    });
  };

  handleDropEndWidget = result => {
    const { source, destination } = result;

    const { selectedWidgets } = this.state;
    const { availableWidgets } = this.props;

    this.setState({ draggableDestination: '' });

    if (!source || !destination || destination.droppableId === DROPPABLE_ZONE.WIDGETS_FROM) {
      return;
    }

    const colIndex = destination.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1];
    const colSelected = selectedWidgets[colIndex];

    switch (source.droppableId) {
      case DROPPABLE_ZONE.WIDGETS_FROM:
        const resultCopy = DndUtils.copy(availableWidgets, selectedWidgets[colIndex], source, destination, true);

        selectedWidgets[colIndex] = resultCopy;
        break;
      case destination.droppableId:
        selectedWidgets[colIndex] = DndUtils.reorder(colSelected, source.index, destination.index);
        break;
      default:
        const colSourceIndex = source.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1];
        const colSource = selectedWidgets[colSourceIndex];
        const resultMove = DndUtils.move(colSource, colSelected, source, destination);

        selectedWidgets[colSourceIndex] = resultMove[source.droppableId];
        selectedWidgets[colIndex] = resultMove[destination.droppableId];
        break;
    }

    this.setState({
      selectedWidgets
    });
  };

  handleRemoveWidget = ({ item }, indexColumn, indexWidget) => {
    const { selectedWidgets } = this.state;

    selectedWidgets[indexColumn].splice(indexWidget, 1);

    this.setState({ selectedWidgets });
  };

  renderWidgetColumns() {
    const { draggableDestination } = this.state;
    const { columns = [] } = this.selectedTypeLayout;
    const { widgets } = this.activeData;

    return (
      <div className={'ecos-dashboard-settings__drag-container_widgets-to'}>
        {columns.map((column, indexColumn) => {
          const key_id = `column-widgets-${indexColumn}`;

          return (
            <div className={'ecos-dashboard-settings__column-widgets'} key={key_id}>
              <div className={'ecos-dashboard-settings__column-widgets__title'}>
                {`${t('dashboard-settings.column')} ${indexColumn + 1}`}
              </div>
              <Droppable
                droppableId={DROPPABLE_ZONE.WIDGETS_TO + indexColumn}
                droppableIndex={indexColumn}
                childPosition="column"
                className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__column-widgets__items"
                placeholder={t('dashboard-settings.column.placeholder')}
                isDragingOver={draggableDestination === DROPPABLE_ZONE.WIDGETS_TO + indexColumn}
                scrollHeight={320}
              >
                {widgets &&
                  widgets[indexColumn] &&
                  widgets[indexColumn].map((widget, indexWidget) => (
                    <DragItem
                      key={widget.dndId}
                      draggableId={widget.dndId}
                      draggableIndex={indexWidget}
                      className={'ecos-dashboard-settings__column-widgets__items__cell'}
                      title={widget.label}
                      selected={true}
                      canRemove={true}
                      removeItem={response => {
                        this.handleRemoveWidget(response, indexColumn, indexWidget);
                      }}
                      getPositionAdjusment={this.draggablePositionAdjusment}
                      item={widget}
                    />
                  ))}
              </Droppable>
            </div>
          );
        })}
      </div>
    );
  }

  renderWidgetsBlock() {
    const { availableWidgets } = this.state;

    return (
      <React.Fragment>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.widgets.title')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{t('dashboard-settings.widgets.subtitle')}</h6>
        <div className="ecos-dashboard-settings__container-group">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndWidget}>
            <Droppable
              droppableId={DROPPABLE_ZONE.WIDGETS_FROM}
              className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__drag-container_col"
              placeholder={t('dashboard-settings.widgets.placeholder')}
              isDropDisabled={true}
              scrollHeight={136}
            >
              {availableWidgets &&
                availableWidgets.length &&
                availableWidgets.map((item, index) => (
                  <DragItem
                    isCloning
                    key={item.dndId}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    title={item.label}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                  />
                ))}
            </Droppable>
            {this.renderWidgetColumns()}
          </DragDropContext>
        </div>
      </React.Fragment>
    );
  }

  /*-------- start Buttons --------*/

  handleCloseClick = () => {
    this.closePage();
  };

  handleAcceptClick = () => {
    const { saveSettings, getAwayFromPage } = this.props;
    const { selectedWidgets: widgets, selectedMenuItems: links, typeMenu, tabs } = this.state;
    const layout = this.selectedTypeLayout;
    const activeMenuType = typeMenu.find(item => item.isActive);
    const menuType = activeMenuType ? activeMenuType.type : typeMenu[0].type;

    saveSettings({
      layoutType: layout.type,
      columns: layout.columns,
      menuType,
      widgets,
      links,
      tabs
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
        <div className="ecos-dashboard-settings__container">
          {this.renderTabsBlock()}
          {this.renderLayoutsBlock()}
          {this.renderWidgetsBlock()}
        </div>
        <div className="ecos-dashboard-settings__container">{this.renderMenuBlock()}</div>
        <div className="ecos-dashboard-settings__container">{this.renderButtons()}</div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSettings);
