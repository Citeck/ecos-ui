import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import get from 'lodash/get';
import { deepClone, t } from '../../helpers/util';
import { MENU_TYPE } from '../../constants';
import { DndUtils, DragItem, Droppable } from '../../components/Drag-n-Drop';
import { MenuLayoutItem } from '../../components/Layout';

const DROPPABLE_ZONE = {
  MENU_FROM: 'availableMenuItems',
  MENU_TO: 'selectedMenuItems'
};

class SetMenu extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    typeMenu: PropTypes.array,
    availableMenuItems: PropTypes.array,
    selectedMenuItems: PropTypes.array,
    setData: PropTypes.func,
    positionAdjustment: PropTypes.func
  };

  static defaultProps = {
    className: '',
    typeMenu: [],
    availableMenuItems: [],
    selectedMenuItems: [],
    setData: () => {},
    positionAdjustment: () => {}
  };

  state = {
    draggableDestination: ''
  };

  get filterAvailableMenuItems() {
    const { availableMenuItems, selectedMenuItems } = this.props;

    return availableMenuItems.filter(item => !selectedMenuItems.find(elm => item.id === elm.id));
  }

  handleDropEndMenu = result => {
    const { source, destination } = result;
    const state = {};

    this.setState({ draggableDestination: '' });

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const menuReorder = DndUtils.reorder(this.props[source.droppableId], source.index, destination.index);

      if (source.droppableId === DROPPABLE_ZONE.MENU_TO) {
        state.selectedMenuItems = menuReorder;
      }
    } else {
      const menuMove = DndUtils.move(this.filterAvailableMenuItems, this.props[destination.droppableId], source, destination);

      state.availableMenuItems = menuMove[DROPPABLE_ZONE.MENU_FROM];
      state.selectedMenuItems = menuMove[DROPPABLE_ZONE.MENU_TO];
    }

    this.props.setData(state);
  };

  handleRemoveMenuItem = ({ item }) => {
    const { selectedMenuItems, availableMenuItems } = this.props;

    if (!availableMenuItems.find(elm => elm.id === item.id)) {
      availableMenuItems.push(item);
    }

    this.props.setData({
      selectedMenuItems: selectedMenuItems.filter(menu => menu.id !== item.id),
      availableMenuItems
    });
  };

  handleClickMenu = menu => {
    let typeMenu = deepClone(this.props.typeMenu);

    if (menu.isActive) {
      return;
    }

    typeMenu = typeMenu.map(item => {
      item.isActive = item.type === menu.type;

      return item;
    });

    this.props.setData({ typeMenu });
  };

  renderMenuLayouts() {
    const { typeMenu } = this.props;

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

  renderMenuConstructor() {
    const { draggableDestination } = this.state;
    const { selectedMenuItems, positionAdjustment, typeMenu } = this.props;
    const filterMenuItems = this.filterAvailableMenuItems;
    const activeType = get(typeMenu.find(item => item.isActive), 'type', '');

    if (activeType === MENU_TYPE.LEFT) {
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
                    getPositionAdjusment={positionAdjustment}
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
                    getPositionAdjusment={positionAdjustment}
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

  render() {
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
}

export default SetMenu;
