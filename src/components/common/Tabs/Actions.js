import React from 'react';

import { SortableHandle } from '../../Drag-n-Drop';
import Icon from '../icons/Icon';

import { Menu } from './Menu';

export const Actions = ({
  id,
  isActive,
  isEditable,
  isOpenMenu,
  classNameTooltip,
  startEdit,
  onClose,
  disabled,
  onDelete,
  onToggleMenu
}) => {
  if (isEditable) {
    return (
      <div className="ecos-tab-actions">
        <Icon key="close" className="icon-small-close ecos-tab-actions__icon" onClick={onClose} />
      </div>
    );
  }

  return (
    <div className="ecos-tab-actions">
      <React.Fragment key="menu">
        <Menu
          id={id}
          isActive={isActive}
          isEditable={isEditable}
          disabled={disabled}
          isOpenMenu={isOpenMenu}
          classNameTooltip={classNameTooltip}
          startEdit={startEdit}
          onDelete={onDelete}
          onToggleMenu={onToggleMenu}
        />
      </React.Fragment>
      <SortableHandle key="drag">
        <Icon className="icon-custom-drag-big ecos-tab-actions__icon ecos-tab-actions__icon_paler" />
      </SortableHandle>
    </div>
  );
};
