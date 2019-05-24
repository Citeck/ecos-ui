import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { cloneDeep } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import SelectWidgets from '../../components/SelectWidgets';
import { MENU_POSITION } from '../../constants/dashboard';
import { DragDropContext, Droppable } from '../../components/Drag-n-Drop';
import { Draggable } from 'react-beautiful-dnd';

import './style.scss';

const DROPPABLE_ZONE = {
  MENU_FROM: 'items',
  MENU_TO: 'selected'
};

export default class DashboardSettings extends React.Component {
  state = {
    columns: [
      {
        position: 0,
        isActive: true,
        columns: [{}, { width: '25%' }]
      },
      {
        position: 1,
        isActive: false,
        columns: [{ width: '25%' }, {}]
      },
      {
        position: 2,
        isActive: false,
        columns: [{ width: '25%' }, {}, { width: '25%' }]
      },
      {
        position: 3,
        isActive: false,
        columns: [{}, {}, {}, {}]
      },
      {
        position: 4,
        isActive: false,
        columns: []
      }
    ],
    menus: [
      {
        position: 0,
        isActive: true,
        type: MENU_POSITION.LEFT,
        description: 'Меню слева'
      },
      {
        position: 1,
        isActive: false,
        type: MENU_POSITION.TOP,
        description: 'Меню в виде кнопок перед виджетами'
      }
    ],
    items: [{ id: 1, name: 'first' }, { id: 2, name: 'second' }],
    selected: []
  };

  handleClickColumn(column) {
    let columns = cloneDeep(this.state.columns);

    if (column.isActive) {
      return;
    }

    columns = columns.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === column.position) {
        item.isActive = true;
      }

      return item;
    });

    this.setState({ columns });
  }

  handleClickMenu(menu) {
    let menus = cloneDeep(this.state.menus);

    if (menu.isActive) {
      return;
    }

    menus = menus.map(item => {
      if (item.isActive) {
        item.isActive = false;
      }

      if (item.position === menu.position) {
        item.isActive = true;
      }

      return item;
    });

    this.setState({ menus });
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
        <h5 className="ecos-ds__container-title">Колонки</h5>
        <h6 className="ecos-ds__container-subtitle">Выберите расположение и количество колонок.</h6>
        <div className="ecos-ds__container-group">{this.renderColumnLayouts()}</div>
      </React.Fragment>
    );
  }

  handleDropEnd = result => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const items = this.reorder(this.state[source.droppableId], source.index, destination.index);

      let state = { items };

      if (source.droppableId === DROPPABLE_ZONE.MENU_TO) {
        state = { selected: items };
      }

      this.setState(state);
    } else {
      const result = this.move(this.state[source.droppableId], this.state[destination.droppableId], source, destination);

      this.setState({
        items: result[DROPPABLE_ZONE.MENU_FROM],
        selected: result[DROPPABLE_ZONE.MENU_TO]
      });
    }
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

  renderMenuBlock() {
    const { items, selected } = this.state;

    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">Меню</h5>
        <h6 className="ecos-ds__container-subtitle">Выберите расположения меню.</h6>
        <div className="ecos-ds__container-group">{this.renderMenuLayouts()}</div>

        <h6 className="ecos-ds__container-subtitle">Какие пункты меню следует отображать</h6>
        <div className="ecos-ds__drag">
          <DragDropContext onDragEnd={this.handleDropEnd}>
            <Droppable
              id={DROPPABLE_ZONE.MENU_FROM}
              className="ecos-ds__drag-container"
              placeholder="Нет доступных пунктов меню"
              style={{ width: '100%', height: '100%' }}
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="draggable-item">
                      {item.name}
                    </div>
                  )}
                </Draggable>
              ))}
            </Droppable>
            <Droppable
              id={DROPPABLE_ZONE.MENU_TO}
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-to"
              placeholder="Перетащите пункты меню сюда"
              style={{ width: '100%', height: '100%' }}
            >
              {selected.length &&
                selected.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="draggable-item">
                        {item.name}
                      </div>
                    )}
                  </Draggable>
                ))}
            </Droppable>
          </DragDropContext>
        </div>
      </React.Fragment>
    );
  }

  renderSelectWidgets() {
    //todo connect true data
    const arr = new Array(50);
    arr.fill({ title: 'this is really a very very very long string' });

    return <SelectWidgets items={arr} />;
  }

  renderWidgetsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">Виджеты</h5>
        <h6 className="ecos-ds__container-subtitle">Выберите где и какие виджеты отображать.</h6>
        {/*<div className="ecos-ds__container-group">{this.renderSelectWidgets()}</div>*/}
      </React.Fragment>
    );
  }

  render() {
    return (
      <Container>
        <Row>
          <Col md={12}>
            <h1 className="ecos-ds__header">Настройки домашней страницы</h1>
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
