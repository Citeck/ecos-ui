import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { deepClone, t } from '../../../helpers/util';
import { Input } from '../form';
import { Icon } from '../';
import { commonOneTabDefaultProps, commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

const SortableContainer = sortableContainer(({ children }) => {
  return children;
});

const SortableElement = sortableElement(({ children }) => {
  return children;
});

const DragHandle = sortableHandle(() => <Icon className={'icon-drag ecos-tab-actions-move'} />);

class Tab extends React.Component {
  static propTypes = {
    ...commonOneTabPropTypes,
    disabled: PropTypes.bool,
    isNew: PropTypes.bool,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func
  };

  static defaultProps = {
    ...commonOneTabDefaultProps,
    disabled: false,
    isNew: false,
    onDelete: () => null,
    onEdit: () => null
  };

  state = {
    edit: false,
    text: ''
  };

  startEdit = e => {
    const { label, isNew } = this.props;

    e.stopPropagation();
    this.setState({ edit: true, text: isNew ? '' : label });
  };

  endEdit = () => {
    const { onEdit = () => null, label } = this.props;
    const { text } = this.state;
    const newLabel = text || label;

    this.setState({ edit: false, text: '' });

    onEdit(newLabel);
  };

  onKeyPress = e => {
    e.stopPropagation();

    switch (e.key) {
      case 'Enter':
      case 'Escape':
        this.endEdit();
        break;
      default:
        break;
    }
  };

  onDelete = e => {
    const { onDelete = () => null } = this.props;
    e.stopPropagation();
    onDelete();
  };

  onChange = e => {
    this.setState({ text: e.target.value });
  };

  render() {
    const { label, isActive, onClick, hasHover, disabled, isNew, className } = this.props;
    const { edit, text } = this.state;
    const tabClassNames = classNames('ecos-tab', 'ecos-tab_edit', className, {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_disabled': disabled
    });
    const isEdit = edit || isNew;
    const placeholder = isNew ? t(label) : t('page-tabs.tab-name');

    return (
      <div className={tabClassNames} onClick={onClick}>
        <div className="ecos-tab-label">
          {isEdit ? (
            <Input
              className="ecos-tab-label__input"
              autoFocus
              value={text}
              placeholder={placeholder}
              onChange={this.onChange}
              onKeyPress={this.onKeyPress}
              onBlur={() => this.endEdit()}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            t(label)
          )}
        </div>
        <div className={classNames('ecos-tab-actions')}>
          {!isEdit && <Icon className={classNames('icon-edit ecos-tab-actions-edit ecos-tab-actions_hover')} onClick={this.startEdit} />}
          {!isEdit && !disabled && (
            <Icon className={classNames('icon-close ecos-tab-actions-delete ecos-tab-actions_hover')} onClick={this.onDelete} />
          )}
          {!disabled && <DragHandle />}
        </div>
      </div>
    );
  }
}

class EditTabs extends React.Component {
  static propTypes = {
    ...commonTabsPropTypes,
    disabled: PropTypes.bool,
    onSort: PropTypes.func,
    onDelete: PropTypes.func,
    onEdit: PropTypes.func
  };

  static defaultProps = commonTabsDefaultProps;

  onEditItem = (item, text, index) => {
    const { onEdit = () => null } = this.props;

    item.label = text;

    onEdit(item, index);
  };

  onDeleteItem = (item, index) => {
    const { onDelete = () => null } = this.props;

    onDelete(item, index);
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
      disabled,
      onClick
    } = this.props;
    const tabsClassNames = classNames('ecos-tabs', className);

    return (
      <SortableContainer axis="x" lockAxis="x" onSortEnd={this.handleSortEnd} useDragHandle>
        <div className={tabsClassNames}>
          {items.map((item, index) => (
            <SortableElement key={`${item[keyField]}-${index}-edit`} index={index} disabled={disabled}>
              <Tab
                {...item}
                className={classNameTab}
                id={item[keyField]}
                label={classNames(valuePrefix, item[valueField])}
                isActive={item.isActive || item[keyField] === activeTabKey}
                onClick={() => onClick(item, index)}
                onDelete={() => this.onDeleteItem(item, index)}
                onEdit={text => this.onEditItem(item, text, index)}
                hasHover={hasHover}
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
