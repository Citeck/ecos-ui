import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import get from 'lodash/get';

import { arrayCompare, t } from '../../../helpers/util';
import { Icon } from '../../common';
import { Checkbox } from '../../common/form';
import { SortableContainer, SortableElement, SortableHandle } from '../../Drag-n-Drop';
import Actions from './Actions';

import './style.scss';

const ItemInterface = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  name: PropTypes.string,
  icon: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string
  }),
  selected: PropTypes.bool,
  multiple: PropTypes.bool,
  mandatory: PropTypes.bool,
  locked: PropTypes.bool,
  items: PropTypes.array,
  actionConfig: PropTypes.array,
  customComponents: PropTypes.array
};

const Labels = {
  EMPTY: 'tree-component.empty',
  TIP_CANT_CHANGE: 'tree-component.tooltip.cannot-be-changes'
};

const STEP_LVL = 1;

class TreeItem extends Component {
  static propTypes = {
    item: PropTypes.shape(ItemInterface),
    isChild: PropTypes.bool,
    openAll: PropTypes.bool,
    level: PropTypes.number,
    className: PropTypes.string,
    onToggleSelect: PropTypes.func,
    onClickAction: PropTypes.func
  };

  static defaultProps = {
    item: {},
    isChild: false,
    openAll: false,
    level: 1,
    className: '',
    onClickAction: () => null
  };

  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.openAll
    };
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { item, isChild, openAll } = this.props;
    const { isOpen } = this.state;

    return (
      nextState.isOpen !== isOpen ||
      !arrayCompare(nextProps.item.items, item.items) ||
      nextProps.item.id !== item.id ||
      nextProps.item.selected !== item.selected ||
      JSON.stringify(nextProps.item.actionConfig) !== JSON.stringify(item.actionConfig) ||
      nextProps.openAll !== openAll ||
      nextProps.isChild !== isChild
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.openAll !== this.props.openAll && this.props.openAll !== this.state.isOpen) {
      this.setState({ isOpen: this.props.openAll });
    }
  }

  get title() {
    const { item } = this.props;

    if (item.locked) {
      return t(Labels.TIP_CANT_CHANGE);
    }

    if (item.selected) {
      return '';
    }

    return t(Labels.TIP_CANT_CHANGE);
  }

  get hasGrandchildren() {
    const { item } = this.props;
    return get(item, 'items.length') && item.items.some(child => !!child.items.length);
  }

  handleToggleOpen = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleToggleCheck = ({ checked }) => {
    const { item, selectable } = this.props;

    if (checked === item.selected || item.locked || !selectable) {
      return;
    }

    this.props.onToggleSelect({ id: this.props.item.id, checked });
  };

  handleActionItem = action => {
    this.props.onClickAction({ action, id: this.props.item.id });
  };

  renderArrow() {
    const { item } = this.props;
    const { isOpen } = this.state;

    if (!get(item, 'items.length')) {
      return null;
    }

    return (
      <Icon
        className={classNames('ecos-tree__item-element-arrow icon-right', {
          'ecos-tree__item-element-arrow_open': isOpen
        })}
        onClick={this.handleToggleOpen}
      />
    );
  }

  renderChildren() {
    const { item, openAll, level, draggable, dragLvlTo, className, onToggleSelect, onClickAction, moveInLevel, moveInParent } = this.props;
    const { isOpen } = this.state;

    if (!get(item, 'items.length')) {
      return null;
    }

    return (
      <Collapse isOpen={isOpen} className="ecos-tree__item-element-children">
        {item.items.map((child, index) => (
          <TreeItem
            item={child}
            key={child.id}
            index={index}
            isChild
            className={className}
            level={level + STEP_LVL}
            onToggleSelect={onToggleSelect}
            onClickAction={onClickAction}
            openAll={openAll}
            draggable={draggable}
            dragLvlTo={dragLvlTo}
            moveInLevel={moveInLevel}
            moveInParent={moveInParent}
            parentKey={item.id}
          />
        ))}
      </Collapse>
    );
  }

  render() {
    const {
      isChild,
      item,
      selectable,
      className,
      dragLvlTo,
      draggable,
      level,
      index,
      moveInLevel,
      moveInParent,
      parentKey = ''
    } = this.props;
    const { isOpen } = this.state;
    const { items, selected, locked, icon, name, actionConfig, customComponents } = item || {};
    const canDrag = draggable && item.draggable !== false && (dragLvlTo == null || dragLvlTo >= level);

    const itemElement = (
      <div
        className={classNames('ecos-tree__item', {
          'ecos-tree__item_child': isChild,
          'ecos-tree__item_parent': items && items.length,
          'ecos-tree__item_open': isOpen,
          'ecos-tree__item_not-selected': !selected,
          'ecos-tree__item_locked': locked,
          'ecos-tree__item_has-grandchildren': this.hasGrandchildren
        })}
      >
        <div className={classNames('ecos-tree__item-element', className)}>
          {this.renderArrow()}
          {selectable && (
            <Checkbox
              className="ecos-tree__item-element-check"
              onChange={this.handleToggleCheck}
              checked={selected}
              disabled={locked}
              title={this.title}
            />
          )}
          {!!icon && <Icon className="ecos-tree__item-element-icon icon-empty-icon" />}
          {/*todo icon*/}
          <div
            className={classNames('ecos-tree__item-element-label', {
              'ecos-tree__item-element-label_locked': item.locked
            })}
          >
            {t(name)}
          </div>
          {customComponents && !!customComponents.length && (
            <div className="ecos-tree__item-element-custom-components">{customComponents}</div>
          )}
          <div className="ecos-tree__item-element-space" />
          {actionConfig && !!actionConfig.length && (
            <div className="ecos-tree__item-element-actions">
              <Actions actionConfig={actionConfig} onClick={this.handleActionItem} />
            </div>
          )}
          {canDrag && (
            <SortableHandle>
              <i className="icon-drag ecos-tree__item-element-drag" />
            </SortableHandle>
          )}
        </div>
        {this.renderChildren()}
      </div>
    );

    const dragProps = {};

    moveInLevel && (dragProps.collection = level);
    moveInParent && (dragProps.collection += parentKey);

    return canDrag ? (
      <SortableElement key={`${item.id}-${index}-${level}`} index={item.id} disabled={locked} {...dragProps}>
        {itemElement}
      </SortableElement>
    ) : (
      itemElement
    );
  }
}

