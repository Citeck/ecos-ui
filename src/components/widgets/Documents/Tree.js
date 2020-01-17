import React, { Component } from 'react';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';

import { Icon } from '../../common';
import { Checkbox } from '../../common/form';
import { arrayCompare, t } from '../../../helpers/util';

const LABELS = {
  EMPTY: 'Ничего не найдено'
};

class TreeItem extends Component {
  state = {
    isOpen: false
  };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { item, isChild } = this.props;
    const { isOpen } = this.state;

    if (
      nextState.isOpen !== isOpen ||
      !arrayCompare(nextProps.item.items, item.items) ||
      nextProps.item.id !== item.id ||
      nextProps.item.isSelected !== item.isSelected ||
      nextProps.isChild !== isChild
    ) {
      return true;
    }

    return false;
  }

  handleToggleOpen = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleToggleCheck = ({ checked }) => {
    if (checked === this.props.item.isSelected) {
      return;
    }

    this.props.toggleSelect({ id: this.props.item.id, checked });
  };

  handleToggleSettings = () => {};

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
    const { item, toggleSelect } = this.props;
    const { isOpen } = this.state;

    if (!item.items.length) {
      return null;
    }

    return (
      <Collapse isOpen={isOpen} className="ecos-tree__item-element-children">
        {item.items.map(item => (
          <TreeItem item={item} isChild key={item.id} toggleSelect={toggleSelect} />
        ))}
      </Collapse>
    );
  }

  renderSettings() {
    return <Icon className="icon-settings ecos-tree__item-element-settings" onClick={this.handleToggleSettings} />;
  }

  render() {
    const { isChild, item } = this.props;
    const { isOpen } = this.state;

    return (
      <div
        className={classNames('ecos-tree__item', {
          'ecos-tree__item_child': isChild,
          'ecos-tree__item_parent': item.items.length,
          'ecos-tree__item_open': isOpen,
          'ecos-tree__item_not-selected': !item.isSelected
        })}
      >
        <div className="ecos-tree__item-element">
          {this.renderArrow()}
          <Checkbox className="ecos-tree__item-element-check" onChange={this.handleToggleCheck} checked={item.isSelected} />
          <div className="ecos-tree__item-element-label">{item.name}</div>
          {this.renderSettings()}
        </div>
        {this.renderChildren()}
      </div>
    );
  }
}

class Tree extends Component {
  get formattedTree() {
    const { data, groupBy } = this.props;

    if (!groupBy) {
      return data;
    }

    const getChilds = (filtered = [], types = filtered) => {
      return filtered.map(item => {
        if (!item[groupBy]) {
          return item;
        }

        return {
          ...item,
          items: getChilds(types.filter(type => type[groupBy] && type[groupBy] === item.id), types)
        };
      });
    };

    return data
      .filter(item => item[groupBy] === null)
      .map(item => ({
        ...item,
        items: getChilds(data.filter(type => type[groupBy] === item.id), data)
      }));
  }

  renderEmpty() {
    const { data } = this.props;

    if (data.length) {
      return null;
    }

    return <div className="ecos-tree__empty">{t(LABELS.EMPTY)}</div>;
  }

  renderTree() {
    const { toggleSelect } = this.props;
    const data = this.formattedTree;

    if (!data.length) {
      return null;
    }

    return data.map(item => <TreeItem item={item} key={item.id} toggleSelect={toggleSelect} />);
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
