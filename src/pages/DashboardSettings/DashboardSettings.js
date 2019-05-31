import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Col, Container, Row } from 'reactstrap';
import { cloneDeep } from 'lodash';
import uuidV4 from 'uuid/v4';
import { LAYOUTS, MENU_POSITION, MENUS } from '../../constants/dashboard';
import { t } from '../../helpers/util';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import { DragDropContext, DragItem, Droppable } from '../../components/Drag-n-Drop';
import { Btn } from '../../components/common/btns';
import { getConfigPage, getMenuItems, getWidgets } from '../../actions/dashboardSettings';

import './style.scss';

const mapStateToProps = state => ({
  config: state.dashboardSettings.config,
  widgets: state.dashboardSettings.widgets,
  menuItems: state.dashboardSettings.menuItems
});

const mapDispatchToProps = dispatch => ({
  getConfigPage: () => dispatch(getConfigPage()),
  getWidgets: () => dispatch(getWidgets()),
  getMenuItems: () => dispatch(getMenuItems())
});

const DROPPABLE_ZONE = {
  MENU_FROM: 'menuItems',
  MENU_TO: 'menuSelected',
  WIDGETS_FROM: 'widgets',
  WIDGETS_TO: 'widgetsSelected'
};

class DashboardSettings extends React.Component {
  static propTypes = {
    config: PropTypes.shape({
      layoutPosition: PropTypes.number,
      widgets: PropTypes.arrayOf(
        PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            title: PropTypes.string
          })
        )
      ),
      menu: PropTypes.array
    }).isRequired,
    menuItems: PropTypes.array,
    widgets: PropTypes.array
  };

  static defaultProps = {
    config: {},
    widgets: [],
    menuItems: []
  };

  constructor(props) {
    super(props);

    this.state = {
      layouts: LAYOUTS,
      menus: MENUS,
      selectedLayout: {},
      widgetsSelected: [],
      isShowMenuConstructor: false,
      menuSelected: [],
      widgets: [],
      menuItems: []
    };
  }

  componentDidMount() {
    this.initDataRequest();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    let { config, menuItems, widgets } = this.props;
    let state = { ...this.state };

    if (JSON.stringify(config) !== JSON.stringify(nextProps.config)) {
      state = Object.assign(state, this.setStateByConfig(nextProps.config));
    }
    if (JSON.stringify(menuItems) !== JSON.stringify(nextProps.menuItems)) {
      state.menuItems = setDndId(nextProps.menuItems);
    }
    if (JSON.stringify(widgets) !== JSON.stringify(nextProps.widgets)) {
      state.widgets = setDndId(nextProps.widgets);
    }
    this.setState(state);
  }

  initDataRequest() {
    const { getConfigPage, getWidgets, getMenuItems } = this.props;

    getConfigPage();
    getWidgets();
    getMenuItems();
  }

  setStateByConfig(config) {
    const { layouts } = this.state;
    let { layoutPosition = 0, widgets: widgetsSelected, menu: menuSelected } = config;
    let selectedLayout = {};

    layouts.forEach(item => {
      item.isActive = item.position === layoutPosition;

      if (item.isActive) {
        selectedLayout = item;
      }
    });

    widgetsSelected = widgetsSelected.map(item => {
      return setDndId(item.widgets);
    });

    menuSelected = menuSelected.map(item => {
      return setDndId(item.widgets);
    });

    return { layouts, selectedLayout, widgetsSelected, menuSelected };
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

  draggablePositionAdjusment = () => ({
    top: this.bodyScrollTop,
    left: this.menuWidth
  });

  /*-------- start Layouts --------*/

  handleClickColumn(column) {
    let layouts = cloneDeep(this.state.layouts);
    let { widgetsSelected } = this.state;

    if (column.isActive) {
      return;
    }

    layouts = layouts.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === column.position) {
        let newWidgets = new Array(item.columns.length);

        newWidgets.fill([]);
        newWidgets.forEach((value, index) => {
          if (widgetsSelected && index < widgetsSelected.length) {
            newWidgets[index] = widgetsSelected[index] || [];
          }
        });

        widgetsSelected = newWidgets;
        item.isActive = true;
      }

      return item;
    });

    this.setState({ layouts, widgetsSelected });
  }

  handleClickMenu(menu) {
    let menus = cloneDeep(this.state.menus);
    let isShowMenuConstructor = false;

    if (menu.isActive) {
      return;
    }

    menus = menus.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === menu.position) {
        item.isActive = true;

        isShowMenuConstructor = item.type === MENU_POSITION.TOP;
      }

      return item;
    });

    this.setState({ menus, isShowMenuConstructor });
  }

  renderColumnLayouts() {
    const { layouts } = this.state;

    return layouts.map(layout => (
      <ColumnsLayoutItem
        key={layout.position}
        onClick={this.handleClickColumn.bind(this, layout)}
        active={layout.isActive}
        config={{ columns: layout.columns || [] }}
        className="ecos-ds__container-group-item"
      />
    ));
  }

  renderMenuLayouts() {
    const { menus } = this.state;

    return menus.map(menu => (
      <MenuLayoutItem
        key={menu.position}
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

    this.setState({ draggableDestination: '' });

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const menuItems = reorder(this.state[source.droppableId], source.index, destination.index);

      let state = { menuItems };

      if (source.droppableId === DROPPABLE_ZONE.MENU_TO) {
        state = { menuSelected: menuItems };
      }

      this.setState(state);
    } else {
      const result = move(this.state[source.droppableId], this.state[destination.droppableId], source, destination);

      this.setState({
        menuItems: result[DROPPABLE_ZONE.MENU_FROM],
        menuSelected: result[DROPPABLE_ZONE.MENU_TO]
      });
    }
  };

  onRemoveMenuItem = ({ item }) => {
    const { menuSelected, menuItems } = this.state;

    menuItems.push(item);

    this.setState({
      menuSelected: menuSelected.filter(menu => menu.id !== item.id),
      menuItems
    });
  };

  renderMenuConstructor() {
    const { menuItems, menuSelected, isShowMenuConstructor, draggableDestination } = this.state;

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
            >
              {menuItems &&
                menuItems.length &&
                menuItems.map((item, index) => (
                  <DragItem
                    title={item.name}
                    key={`all-${item.id}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                  />
                ))}
            </Droppable>
            <Droppable
              droppableId={DROPPABLE_ZONE.MENU_TO}
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-to"
              placeholder={t('Перетащите пункты меню сюда')}
              childPosition="column"
              isDragingOver={draggableDestination === DROPPABLE_ZONE.MENU_TO}
            >
              {menuSelected &&
                menuSelected.length &&
                menuSelected.map((item, index) => (
                  <DragItem
                    className="ecos-ds__column-widgets__items__cell ecos-drag-item_full"
                    title={item.name}
                    key={`selected-${item.id}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                    removeItem={this.onRemoveMenuItem}
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

    const { widgetsSelected } = this.state;
    const { widgets } = this.props;

    this.setState({ draggableDestination: '' });

    if (!destination || destination.droppableId === DROPPABLE_ZONE.WIDGETS_FROM) {
      return;
    }

    const colIndex = destination.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1]; //todo тут
    const colSelected = widgetsSelected[colIndex];

    switch (source.droppableId) {
      case DROPPABLE_ZONE.WIDGETS_FROM:
        const resultCopy = copy(widgets, widgetsSelected[colIndex], source, destination);

        widgetsSelected[colIndex] = resultCopy;
        break;
      case destination.droppableId:
        widgetsSelected[colIndex] = reorder(colSelected, source.index, destination.index);
        break;
      default:
        const colSourceIndex = source.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1]; //todo тут
        const colSource = widgetsSelected[colSourceIndex];
        const resultMove = move(colSource, colSelected, source, destination);

        widgetsSelected[colSourceIndex] = resultMove[source.droppableId];
        widgetsSelected[colIndex] = resultMove[destination.droppableId];
        break;
    }

    this.setState({
      widgetsSelected
    });
  };

  onRemoveWidget = ({ item }, indexColumn) => {
    const { widgetsSelected } = this.state;

    widgetsSelected[indexColumn].splice(item.index, 1);

    this.setState({ widgetsSelected });
  };

  renderWidgetColumns() {
    const { widgetsSelected, draggableDestination, selectedLayout } = this.state;
    const columns = selectedLayout.columns || [];

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
              >
                {widgetsSelected[indexColumn] &&
                  widgetsSelected[indexColumn].map((widget, indexWidget) => (
                    <DragItem
                      key={widget.dndId}
                      draggableId={widget.dndId}
                      draggableIndex={indexWidget}
                      className={'ecos-ds__column-widgets__items__cell'}
                      title={widget.title}
                      selected={true}
                      canRemove={true}
                      removeItem={response => {
                        this.onRemoveWidget(response, indexColumn);
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
    const { widgets } = this.state;

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
            >
              {widgets &&
                widgets.length &&
                widgets.map((item, index) => (
                  <DragItem
                    isCloning
                    key={item.dndId}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    title={item.title}
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

  handleClickCancel = () => {
    //this.initDataRequest();
  };

  handleClickAccept = () => {};

  renderButtons() {
    return (
      <div className={'ecos-ds__actions'}>
        <Btn className={'ecos-btn_x-step_10'} onClick={this.handleClickCancel}>
          {t('Отмена')}
        </Btn>
        <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.handleClickAccept}>
          {t('Применить')}
        </Btn>
      </div>
    );
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
          {this.renderLayoutsBlock()}
          {this.renderWidgetsBlock()}
          {this.renderMenuBlock()}
          {this.renderButtons()}
        </div>
      </Container>
    );
  }
}

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);

  result.splice(endIndex, 0, removed);

  return result;
};

const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  const result = {};

  destClone.splice(droppableDestination.index, 0, removed);
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};

const copy = (source = [], destination = [], droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const item = sourceClone[droppableSource.index];

  destClone.splice(droppableDestination.index, 0, { ...item });

  return setDndId(destClone);
};

const setDndId = items => {
  const arr = Array.from(items || []);

  arr.forEach(value => (value.dndId = uuidV4()));

  return arr;
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardSettings);
