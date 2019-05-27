import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { cloneDeep } from 'lodash';
import { ColumnsLayoutItem, MenuLayoutItem } from '../../components/Layout';
import SelectWidgets from '../../components/SelectWidgets';
import { MENU_POSITION } from '../../constants/dashboard';
import { DragDropContext, Droppable } from '../../components/Drag-n-Drop';

import './style.scss';

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
    ]
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

  renderMenuBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">Меню</h5>
        <h6 className="ecos-ds__container-subtitle">Выберите расположения меню.</h6>
        <div className="ecos-ds__container-group">{this.renderMenuLayouts()}</div>

        <h6 className="ecos-ds__container-subtitle">Какие пункты меню следует отображать</h6>
        <div className="ecos-ds__drag">
          <DragDropContext
            onDragEnd={data => {
              console.warn(data);
            }}
          >
            <Droppable id="menu" className="ecos-ds__drag-container" placeholder="Нет доступных пунктов меню" />
            <Droppable
              id="menu-items-store"
              className="ecos-ds__drag-container ecos-ds__drag-container_menu-to"
              placeholder="Перетащите пункты меню сюда"
            />
          </DragDropContext>
        </div>
      </React.Fragment>
    );
  }

  renderDragDropWidgets() {
    //todo connect true data
    const arr = new Array(1);

    for (let i = 0; i < arr.length; i++) {
      let key = `item-${i}`;
      arr[i] = {
        title: i + 'this is really a very very very long string',
        id: key
      };
    }

    return (
      <DragDropContext
        onDragEnd={data => {
          console.warn(data);
        }}
      >
        <SelectWidgets items={arr} />
        <Droppable id="selected-widgets-store" className="ecos-ds__drag-container" placeholder="Перетащите виджеты сюда" />
      </DragDropContext>
    );
  }

  renderWidgetsBlock() {
    return (
      <React.Fragment>
        <h5 className="ecos-ds__container-title">Виджеты</h5>
        <h6 className="ecos-ds__container-subtitle">Выберите где и какие виджеты отображать.</h6>
        <div className="ecos-ds__container-group">{this.renderDragDropWidgets()}</div>
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
