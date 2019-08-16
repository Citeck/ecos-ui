import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { deepClone } from '../../../helpers/util';
import { commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';
import { Input } from '../form';
import { Icon } from '../';

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
    onDelete: PropTypes.func,
    onEdit: PropTypes.func
  };

  state = {
    edit: false,
    text: ''
  };

  startEdit = () => {
    this.setState({ edit: true, text: this.props.label });
  };

  endEdit = () => {
    const { onEdit } = this.props;
    this.setState({ edit: false, text: '' });

    onEdit(this.state.text);
  };

  onChange = e => {
    this.setState({ text: e.target.value });
  };

  render() {
    const { label, isActive, onClick, hasHover, disabled, onDelete = () => null } = this.props;
    const { edit, text } = this.state;
    const tabClassNames = classNames('ecos-tab', 'ecos-tab_edit', {
      'ecos-tab_active': isActive,
      'ecos-tab_hover': hasHover,
      'ecos-tab_disabled': disabled
    });

    return (
      <div className={tabClassNames} onClick={onClick}>
        <div className="ecos-tab-label">
          {edit ? <Input className="ecos-tab-label__input" autoFocus onChange={this.onChange} value={text} /> : label}
        </div>
        <div className={classNames('ecos-tab-actions')}>
          {edit && <Icon className={'icon-check ecos-tab-actions-edit'} onClick={this.endEdit} />}
          {!edit && <Icon className={classNames('icon-edit ecos-tab-actions-edit ecos-tab-actions_hover')} onClick={this.startEdit} />}
          {!edit && !disabled && (
            <Icon className={classNames('icon-close ecos-tab-actions-delete ecos-tab-actions_hover')} onClick={onDelete} />
          )}
          <DragHandle />
        </div>
      </div>
    );
  }
}

class EditTabs extends React.Component {
  static propTypes = {
    ...commonTabsPropTypes,
    disabled: PropTypes.bool,
    classNameTab: PropTypes.string,
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
    const { items = [], className, hasHover, classNameTab, disabled } = this.props;
    const tabsClassNames = classNames('ecos-tabs', className);

    return (
      <SortableContainer axis="x" lockAxis="x" onSortEnd={this.handleSortEnd} useDragHandle>
        <div className={tabsClassNames}>
          {items.map((item, index) => (
            <SortableElement key={`${item.id}-edit`} index={index} disabled={disabled}>
              <Tab
                {...item}
                onDelete={() => this.onDeleteItem(item, index)}
                className={classNameTab}
                hasHover={hasHover}
                disabled={disabled}
                onEdit={text => this.onEditItem(item, text, index)}
              />
            </SortableElement>
          ))}
        </div>
      </SortableContainer>
    );
  }
}

export default EditTabs;
