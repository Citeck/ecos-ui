import classNames from 'classnames';
import React from 'react';
import { Tooltip } from 'reactstrap';

import { t } from '../../../helpers/util';
import Icon from '../icons/Icon';

import { Labels } from './constants';

export const Menu = ({ disabled, id, isActive, isEditable, isOpenMenu, classNameTooltip, startEdit, onDelete, onToggleMenu }) => {
  if (isEditable) {
    return null;
  }

  return (
    <>
      <Icon
        data-ignore-close-menu
        id={id}
        onClick={onToggleMenu}
        title={t(Labels.Menu.LABEL_OPEN_MENU)}
        className={classNames('ecos-tab-actions__icon ecos-tab-actions__icon_menu', {
          'icon-custom-more-small-normal': !isOpenMenu,
          'icon-custom-more-small-pressed ecos-tab-actions__icon_menu-opened': isOpenMenu,
          'ecos-tab-actions__icon_menu-active-tab': isActive
        })}
      />
      <Tooltip
        placement="bottom-start"
        target={id}
        trigger="click"
        boundariesElement="window"
        isOpen={isOpenMenu}
        toggle={onToggleMenu}
        hideArrow
        className={classNames('ecos-base-tooltip', 'ecos-base-tooltip_opaque', classNameTooltip)}
        innerClassName="ecos-base-tooltip-inner ecos-tab-actions__menu"
      >
        <div key="edit" onClick={startEdit} className="ecos-tab-actions__menu-item">
          <Icon className="icon-edit ecos-tab-actions__menu-item-icon" />
          <span className="ecos-tab-actions__menu-item-title">{t(Labels.Menu.BUTTON_EDIT)}</span>
        </div>
        {!disabled && (
          <div key="delete" onClick={onDelete} className="ecos-tab-actions__menu-item ecos-tab-actions__menu-item_warning">
            <Icon className="icon-delete ecos-tab-actions__menu-item-icon" />
            <span className="ecos-tab-actions__menu-item-title">{t(Labels.Menu.BUTTON_DELETE)}</span>
          </div>
        )}
      </Tooltip>
    </>
  );
};
