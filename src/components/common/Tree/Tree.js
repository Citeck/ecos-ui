import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { SortableContainer } from '../../Drag-n-Drop';
import { ItemInterface, Labels } from './constants';
import TreeItem from './TreeItem';

import './style.scss';

// If you need css class for some element, don't create new prop, add to
// classNames [`${prefixClassName}--item-[описание элемента]`]: !!prefixClassName, if there isn't it there

// getActions can change or filter item.actionConfig, if actions are unusual or depend on item conditions.
// If there isn't getActions, component returns item.actionConfig.
// If there are both, you need to return something from getActions.

class Tree extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape(ItemInterface)),
    groupBy: PropTypes.string,
    prefixClassName: PropTypes.string,
    selectable: PropTypes.bool,
    draggable: PropTypes.bool,
    dragLvlTo: PropTypes.number,
    openAll: PropTypes.bool,
    moveInParent: PropTypes.bool,
    moveInLevel: PropTypes.bool,
    onToggleSelect: PropTypes.func,
    getActions: PropTypes.func,
    onClickAction: PropTypes.func,
    onClickIcon: PropTypes.func,
    onDragEnd: PropTypes.func,
    renderExtraComponents: PropTypes.func
  };

  static defaultProps = {
    data: [],
    groupBy: '',
    prefixClassName: '',
    moveInLevel: true,
    moveInParent: false,
    onToggleSelect: () => null,
    onClickAction: () => null,
    onDragEnd: () => null
  };

  get formattedTree() {
    const { data, groupBy } = this.props;

    if (!groupBy) {
      return data;
    }

    const getChildren = (filtered = [], types = filtered) => {
      return filtered.map(item => {
        if (!item[groupBy]) {
          return item;
        }

        return {
          ...item,
          items: getChildren(types.filter(type => type[groupBy] && type[groupBy] === item.id), types)
        };
      });
    };

    return data
      .filter(item => item[groupBy] === null)
      .map(item => ({
        ...item,
        items: getChildren(data.filter(type => type[groupBy] === item.id), data)
      }));
  }

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('ecos-tree__item_dragging');

    this.setState({ draggableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode } = this.state;

    event.stopPropagation();
    draggableNode.classList.toggle('ecos-tree__item_dragging');

    this.setState({ draggableNode: null });
    this.props.onDragEnd(oldIndex, newIndex);
  };

  renderEmpty() {
    const { data } = this.props;

    if (data.length) {
      return null;
    }

    return <div className="ecos-tree__empty">{t(Labels.EMPTY)}</div>;
  }

  renderTree() {
    const {
      onToggleSelect,
      selectable,
      prefixClassName,
      openAll,
      draggable,
      dragLvlTo,
      onClickAction,
      onClickIcon,
      moveInLevel,
      moveInParent,
      renderExtraComponents,
      getActions
    } = this.props;
    const data = this.formattedTree;

    if (!data.length) {
      return null;
    }

    return data.map((item, index) => (
      <TreeItem
        item={item}
        key={item.id}
        index={index}
        prefixClassName={prefixClassName}
        openAll={openAll}
        onToggleSelect={onToggleSelect}
        selectable={selectable}
        draggable={draggable}
        dragLvlTo={dragLvlTo}
        onClickAction={onClickAction}
        onClickIcon={onClickIcon}
        moveInLevel={moveInLevel}
        moveInParent={moveInParent}
        renderExtraComponents={renderExtraComponents}
        getActions={getActions}
        isMajor
      />
    ));
  }

  render() {
    const { prefixClassName, draggable } = this.props;

    const treeElement = (
      <div className={classNames('ecos-tree', { [`${prefixClassName}--tree`]: !!prefixClassName })}>
        {this.renderTree()}
        {this.renderEmpty()}
      </div>
    );

    return draggable ? (
      <SortableContainer
        axis="y"
        lockAxis="y"
        distance={3}
        onSortEnd={this.handleSortEnd}
        updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        {treeElement}
      </SortableContainer>
    ) : (
      treeElement
    );
  }
}

export default Tree;
