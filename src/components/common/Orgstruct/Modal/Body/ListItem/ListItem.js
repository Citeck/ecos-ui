import classNames from 'classnames';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import { OrgstructContext } from '../../../OrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, AUTHORITY_TYPE_ROLE, TabTypes } from '../../../constants';

import './ListItem.scss';

const ListItem = ({ item, nestingLevel, nestedList, previousParent }) => {
  const context = useContext(OrgstructContext);
  const { controlProps = {}, renderListItem, currentTab } = context;
  const { allowedAuthorityTypes, allowedGroupTypes, allowedGroupSubTypes } = controlProps;

  const itemAuthorityType = get(item, 'attributes.authorityType');
  const itemGroupType = get(item, 'attributes.groupType', '').toUpperCase();
  const itemGroupSubType = get(item, 'attributes.groupSubType', '');

  const isAllUsers = currentTab === TabTypes.USERS;

  let isAllowedSelect;

  if (allowedAuthorityTypes.includes(itemAuthorityType)) {
    if (
      itemAuthorityType === AUTHORITY_TYPE_GROUP &&
      allowedGroupTypes.includes(itemGroupType) &&
      (allowedGroupSubTypes.length === 0 || allowedGroupSubTypes.includes(itemGroupSubType))
    ) {
      isAllowedSelect = true;
    }

    if (itemAuthorityType === AUTHORITY_TYPE_USER || itemAuthorityType === AUTHORITY_TYPE_ROLE) {
      isAllowedSelect = true;
    }
  }

  const onClickLabel = () => {
    if (item.hasChildren) {
      context.onToggleCollapse(item, null, previousParent);
    }
  };

  const onDoubleClick = e => {
    if (isAllUsers || isAllowedSelect) {
      e.stopPropagation();
      context.onToggleSelectItem(item, true);
    }
  };

  const renderCollapseHandler = () => {
    if (item.hasChildren) {
      const isOpen =
        previousParent && context.openedItems[item.id] && context.openedItems[item.id].length >= 0
          ? context.openedItems[item.id].includes(previousParent)
          : item.isOpen;

      const collapseHandlerClassNames = classNames('icon select-orgstruct__collapse-handler', {
        'icon-small-right': !isOpen,
        'icon-small-down': isOpen
      });

      return <span className={collapseHandlerClassNames} />;
    }
  };

  const renderSelectHandler = () => {
    if (isAllUsers || isAllowedSelect) {
      const selectHandlerClassNames = classNames('icon select-orgstruct__select-handler', {
        'icon-small-plus': !item.isSelected,
        'select-orgstruct__select-handler_selected icon-custom-checkbox-check': item.isSelected
      });

      return (
        <span
          className={selectHandlerClassNames}
          onClick={() => context.onToggleSelectItem(item)}
          onDoubleClick={e => e.stopPropagation()}
        />
      );
    }
  };

  const listItemClassNames = classNames('select-orgstruct__list-item', `select-orgstruct__list-item_level-${nestingLevel}`, {
    'select-orgstruct__list-item_strong': item.isStrong
  });

  const listItemLabelClassNames = classNames('select-orgstruct__list-item-label', {
    'select-orgstruct__list-item-label_clickable': item.hasChildren,
    'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren,
    'select-orgstruct__list-item-label_disabled': item.isPersonDisabled
  });

  return (
    <li>
      <div className={listItemClassNames} onDoubleClick={onDoubleClick}>
        <div className={listItemLabelClassNames} onClick={onClickLabel}>
          {renderCollapseHandler()}
          {renderListItem(item)}
        </div>
        {renderSelectHandler()}
      </div>
      {nestedList}
    </li>
  );
};

export const itemPropType = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  hasChildren: PropTypes.bool,
  isOpen: PropTypes.bool,
  isSelected: PropTypes.bool,
  isStrong: PropTypes.bool,
  parentId: PropTypes.string,
  attributes: PropTypes.shape({
    authorityType: PropTypes.string,
    groupType: PropTypes.string,
    groupSubType: PropTypes.string
  })
});

ListItem.propTypes = {
  item: itemPropType,
  nestingLevel: PropTypes.number,
  nestedList: PropTypes.node
};

export default ListItem;
