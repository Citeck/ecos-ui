import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { cloneDeep } from 'lodash';
import { MENU_POSITION } from '../../constants/dashboard';
import { t } from '../../helpers/util';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import { DragDropContext, DragItem, Droppable } from '../../components/Drag-n-Drop';

import './style.scss';

function getTestWidgets(size) {
  const arr = new Array(size);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = {
      title: i + ' string'.repeat(i + 1),
      id: `widget-${i}`
    };
  }

  return arr;
}

const DROPPABLE_ZONE = {
  MENU_FROM: 'menuItems',
  MENU_TO: 'menuSelected',
  WIDGETS_FROM: 'widgets',
  WIDGETS_TO: 'widgetsSelected'
};

export default class DashboardSettings extends React.Component {
  constructor(props) {
    super(props);

    //fixme test data
    const widgets = getTestWidgets(20);

    this.state = {
      widgets,
      widgetsSelected: [],
      columns: [
        {
          position: 0,
          isActive: true,
          columns: [{ widgets: [] }, { width: '25%', widgets: [] }]
        },
        {
          position: 1,
          isActive: false,
          columns: [{ width: '25%', widgets: [] }, { widgets: [] }]
        },
        {
          position: 2,
          isActive: false,
          columns: [{ width: '25%' }, {}, { width: '25%' }]
        },
        {
          position: 3,
          isActive: false,
          columns: [{ widgets: [] }, { widgets: [] }, { widgets: [] }, { widgets: [] }]
        },
        {
          position: 4,
          isActive: false,
          columns: [{ widgets: [] }]
        }
      ],
      menus: [
        {
          position: 0,
          isActive: true,
          type: MENU_POSITION.LEFT,
          description: t('Меню слева')
        },
        {
          position: 1,
          isActive: false,
          type: MENU_POSITION.TOP,
          description: t('Меню в виде кнопок перед виджетами')
        }
      ],
      isShowMenuConstructor: false,
      menuItems: [
        { id: 1, name: t('Главная') },
        { id: 2, name: t('Домашняя') },
        { id: 22, name: t('Дашборд') },
        { id: 23, name: t('Настройки') },
        { id: 24, name: t('Заказы') },
        { id: 25, name: t('Клиенты') },
        { id: 26, name: t('Отчеты') },
        { id: 27, name: t('Банкеты') },
        { id: 28, name: t('Парковки') },
        { id: 29, name: t('ГСМ') },
        { id: 21, name: t('Договоры') },
        { id: 222, name: t('Встречи') },
        { id: 221, name: t('Календарь событий') },
        { id: 223, name: t('График отпусков') },
        { id: 224, name: t('Основные ссылки') },
        { id: 225, name: t('Социальные сети') },
        { id: 226, name: t('Открытие источники') }
      ],
      menuSelected: []
    };

    this.initWidgetsSelected();
  }

  initWidgetsSelected() {
    this.state.widgetsSelected = this.selectedLayout.columns.map(item => {
      return this.setSelected(item.widgets);
    });
  }

  setSelected = items => {
    items = items || [];

    return items.map(widget => {
      return { ...widget, selected: true, canRemove: true };
    });
  };

  reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);

    result.splice(endIndex, 0, removed);

    return result;
  };

  move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    const result = {};

    destClone.splice(droppableDestination.index, 0, removed);
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
  };

  /*--------- start Layouts ----------*/

  handleClickColumn(column) {
    let columns = cloneDeep(this.state.columns);
    let { widgetsSelected } = this.state;

    if (column.isActive) {
      return;
    }

    columns = columns.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === column.position) {
        let newWidgets = new Array(item.columns.length);

        newWidgets.fill([]);
        newWidgets.forEach((value, index) => {
          newWidgets[index] = widgetsSelected[index];
        });

        widgetsSelected = newWidgets;
        item.isActive = true;
      }

      return item;
    });

    this.setState({ columns, widgetsSelected });
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
    const { columns } = this.state;

    return columns.map(layout => (
      <ColumnsLayoutItem
        key={layout.position}
        onClick={this.handleClickColumn.bind(this, layout)}
        active={layout.isActive}
        config={{ columns: layout.columns }}
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

  renderColumnsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">{t('Колонки')}</h5>
        <h6 className="ecos-ds__container-subtitle">{t('Выберите расположение и количество колонок.')}</h6>
        <div className="ecos-ds__container-group">{this.renderColumnLayouts()}</div>
      </React.Fragment>
    );
  }

  get selectedLayout() {
    const { columns } = this.state;
    const result = columns.filter(item => item.isActive);

    return result && result.length ? result[0] : {};
  }

  get selectedLayoutIndex() {
    const { columns } = this.state;

    return columns.findIndex(item => item.isActive);
  }

  /*--------- start Menu ----------*/

  handleDropEndMenu = result => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const menuItems = this.reorder(this.state[source.droppableId], source.index, destination.index);

      let state = { menuItems };

      if (source.droppableId === DROPPABLE_ZONE.MENU_TO) {
        state = { menuSelected: menuItems };
      }

      this.setState(state);
    } else {
      const result = this.move(this.state[source.droppableId], this.state[destination.droppableId], source, destination);

      this.setState({
        menuItems: result[DROPPABLE_ZONE.MENU_FROM],
        menuSelected: result[DROPPABLE_ZONE.MENU_TO]
      });
    }
  };

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

  onRemoveMenuItem = (item, index) => {
    const { menuSelected, menuItems } = this.state;
    const { selected, canRemove, ...newItem } = item;

    menuItems.push(newItem);
    menuSelected.splice(index, 1);

    this.setState({ menuSelected, menuItems });
  };

  renderMenuConstructor() {
    const { menuItems, menuSelected, isShowMenuConstructor } = this.state;

    if (!isShowMenuConstructor) {
      return null;
    }

    return (
      <React.Fragment>
        <h6 className="ecos-ds__container-subtitle">{t('Какие пункты меню следует отображать')}</h6>
        <div className="ecos-ds__drag">
          <DragDropContext onDragEnd={this.handleDropEndMenu}>
            <Droppable
              id={DROPPABLE_ZONE.MENU_FROM}
              className="ecos-ds__drag-container"
              placeholder={t('Нет доступных пунктов меню')}
              style={{ marginRight: '10px' }}
              direction="horizontal"
              isDropDisabled={true}
            >
              {menuItems.length &&
                menuItems.map((item, index) => (
                  <DragItem
                    title={item.name}
                    key={item.id}
                    index={index}
                    getPositionAdjusment={this.draggablePositionAdjusment}
                    {...item}
                  />
                ))}
            </Droppable>
            <Droppable
              id={DROPPABLE_ZONE.MENU_TO}
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-to"
              placeholder={t('Перетащите пункты меню сюда')}
              direction="horizontal"
            >
              {menuSelected.length &&
                menuSelected.map((item, index) => {
                  const val = { ...item, selected: true, canRemove: true };

                  return (
                    <DragItem
                      title={item.name}
                      key={item.id}
                      index={index}
                      getPositionAdjusment={this.draggablePositionAdjusment}
                      removeItem={item => {
                        this.onRemoveMenuItem(item, index);
                      }}
                      {...val}
                    />
                  );
                })}
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

  /*--------- start Widgets ----------*/

  handleDropEndWidget = result => {
    const { source, destination } = result;
    const { widgets, widgetsSelected } = this.state;

    if (!destination || destination.droppableId === DROPPABLE_ZONE.WIDGETS_FROM) {
      return;
    }

    const colIndex = destination.droppableId.split(DROPPABLE_ZONE.WIDGETS_TO)[1];
    const colSelected = widgetsSelected[colIndex];

    if (source.droppableId === destination.droppableId) {
      widgetsSelected[colIndex] = this.reorder(colSelected, source.index, destination.index);
    } else {
      const result = this.move(widgets, colSelected, source, destination);

      widgetsSelected[colIndex] = this.setSelected(result[destination.droppableId]);
    }

    this.setState({
      widgetsSelected
    });
  };

  onRemoveWidget = (item, colIndex) => {
    const { widgetsSelected } = this.state;

    if (this.selectedLayoutIndex >= 0) {
      widgetsSelected[colIndex].splice(item.index, 1);

      this.setState({ widgetsSelected });
    }
  };

  renderDragItems(items, onRemoveItem, className = '') {
    if (!items || (items && !items.length)) {
      return null;
    }

    return items.map((item, index) => {
      return (
        <DragItem
          key={item.id}
          {...item}
          index={index}
          className={className}
          getPositionAdjusment={this.draggablePositionAdjusment}
          removeItem={onRemoveItem}
        />
      );
    });
  }

  renderWidgetColumns() {
    const { widgetsSelected } = this.state;

    return (
      <div className={'ecos-ds__drag-container_widgets-to'}>
        {this.selectedLayout.columns.map((item, index) => {
          const key_id = `column-widgets-${index}`;

          return (
            <div className={'ecos-ds__column-widgets'} key={key_id}>
              <div className={'ecos-ds__column-widgets__title'}>{`${t('Колонка')} ${index + 1}`}</div>
              <Droppable
                id={DROPPABLE_ZONE.WIDGETS_TO + index}
                className="ecos-ds__drag-container ecos-ds__column-widgets__items"
                placeholder={t('Перетащите сюда виджеты')}
              >
                {this.renderDragItems(
                  widgetsSelected[index],
                  item => {
                    this.onRemoveWidget(item, index);
                  },
                  'ecos-ds__column-widgets__items__cell'
                )}
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
          <DragDropContext onDragEnd={this.handleDropEndWidget}>
            <Droppable
              id={DROPPABLE_ZONE.WIDGETS_FROM}
              className="ecos-ds__drag-container ecos-ds__drag-container_col"
              placeholder={t('Нет доступных виджетов')}
              isDropDisabled={true}
            >
              {this.renderDragItems(widgets)}
            </Droppable>
            {this.renderWidgetColumns()}
          </DragDropContext>
        </div>
      </React.Fragment>
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
          {this.renderColumnsBlock()}
          {this.renderWidgetsBlock()}
          {this.renderMenuBlock()}
        </div>
      </Container>
    );
  }
}
