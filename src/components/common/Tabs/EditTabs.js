import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isEqualWith from 'lodash/isEqualWith';
import isEqual from 'lodash/isEqual';

import { arrayMove } from '../../../helpers/util';
import { SortableContainer, SortableElement } from '../../Drag-n-Drop';
import { commonTabsDefaultProps, commonTabsPropTypes } from './utils';
import Tab from './Tab';

import './Tabs.scss';

class EditTabs extends React.Component {
  static propTypes = {
    ...commonTabsPropTypes,
    classNameTooltip: PropTypes.string,
    disabled: PropTypes.bool,
    onSort: PropTypes.func,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func,
    onResize: PropTypes.func,
    onStartEdit: PropTypes.func
  };

  static defaultProps = commonTabsDefaultProps;

  state = { sortableNode: null };

  shouldComponentUpdate(nextProps) {
    const { items, hasHover, hasHint, keyField, valueField, activeTabKey } = this.props;

    if (
      !isEqualWith(items, nextProps.items, isEqual) ||
      hasHover !== nextProps.hasHover ||
      hasHint !== nextProps.hasHint ||
      keyField !== nextProps.keyField ||
      valueField !== nextProps.valueField ||
      activeTabKey !== nextProps.activeTabKey
    ) {
      return true;
    }

    return false;
  }

  onEditItem = (item, text, index) => {
    item.label = text;

    this.props.onEdit && this.props.onEdit(item, index);
  };

  onDeleteItem = (item, index) => {
    this.props.onDelete && this.props.onDelete(item, index);
  };

  onStartEditItem = (position = 0) => {
    this.props.onStartEdit && this.props.onStartEdit(position);
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('ecos-tab_draggable');
    this.setState({ sortableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }) => {
    const { items = [], onSort } = this.props;
    const { sortableNode } = this.state;

    onSort && onSort(arrayMove(items, oldIndex, newIndex));

    if (sortableNode) {
      sortableNode.classList.toggle('ecos-tab_draggable');
      this.setState({ sortableNode: null });
    }
  };

  render() {
    const {
      items = [],
      className,
      classNameTab,
      classNameTooltip,
      keyField,
      valueField,
      valuePrefix,
      activeTabKey,
      hasHover,
      hasHint,
      disabled,
      onClick
    } = this.props;

    return (
      <SortableContainer
        axis="x"
        lockAxis="x"
        lockToContainerEdges={true}
        lockOffset="10%"
        updateBeforeSortStart={this.handleBeforeSortStart}
        onSortEnd={this.handleSortEnd}
        useDragHandle
      >
        <div className={classNames('ecos-tabs', className)}>
          {items.map((item, index) => (
            <SortableElement key={`${item[keyField]}-${index}-editable`} index={index} disabled={disabled}>
              <Tab
                {...item}
                id={item[keyField]}
                index={index}
                classNameTooltip={classNameTooltip}
                className={classNameTab}
                label={classNames(valuePrefix, item[valueField])}
                isActive={item.isActive || item[keyField] === activeTabKey}
                onClick={() => onClick(item, index)}
                onDelete={() => this.onDeleteItem(item, index)}
                onEdit={text => this.onEditItem(item, text, index)}
                onStartEdit={this.onStartEditItem}
                hasHover={hasHover}
                hasHint={hasHint}
                disabled={disabled}
              />
            </SortableElement>
          ))}
        </div>
      </SortableContainer>
    );
  }
}

export default EditTabs;
