import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';

import { Icon } from '../../../common';
import { Badge, Checkbox } from '../../../common/form';
import { arrayFlat, t } from '../../../../helpers/util';
import { GrouppedTypeInterface } from '../propsInterfaces';
import Highlighter from '../../../common/Highlighter';

const Labels = {
  EMPTY: 'documents-widget.tree.empty',
  NOT_SELECTED: 'documents-widget.tree.not-selected',
  NOT_BE_DISABLED: 'documents-widget.tree.cannot-be-disabled',
  SELECTED_INSIDE: 'documents-widget.tree.selected-inside',
  OF: 'documents-widget.tree.selected-inside-of'
};

class TreeItem extends PureComponent {
  static propTypes = {
    item: PropTypes.shape(GrouppedTypeInterface),
    isChild: PropTypes.bool,
    isDefaultOpen: PropTypes.bool,
    isOpenAll: PropTypes.bool,
    className: PropTypes.string,
    onOpenSettings: PropTypes.func,
    onToggleSelect: PropTypes.func
  };

  static defaultProps = {
    item: {},
    isOpenAll: false,
    isDefaultOpen: false,
    isChild: false,
    className: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isDefaultOpen || props.isOpenAll || false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isOpenAll && this.props.isOpenAll) {
      this.setState({ isOpen: true });
    }
  }

  get title() {
    const { item } = this.props;

    if (item.locked) {
      return t('documents-widget.tooltip.cannot-be-changes');
    }

    if (item.isSelected) {
      return '';
    }

    return t('documents-widget.tooltip.cannot-be-changes');
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
    const { item } = this.props;

    if (checked === item.isSelected || item.locked) {
      return;
    }

    this.props.onToggleSelect({ id: this.props.item.id, checked });
  };

  handleToggleSettings = () => {
    this.props.onOpenSettings(this.props.item.id);
  };

  renderArrow() {
    const { item } = this.props;
    const { isOpen } = this.state;

    if (!item.items.length) {
      return null;
    }

    return (
      <Icon
        className={classNames('ecos-docs-tree__item-element-arrow icon-small-right', {
          'ecos-docs-tree__item-element-arrow_open': isOpen
        })}
        onClick={this.handleToggleOpen}
      />
    );
  }

  renderChildren() {
    const { item, onToggleSelect, onOpenSettings, isOpenAll } = this.props;
    const { isOpen } = this.state;

    if (!item.items.length) {
      return null;
    }

    return (
      <Collapse isOpen={isOpen} className="ecos-docs-tree__item-element-children">
        {item.items.map(item => (
          <TreeItem
            item={item}
            isChild
            key={item.id}
            isOpenAll={isOpenAll}
            onToggleSelect={onToggleSelect}
            onOpenSettings={onOpenSettings}
          />
        ))}
      </Collapse>
    );
  }

  renderSettings() {
    const { item } = this.props;

    if (!item.isSelected) {
      return null;
    }

    return <Icon className="icon-settings ecos-docs-tree__item-element-settings" onClick={this.handleToggleSettings} />;
  }

  renderBadge() {
    const { item } = this.props;
    const children = arrayFlat({ data: item.items, byField: 'items', withParent: true });
    const selectedChildren = children.filter(child => child.isSelected);

    if (!item.locked && !children.length && item.isSelected) {
      return null;
    }

    let text = '';
    let somethingSelected = false;

    if (children.length) {
      if (!selectedChildren.length && !item.isSelected) {
        text = t(Labels.NOT_SELECTED);
      } else {
        somethingSelected = true;
        text = `${t(Labels.SELECTED_INSIDE)} ${selectedChildren.length} ${t(Labels.OF)} ${children.length}`;
      }
    } else {
      text = item.locked ? t(Labels.NOT_BE_DISABLED) : t(Labels.NOT_SELECTED);
    }

    return (
      <Badge
        text={text}
        className={classNames('ecos-docs-tree__item-element-badge', {
          'ecos-docs-tree__item-element-badge_selected': somethingSelected
        })}
      />
    );
  }

  renderName() {
    const { item } = this.props;

    if (!item.filter) {
      return item.name;
    }

    return <Highlighter key={item.name} originText={item.name} highlightedText={item.filter} />;
  }

  render() {
    const { isChild, item } = this.props;
    const { isOpen } = this.state;

    return (
      <div
        className={classNames('ecos-docs-tree__item', {
          'ecos-docs-tree__item_child': isChild,
          'ecos-docs-tree__item_parent': item.items.length,
          'ecos-docs-tree__item_open': isOpen,
          'ecos-docs-tree__item_not-selected': !item.isSelected,
          'ecos-docs-tree__item_locked': item.locked,
          'ecos-docs-tree__item_has-grandchildren': this.hasGrandchildren
        })}
      >
        <div className="ecos-docs-tree__item-element">
          {this.renderArrow()}
          <Checkbox
            className="ecos-docs-tree__item-element-check"
            onChange={this.handleToggleCheck}
            checked={item.isSelected}
            disabled={item.locked}
            title={this.title}
          />
          <div
            className={classNames('ecos-docs-tree__item-element-label', {
              'ecos-docs-tree__item-element-label_locked': item.locked
            })}
          >
            {this.renderName()}
          </div>
          {this.renderBadge()}
          {this.renderSettings()}
        </div>
        {this.renderChildren()}
      </div>
    );
  }
}

class Tree extends PureComponent {
  static propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface)),
    groupBy: PropTypes.string,
    className: PropTypes.string,
    isOpenAll: PropTypes.bool,
    onOpenSettings: PropTypes.func,
    onToggleSelect: PropTypes.func
  };

  static defaultProps = {
    data: [],
    groupBy: '',
    className: '',
    isOpenAll: false,
    onOpenSettings: () => {},
    onToggleSelect: () => {}
  };

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

    return <div className="ecos-docs-tree__empty">{t(Labels.EMPTY)}</div>;
  }

  renderTree() {
    const { isOpenAll, onToggleSelect } = this.props;
    const data = this.formattedTree;

    if (!data.length) {
      return null;
    }

    return data.map(item => (
      <TreeItem
        item={item}
        key={item.id}
        isDefaultOpen={data.length === 1}
        isOpenAll={isOpenAll}
        onToggleSelect={onToggleSelect}
        onOpenSettings={this.props.onOpenSettings}
      />
    ));
  }

  render() {
    const { className } = this.props;

    return (
      <div className={classNames('ecos-docs-tree', className)}>
        {this.renderTree()}
        {this.renderEmpty()}
      </div>
    );
  }
}

export default Tree;
