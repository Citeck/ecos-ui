import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';

import { arrayCompare, t } from '../../../helpers/util';
import { Icon } from '../../common';
import { Checkbox } from '../../common/form';
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

class TreeItem extends Component {
  static propTypes = {
    item: PropTypes.shape(ItemInterface),
    isChild: PropTypes.bool,
    className: PropTypes.string,
    onToggleSelect: PropTypes.func
  };

  static defaultProps = {
    item: {},
    isChild: false,
    className: ''
  };

  state = {
    isOpen: false
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { item, isChild } = this.props;
    const { isOpen } = this.state;

    return (
      nextState.isOpen !== isOpen ||
      !arrayCompare(nextProps.item.items, item.items) ||
      nextProps.item.id !== item.id ||
      nextProps.item.selected !== item.selected ||
      nextProps.isChild !== isChild
    );
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
    let has = false;

    item.items.forEach(child => {
      if (child.items.length) {
        has = true;
      }
    });

    return has;
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

  renderArrow() {
    const { item } = this.props;
    const { isOpen } = this.state;

    if (!item.items.length) {
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
    const { item, onToggleSelect } = this.props;
    const { isOpen } = this.state;

    if (!item.items.length) {
      return null;
    }

    return (
      <Collapse isOpen={isOpen} className="ecos-tree__item-element-children">
        {item.items.map(item => (
          <TreeItem item={item} isChild key={item.id} onToggleSelect={onToggleSelect} />
        ))}
      </Collapse>
    );
  }

  render() {
    const { isChild, item, selectable, className } = this.props;
    const { isOpen } = this.state;
    const { items, selected, locked, icon, name, actionConfig, customComponents } = item || {};

    return (
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
              <Actions actionConfig={actionConfig} />
            </div>
          )}
        </div>
        {this.renderChildren()}
      </div>
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
    onToggleSelect: PropTypes.func
  };

  static defaultProps = {
    data: [],
    groupBy: '',
    className: '',
    onToggleSelect: () => null
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

  renderEmpty() {
    const { data } = this.props;

    if (data.length) {
      return null;
    }

    return <div className="ecos-tree__empty">{t(Labels.EMPTY)}</div>;
  }

  renderTree() {
    const { onToggleSelect, selectable, classNameItem } = this.props;
    const data = this.formattedTree;

    if (!data.length) {
      return null;
    }

    return data.map(item => (
      <TreeItem item={item} key={item.id} onToggleSelect={onToggleSelect} selectable={selectable} className={classNameItem} />
    ));
  }

  render() {
    const { className } = this.props;

    return (
      <div className={classNames('ecos-tree', className)}>
        {this.renderTree()}
        {this.renderEmpty()}
      </div>
    );
  }
}

export default Tree;
