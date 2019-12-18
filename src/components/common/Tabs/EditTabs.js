import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';

import Tab from './Tab';
import { deepClone, arrayCompare } from '../../../helpers/util';
import { commonTabsDefaultProps, commonTabsPropTypes } from './utils';
import './Tabs.scss';

const SortableContainer = sortableContainer(({ children }) => children);
const SortableElement = sortableElement(({ children }) => children);

class EditTabs extends React.Component {
  static propTypes = {
    ...commonTabsPropTypes,
    disabled: PropTypes.bool,
    onSort: PropTypes.func,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func,
    onResize: PropTypes.func,
    onStartEdit: PropTypes.func
  };

  static defaultProps = commonTabsDefaultProps;

  shouldComponentUpdate(nextProps) {
    const { items, hasHover, hasHint, keyField, valueField, activeTabKey } = this.props;

    if (
      !arrayCompare(items, nextProps.items) ||
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

  handleSortEnd = ({ oldIndex, newIndex }) => {
    const { items = [], onSort = () => null } = this.props;
    const arr = deepClone(items);

    arr[newIndex] = items[oldIndex];
    arr[oldIndex] = items[newIndex];
    onSort(arr);
  };

  render() {
    const {
      items = [],
      className,
      classNameTab,
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
      <SortableContainer axis="x" lockAxis="x" onSortEnd={this.handleSortEnd} useDragHandle>
        <div className={classNames('ecos-tabs', className)}>
          {items.map((item, index) => (
            <SortableElement key={`${item[keyField]}-${index}-editable`} index={index} disabled={disabled}>
              <Tab
                {...item}
                id={item[keyField]}
                index={index}
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
