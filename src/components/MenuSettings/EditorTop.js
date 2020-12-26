import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';

import { t } from '../../helpers/util';
import { Icon } from '../common';
import { DndUtils, DragItem, Droppable } from '../Drag-n-Drop';

import './style.scss';

const Labels = {
  TITLE: 'menu-settings.editor-items.title',
  TIP_NO_ITEMS: 'menu-settings.editor-items.none',
  TIP_DRAG_HERE: 'menu-settings.editor-items.drag-item-here'
};

const Names = {
  MENU_FROM: 'availableItems',
  MENU_TO: 'selectedItems'
};

class EditorLeftMenu extends React.Component {
  static propTypes = {
    availableItems: PropTypes.array,
    selectedItems: PropTypes.array,
    setData: PropTypes.func,
    positionAdjustment: PropTypes.func
  };

  static defaultProps = {
    availableItems: [],
    selectedItems: []
  };

  state = {
    draggableDestination: ''
  };

  componentDidMount() {}

  get filterAvailableItems() {
    const { availableItems, selectedItems } = this.props;

    return availableItems.filter(item => !selectedItems.find(elm => item.id === elm.id));
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

      if (source.droppableId === Names.MENU_TO) {
        state.selectedItems = menuReorder;
      }
    } else {
      const menuMove = DndUtils.move(this.filterAvailableItems, this.props[destination.droppableId], source, destination);

      state.availableItems = menuMove[Names.MENU_FROM];
      state.selectedItems = menuMove[Names.MENU_TO];
    }

    this.props.setData(state);
  };

  handleRemoveMenuItem = item => {
    const { selectedItems, availableItems, setData } = this.props;

    if (!availableItems.find(elm => elm.id === item.id)) {
      availableItems.push(item);
    }

    setData({
      selectedItems: selectedItems.filter(menu => menu.id !== item.id),
      availableItems
    });
  };

  getActionsComponents = item => {
    return [
      <Icon
        className="icon-small-close ecos-dashboard-settings__widgets-action ecos-dashboard-settings__widgets-action_remove"
        onClick={() => this.handleRemoveMenuItem(item)}
      />
    ];
  };

  render() {
    const { draggableDestination } = this.state;
    const { selectedItems } = this.props;
    const filterMenuItems = this.filterAvailableItems;

    return (
      <>
        <div className="ecos-menu-settings__title">{t(Labels.TITLE)}</div>
        <div className="ecos-menu-settings__drag ecos-menu-settings__drag_menu">
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndMenu}>
            <Droppable
              droppableId={Names.MENU_FROM}
              className="ecos-menu-settings__drag-container ecos-menu-settings__drag-container_menu-from"
              classNameView="ecos-menu-settings__drag-scrollbar-wrapper"
              placeholder={t(Labels.TIP_NO_ITEMS)}
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
                  />
                ))}
            </Droppable>
            <Droppable
              droppableId={Names.MENU_TO}
              placeholder={t(Labels.TIP_DRAG_HERE)}
              className="ecos-menu-settings__drag-container ecos-menu-settings__drag-container_menu-to"
              classNameView="ecos-menu-settings__drag-scrollbar-wrapper"
              childPosition="column"
              isDragingOver={draggableDestination === Names.MENU_TO}
              scrollHeight={270}
            >
              {selectedItems &&
                selectedItems.length &&
                selectedItems.map((item, index) => (
                  <DragItem
                    className="ecos-menu-settings__drag-item ecos-drag-item_full"
                    title={item.label}
                    key={`selected-${item.id}-${index}`}
                    draggableId={item.dndId}
                    draggableIndex={index}
                    selected={true}
                    item={item}
                    actionsComponent={this.getActionsComponents(item)}
                  />
                ))}
            </Droppable>
          </DragDropContext>
        </div>
      </>
    );
  }
}

export default EditorLeftMenu;
