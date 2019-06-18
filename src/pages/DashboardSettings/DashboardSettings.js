import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import { cloneDeep } from 'lodash';
import { path } from 'ramda';
import { arrayCompare, t } from '../../helpers/util';
import { LAYOUTS, TYPE_MENU } from '../../constants/dashboardSettings';
import { MENU_TYPE, SAVE_STATUS } from '../../constants';
import { initDashboardSettings, saveDashboardConfig } from '../../actions/dashboardSettings';
import { initMenuSettings } from '../../actions/menu';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import { DndUtils, DragDropContext, DragItem, Droppable } from '../../components/Drag-n-Drop';
import { Btn } from '../../components/common/btns';
import Loader from '../../components/common/Loader/Loader';

import './style.scss';

const mapStateToProps = state => ({
  config: {
    menuType: path(['menu', 'type'], state),
    links: path(['menu', 'links'], state),
    ...path(['dashboardSettings', 'config'], state)
  },
  availableMenuItems: path(['menu', 'availableMenuItems'], state),
  isLoadingMenu: path(['menu', 'isLoading'], state),
  availableWidgets: path(['dashboardSettings', 'availableWidgets'], state),
  isLoading: path(['dashboardSettings', 'isLoading'], state),
  saveResult: path(['dashboardSettings', 'saveResult'], state)
});

const mapDispatchToProps = dispatch => ({
  initMenuSettings: () => dispatch(initMenuSettings()),
  initDashboardSettings: ({ recordId }) => dispatch(initDashboardSettings({ recordId })),
  saveSettings: payload => dispatch(saveDashboardConfig(payload))
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

  get pathInfo() {
    const { url, params } = this.props.match;
    const indexSet = url.lastIndexOf('/settings');
    const pathDashboard = url.substring(0, indexSet);
    const recordId = params.id || '';

    return {
      url,
      pathDashboard,
      recordId
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      layouts: LAYOUTS,
      selectedWidgets: [],
      availableWidgets: [],
      typeMenu: TYPE_MENU,
      isShowMenuConstructor: path(['config', 'menuType'], props) === MENU_TYPE.TOP,
      selectedMenuItems: [],
      availableMenuItems: []
    };
  }

  componentDidMount() {
    const { initDashboardSettings, initMenuSettings } = this.props;
    const { recordId } = this.pathInfo;

    initDashboardSettings({ recordId });
    initMenuSettings();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    let { config, availableMenuItems, availableWidgets, saveResult = {} } = this.props;
    let state = {};

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

    if (config.menuType !== nextProps.config.menuType) {
      state.isShowMenuConstructor = nextProps.config.menuType === MENU_TYPE.TOP;
    }

    this.setState({ ...state });

    if (nextProps.saveResult && saveResult.status !== nextProps.saveResult.status && nextProps.saveResult.status !== SAVE_STATUS.FAILURE) {
      this.handleCloseClick(nextProps.saveResult.recordId);
    }
  }

  setStateByConfig(config) {
    const { layouts, typeMenu } = this.state;
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
    const menuType = path(['config', 'menuType'], this.props);

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
        description={menu.description}
        className="ecos-ds__container-group-item"
      />
    ));
  }

  renderLayoutsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">{t('Колонки')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('Выберите расположение и количество колонок.')}</h6>
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
      const menuMove = DndUtils.move(this.state[source.droppableId], this.state[destination.droppableId], source, destination);

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
        <h6 className="ecos-ds__container-subtitle">{t('Какие пункты меню следует отображать')}</h6>
        <div className="ecos-ds__drag ecos-ds__drag_menu">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndMenu}>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_FROM}
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-from"
              placeholder={t('Нет доступных пунктов меню')}
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
                    key={`all-${item.id}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                  />
                ))}
            </Droppable>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_TO}
              placeholder={t('Перетащите пункты меню сюда')}
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
        <h5 className="ecos-ds__container-title">{t('Меню')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('Выберите расположения меню.')}</h6>
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
        const resultCopy = DndUtils.copy(availableWidgets, selectedWidgets[colIndex], source, destination);

        selectedWidgets[colIndex] = resultCopy;
        break;
      case destination.droppableId:
        selectedWidgets[colIndex] = DndUtils.reorder(colSelected, source.index, destination.index);
        break;
      default:
        const colSourceIndex = source.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1]; //todo тут
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
              <div className={'ecos-ds__column-widgets__title'}>{`${t('Колонка')} ${indexColumn + 1}`}</div>
              <Droppable
                droppableId={DROPPABLE_ZONE.WIDGETS_TO + indexColumn}
                droppableIndex={indexColumn}
                childPosition="column"
                className="ecos-ds__drag-container ecos-ds__column-widgets__items"
                placeholder={t('Перетащите сюда виджеты')}
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
        <h5 className="ecos-ds__container-title">{t('Виджеты')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('Выберите где и какие виджеты отображать.')}</h6>
        <div className="ecos-ds__container-group">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndWidget}>
            <Droppable
              droppableId={DROPPABLE_ZONE.WIDGETS_FROM}
              className="ecos-ds__drag-container ecos-ds__drag-container_col"
              placeholder={t('Нет доступных виджетов')}
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

  handleCloseClick = recordId => {
    let path = this.pathInfo.pathDashboard;

    if (recordId && !this.pathInfo.recordId) {
      path += recordId;
    }

    window.location.href = path;
  };

  handleAcceptClick = () => {
    const { saveSettings } = this.props;
    const { selectedWidgets: widgets, selectedMenuItems: links, typeMenu } = this.state;
    const layout = this.selectedLayout;
    const menuType = typeMenu.find(item => item.isActive).type;

    saveSettings({
      layoutType: layout.type,
      columns: layout.columns,
      menuType,
      widgets,
      links,
      recordId: this.pathInfo.recordId
    });
  };

  renderButtons() {
    return (
      <div className={'ecos-ds__actions'}>
        <Btn className={'ecos-btn_x-step_10'} onClick={this.handleCloseClick}>
          {t('Отмена')}
        </Btn>
        <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.handleAcceptClick}>
          {t('Применить')}
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
            <h1 className="ecos-ds__header">{t('Настройки домашней страницы')}</h1>
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
