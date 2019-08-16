import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import { deepClone } from '../../../helpers/util';
import { commonOneTabPropTypes, commonTabsDefaultProps, commonTabsPropTypes } from './utils';
import { Icon } from '../';

import './Tabs.scss';

const SortableContainer = sortableContainer(({ children }) => {
  return children;
});

const SortableElement = sortableElement(({ children }) => {
  return children;
});

const DragHandle = sortableHandle(() => <Icon className={'icon-drag ecos-tab-actions-move'} />);

const Tab = props => {
  const { label, isActive, onClick, hasHover, disabled, onDelete = () => null } = props;
  const tabClassNames = classNames('ecos-tab', 'ecos-tab_edit', {
    'ecos-tab_active': isActive,
    'ecos-tab_hover': hasHover,
    'ecos-tab_disabled': disabled
  });

  return (
    <div className={tabClassNames} onClick={onClick}>
      <div className="ecos-tab-label">{label}</div>
      <div className={classNames('ecos-tab-actions', { 'ecos-tab-actions_none': disabled })}>
        <Icon className={'icon-edit ecos-tab-actions-edit ecos-tab-actions_hover'} onClick={onDelete} />
        <Icon className={'icon-close ecos-tab-actions-delete ecos-tab-actions_hover'} onClick={onDelete} />
        <DragHandle />
      </div>
    </div>
  );
};

Tab.propTypes = {
  ...commonOneTabPropTypes,
  disabled: PropTypes.bool,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func
};

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