class Tree extends Component {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape(ItemInterface)),
    groupBy: PropTypes.string,
    className: PropTypes.string,
    classNameItem: PropTypes.string,
    selectable: PropTypes.bool,
    draggable: PropTypes.bool,
    dragLvlTo: PropTypes.number,
    openAll: PropTypes.bool,
    moveInParent: PropTypes.bool,
    moveInLevel: PropTypes.bool,
    onToggleSelect: PropTypes.func,
    onClickActionItem: PropTypes.func,
    dragEnd: PropTypes.func
  };

  static defaultProps = {
    data: [],
    groupBy: '',
    className: '',
    moveInLevel: true,
    moveInParent: false,
    onToggleSelect: () => null,
    onClickActionItem: () => null
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

    this.setState({ draggableNode: null }, () => this.props.dragEnd(oldIndex, newIndex));
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
      classNameItem,
      openAll,
      draggable,
      dragLvlTo,
      onClickActionItem,
      moveInLevel,
      moveInParent
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
        className={classNameItem}
        openAll={openAll}
        onToggleSelect={onToggleSelect}
        selectable={selectable}
        draggable={draggable}
        dragLvlTo={dragLvlTo}
        onClickAction={onClickActionItem}
        moveInLevel={moveInLevel}
        moveInParent={moveInParent}
      />
    ));
  }

  render() {
    const { className, draggable } = this.props;

    const treeElement = (
      <div className={classNames('ecos-tree', className)}>
        {this.renderTree()}
        {this.renderEmpty()}
      </div>
    );

    return draggable ? (
      <SortableContainer axis="xy" onSortEnd={this.handleSortEnd} updateBeforeSortStart={this.handleBeforeSortStart} useDragHandle>
        {treeElement}
      </SortableContainer>
    ) : (
      treeElement
    );
  }
}

export default Tree;
