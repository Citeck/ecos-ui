import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import cloneDeep from 'lodash/cloneDeep';
import * as queryString from 'query-string';
import get from 'lodash/get';

import { arrayCompare, t } from '../../helpers/util';
import { LAYOUTS, TYPE_MENU } from '../../constants/dashboard';
import { MENU_TYPE, SAVE_STATUS, URL } from '../../constants';
import { getAwayFromPage, initDashboardSettings, saveDashboardConfig } from '../../actions/dashboardSettings';
import { initMenuSettings } from '../../actions/menu';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import { DndUtils, DragDropContext, DragItem, Droppable } from '../../components/Drag-n-Drop';
import { Btn } from '../../components/common/btns';
import Loader from '../../components/common/Loader/Loader';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { getSortedUrlParams } from '../../helpers/urls';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    menuType: get(state, ['menu', 'type']),
    links: get(state, ['menu', 'links']),
    ...get(state, ['dashboardSettings', 'config'])
  },
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
    config: PropTypes.shape({
      layoutType: PropTypes.string,
      menuType: PropTypes.string,
      widgets: PropTypes.array,
      links: PropTypes.array
    }).isRequired,
    availableMenuItems: PropTypes.array,
    availableWidgets: PropTypes.array
  };

  static defaultProps = {
    config: {},
    availableWidgets: [],
    availableMenuItems: []
  };

  constructor(props) {
    super(props);

    const state = {
      layouts: LAYOUTS,
      selectedWidgets: [],
      selectedMenuItems: [],
      typeMenu: TYPE_MENU,
      isShowMenuConstructor: get(props, ['config', 'menuType']),
      availableWidgets: DndUtils.setDndId(props.availableWidgets),
      availableMenuItems: DndUtils.setDndId(props.availableMenuItems),
      urlParams: getSortedUrlParams()
    };

    this.state = {
      ...state,
      ...this.setStateByConfig(props.config, state)
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    const { urlParams } = this.state;
    const newUrlParams = getSortedUrlParams();
    let { config, availableMenuItems, availableWidgets, saveResult = {} } = this.props;
    let state = {};

    if (urlParams !== newUrlParams) {
      this.setState({ urlParams: newUrlParams });
      this.fetchData(nextProps);
    }

    if (JSON.stringify(config) !== JSON.stringify(nextProps.config)) {
      const resultConfig = this.setStateByConfig(nextProps.config);

      state = { ...state, ...resultConfig };
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

    // if (config.menuType !== nextProps.config.menuType) {
    state.isShowMenuConstructor = nextProps.config.menuType === MENU_TYPE.TOP;
    // }

    this.setState({ ...state });

    if (nextProps.saveResult && saveResult.status !== nextProps.saveResult.status && nextProps.saveResult.status !== SAVE_STATUS.FAILURE) {
      this.handleCloseClick(nextProps.saveResult);
    }
  }

  fetchData(props = this.props) {
    const { initDashboardSettings, initMenuSettings } = props;
    const { recordRef, dashboardId } = this.getPathInfo(props);

    initDashboardSettings({ recordRef, dashboardId });
    initMenuSettings();
  }

  setStateByConfig(config, state = this.state) {
    const { layouts, typeMenu } = state;
    let { layoutType, menuType, widgets: selectedWidgets, links: selectedMenuItems } = config;
    let selectedLayout = {};

    layouts.forEach(item => {
      item.isActive = item.type === layoutType;

      if (item.isActive) {
        selectedLayout = item;
      }
    });
    typeMenu.forEach(item => {
      item.isActive = item.type === menuType;
    });

    selectedWidgets = this.setSelectedWidgets(selectedLayout, selectedWidgets);
    selectedWidgets = selectedWidgets.map(item => {
      return DndUtils.setDndId(item);
    });

    selectedMenuItems = DndUtils.setDndId(selectedMenuItems);

    return { layouts, selectedWidgets, selectedMenuItems };
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

  get selectedLayout() {
    const { layouts = [] } = this.state;

    return layouts.find(item => item.isActive) || {};
  }

  get filterAvailableMenuItems() {
    const { availableMenuItems, selectedMenuItems } = this.state;

    return availableMenuItems.filter(item => !selectedMenuItems.find(elm => item.id === elm.id));
  }

  draggablePositionAdjusment = () => {
    const menuType = get(this.props, ['config', 'menuType']);

    return {
      top: menuType === MENU_TYPE.LEFT ? this.bodyScrollTop : 0,
      left: menuType === MENU_TYPE.LEFT ? this.menuWidth : 0
    };
  };

  /*-------- start Layouts --------*/

  handleClickColumn(layout) {
    let { selectedWidgets = [], layouts: oldLayouts } = this.state;
    let layouts = cloneDeep(oldLayouts);

    if (layout.isActive) {
      return;
    }

    layouts = layouts.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.type === layout.type) {
        selectedWidgets = this.setSelectedWidgets(item, selectedWidgets);
        item.isActive = true;
      }

      return item;
    });

    this.setState({ layouts, selectedWidgets });
  }

  handleClickMenu(menu) {
    let typeMenu = cloneDeep(this.state.typeMenu);
    let isShowMenuConstructor = false;

    if (menu.isActive) {
      return;
    }

    typeMenu = typeMenu.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.type === menu.type) {
        item.isActive = true;

        isShowMenuConstructor = item.type === MENU_TYPE.TOP;
      }

      return item;
    });

    this.setState({ typeMenu, isShowMenuConstructor });
  }

  renderColumnLayouts() {
    const { layouts } = this.state;

    return layouts.map(layout => (
      <ColumnsLayoutItem
        key={`${layout.position}-${layout.type}`}
        onClick={this.handleClickColumn.bind(this, layout)}
        active={layout.isActive}
        config={{ columns: layout.columns || [] }}
        className="ecos-ds__container-group-item"
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
        className="ecos-ds__container-group-item"
      />
    ));
  }

  renderLayoutsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">{t('dashboard-settings.columns.title')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('dashboard-settings.columns.subtitle')}</h6>
        <div className="ecos-ds__container-group">{this.renderColumnLayouts()}</div>
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
        <h6 className="ecos-ds__container-subtitle">{t('dashboard-settings.menu-constructor.subtitle')}</h6>
        <div className="ecos-ds__drag ecos-ds__drag_menu">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndMenu}>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_FROM}
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-from"
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
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-to"
              childPosition="column"
              isDragingOver={draggableDestination === DROPPABLE_ZONE.MENU_TO}
              scrollHeight={270}
              // style={{ height: '270px' }}
            >
              {selectedMenuItems &&
                selectedMenuItems.length &&
                selectedMenuItems.map((item, index) => (
                  <DragItem
                    className="ecos-ds__column-widgets__items__cell ecos-drag-item_full"
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
        <h5 className="ecos-ds__container-title">{t('dashboard-settings.menu.title')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('dashboard-settings.menu.subtitle')}</h6>
        <div className="ecos-ds__container-group ecos-ds__container-group_row">{this.renderMenuLayouts()}</div>
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
    const { selectedWidgets, draggableDestination } = this.state;
    const columns = this.selectedLayout.columns || [];

    return (
      <div className={'ecos-ds__drag-container_widgets-to'}>
        {columns.map((column, indexColumn) => {
          const key_id = `column-widgets-${indexColumn}`;

          return (
            <div className={'ecos-ds__column-widgets'} key={key_id}>
              <div className={'ecos-ds__column-widgets__title'}>{`${t('dashboard-settings.column')} ${indexColumn + 1}`}</div>
              <Droppable
                droppableId={DROPPABLE_ZONE.WIDGETS_TO + indexColumn}
                droppableIndex={indexColumn}
                childPosition="column"
                className="ecos-ds__drag-container ecos-ds__column-widgets__items"
                placeholder={t('dashboard-settings.column.placeholder')}
                isDragingOver={draggableDestination === DROPPABLE_ZONE.WIDGETS_TO + indexColumn}
                scrollHeight={320}
              >
                {selectedWidgets &&
                  selectedWidgets[indexColumn] &&
                  selectedWidgets[indexColumn].map((widget, indexWidget) => (
                    <DragItem
                      key={widget.dndId}
                      draggableId={widget.dndId}
                      draggableIndex={indexWidget}
                      className={'ecos-ds__column-widgets__items__cell'}
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
        <h5 className="ecos-ds__container-title">{t('dashboard-settings.widgets.title')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('dashboard-settings.widgets.subtitle')}</h6>
        <div className="ecos-ds__container-group">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndWidget}>
            <Droppable
              droppableId={DROPPABLE_ZONE.WIDGETS_FROM}
              className="ecos-ds__drag-container ecos-ds__drag-container_col"
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
    const { pathDashboard } = this.getPathInfo();

    changeUrlLink(pathDashboard, { openNewTab: true });
  };

  handleAcceptClick = () => {
    const { saveSettings, getAwayFromPage } = this.props;
    const { selectedWidgets: widgets, selectedMenuItems: links, typeMenu } = this.state;
    const layout = this.selectedLayout;
    const menuType = typeMenu.find(item => item.isActive).type;

    saveSettings({
      layoutType: layout.type,
      columns: layout.columns,
      menuType,
      widgets,
      links
    });
    getAwayFromPage();
  };

  renderButtons() {
    return (
      <div className={'ecos-ds__actions'}>
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
      return <Loader className={`ecos-ds__loader-wrapper`} />;
    }

    return null;
  }

  render() {
    return (
      <Container>
        <Row>
          <Col md={12}>
            <h1 className="ecos-ds__header">{t('dashboard-settings.page-title')}</h1>
          </Col>
        </Row>

        <div className="ecos-ds__container">
          {this.renderLoader()}
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
