import React, { Component } from 'react';
import classNames from 'classnames';

class Tree extends Component {
  renderItem = (item, isChild = false) => {
    let children = null;

    if (item.items) {
      children = item.items.map(item => this.renderItem(item, true));
    }

    return (
      <div
        key={item.id}
        className={classNames('ecos-tree__item', {
          'ecos-tree__item_child': isChild,
          'ecos-tree__item_parent': item.items
        })}
      >
        <div className="ecos-tree__item-element">{item.name}</div>
        {children}
      </div>
    );
  };

  render() {
    const { className, data } = this.props;

    return <div className={classNames('ecos-tree', className)}>{data.map(item => this.renderItem(item))}</div>;
  }
}

export default Tree;
