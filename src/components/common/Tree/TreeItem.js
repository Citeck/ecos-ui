import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Collapse } from 'reactstrap';

import { SortableElement, SortableHandle } from '../../Drag-n-Drop';
import { EcosIcon, Icon, Tooltip } from '../../common';
import { Badge, Checkbox } from '../../common/form';
import Popper from '../Popper';

import Actions from './Actions';
import { ItemInterface, Labels, STEP_LVL, TOP_LVL } from './constants';

import { extractLabel, isExistValue, t } from '@/helpers/util';

import './style.scss';

class TreeItem extends Component {
  static propTypes = {
    item: PropTypes.shape(ItemInterface),
    isChild: PropTypes.bool,
    isMajor: PropTypes.bool,
    openAll: PropTypes.bool,
    level: PropTypes.number,
    prefixClassName: PropTypes.string,
    onToggleSelect: PropTypes.func,
    getActions: PropTypes.func,
    onClickAction: PropTypes.func,
    onClickIcon: PropTypes.func,
    renderExtraComponents: PropTypes.func,
    convertItemProps: PropTypes.func
  };

  static defaultProps = {
    item: {},
    isChild: false,
    isMajor: false,
    openAll: false,
    level: TOP_LVL,
    prefixClassName: '',
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
    const { items, ...self } = item;
    const { items: _items, ..._self } = nextProps.item;

    return (
      nextState.isOpen !== isOpen ||
      nextProps.openAll !== openAll ||
      nextProps.isChild !== isChild ||
      !isEqual(self, _self) ||
      !isEqualWith(items, _items, isEqual)
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

    return !!item && !isEmpty(item.items) && item.items.some(child => !isEmpty(child.items));
  }

  handleToggleOpen = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleToggleCheck = ({ checked }) => {
    const { item, selectable, onToggleSelect } = this.props;

    if (checked === item.selected || item.locked || !selectable) {
      return;
    }

    onToggleSelect && onToggleSelect({ item, checked });
  };

  handleActionItem = action => {
    const { item, level, onClickAction } = this.props;

    onClickAction && onClickAction({ action, item, level });
  };

  renderArrow() {
    const { item } = this.props;
    const { isOpen } = this.state;

    if (!item || isEmpty(item.items)) {
      return null;
    }

    return (
      <Icon
        className={classNames('ecos-tree__item-element-arrow icon-small-right', {
          'ecos-tree__item-element-arrow_open': isOpen
        })}
        onClick={this.handleToggleOpen}
      />
    );
  }

  renderChildren = () => {
    const {
      item,
      openAll,
      level,
      draggable,
      dragLvlTo,
      prefixClassName,
      onToggleSelect,
      onClickAction,
      onClickIcon,
      moveInLevel,
      moveInParent,
      renderExtraComponents,
      convertItemProps,
      getActions
    } = this.props;
    const { isOpen } = this.state;

    if (!item || isEmpty(item.items)) {
      return null;
    }

    return (
      <Collapse isOpen={isOpen} className="ecos-tree__item-element-children">
        {isOpen &&
          item.items.map((child, index) => (
            <TreeItem
              item={child}
              key={child.id}
              index={index}
              isChild
              prefixClassName={prefixClassName}
              level={level + STEP_LVL}
              onToggleSelect={onToggleSelect}
              getActions={getActions}
              onClickAction={onClickAction}
              onClickIcon={onClickIcon}
              openAll={openAll}
              draggable={draggable}
              dragLvlTo={dragLvlTo}
              moveInLevel={moveInLevel}
              moveInParent={moveInParent}
              parentKey={item.id}
              renderExtraComponents={renderExtraComponents}
              convertItemProps={convertItemProps}
            />
          ))}
      </Collapse>
    );
  };

  renderPopperContent = label => <div className="ecos-tree__item-element-label-tooltip">{extractLabel(label)}</div>;

  renderItem = (targetId, canDrag) => {
    const { isChild, item, selectable, prefixClassName, level, isMajor, renderExtraComponents, onClickIcon, getActions, convertItemProps } =
      this.props;
    const { isOpen } = this.state;
    const _item = typeof convertItemProps === 'function' ? convertItemProps(item) : item || {};
    const { items, selected, locked, icon, label, actionConfig, badge } = _item;
    const filteredActions = getActions ? getActions(item) : actionConfig;

    return (
      <div
        className={classNames('ecos-tree__item', {
          'ecos-tree__item_child': isChild,
          'ecos-tree__item_parent': items && items.length,
          'ecos-tree__item_open': isOpen,
          'ecos-tree__item_not-selected': selectable && !selected,
          'ecos-tree__item_locked': locked,
          'ecos-tree__item_has-grandchildren': this.hasGrandchildren,
          'ecos-tree__item_major': isMajor,
          [`ecos-tree__item-level--${level}`]: true,
          [`${prefixClassName}--item-container`]: !!prefixClassName
        })}
      >
        <div
          className={classNames('ecos-tree__item-element', item.className, { [`${prefixClassName}--item-element`]: !!prefixClassName })}
          id={'id' + item.id}
        >
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
          {!!icon && (
            <Tooltip
              className="ecos-tree__item-element-icon-tooltip"
              target={targetId + '-icon'}
              text={t('tree-component.tooltip.update-icon')}
              off={!onClickIcon}
              uncontrolled
              autohide
            >
              <EcosIcon
                id={targetId + '-icon'}
                data={item.icon}
                className="ecos-tree__item-element-icon"
                onClick={() => onClickIcon && onClickIcon(item)}
              />
            </Tooltip>
          )}
          {isExistValue(badge) && <Badge text={badge} className="ecos-tree__item-element-badge" />}

          <Popper showAsNeeded text={extractLabel(label)} icon="icon-question" contentComponent={this.renderPopperContent(label)}>
            <div
              className={classNames('ecos-tree__item-element-label', {
                'ecos-tree__item-element-label_locked': item.locked
              })}
            >
              {extractLabel(label)}
            </div>
          </Popper>

          {renderExtraComponents && (
            <div className="ecos-tree__item-element-custom-components">{renderExtraComponents({ item, level, isOpen })}</div>
          )}
          <div className="ecos-tree__item-element-space" />
          {filteredActions && !!filteredActions.length && (
            <div className="ecos-tree__item-element-actions">
              <Actions actionConfig={filteredActions} onClick={this.handleActionItem} idItem={item.id} />
            </div>
          )}
          {canDrag && (
            <SortableHandle>
              <i className="icon-custom-drag-big ecos-tree__item-element-drag" />
            </SortableHandle>
          )}
        </div>
        {this.renderChildren()}
      </div>
    );
  };

  render() {
    const { item, dragLvlTo, draggable, level, moveInLevel, moveInParent, parentKey = '' } = this.props;
    const { label } = item || {};

    if (!label || isEmpty(label)) {
      return null;
    }

    const draggableLevel = dragLvlTo === undefined || dragLvlTo >= level;
    const canDrag = draggable && item.draggable && draggableLevel;
    const key = `key_${level}_${item.id}_${item.dndIdx || ''}`.replace(/\W/g, '');
    const itemElement = this.renderItem(key, canDrag);
    const dragProps = {};

    moveInLevel && (dragProps.collection = level);
    moveInParent && (dragProps.collection += parentKey);

    return canDrag ? (
      <SortableElement key={key} index={item.dndIdx} disabled={item.locked} {...dragProps}>
        {itemElement}
      </SortableElement>
    ) : (
      itemElement
    );
  }
}

export default TreeItem;
