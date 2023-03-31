import React from 'react';

import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { ViewTypes } from '../../../constants/commonDesigner';

import styles from './styles.module.scss';

const ActionButtons = ({ onDeleteClick, onEditClick, onSettingsClick, viewType }) => {
  return (
    <>
      <a
        href="/"
        key="deleteModelButton"
        className={viewType === ViewTypes.LIST ? styles.editActionIcon : styles.cardDeleteModelButton}
        onClick={onDeleteClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className="icon-delete" />
      </a>
      <a
        href="/"
        key="editMetaButton"
        className={viewType === ViewTypes.LIST ? styles.editActionIcon : styles.cardEditMetaButton}
        onClick={onSettingsClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className="icon-settings" />
      </a>
      <a
        href="/"
        key="editButton"
        className={viewType === ViewTypes.LIST ? styles.editActionIcon : styles.cardEditButton}
        onClick={onEditClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className="icon-edit" />
      </a>
    </>
  );
};

export default ActionButtons;
