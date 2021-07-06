import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { SelectOrgstructContext } from '../../../../SelectOrgstructContext';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER, TabTypes } from '../../../../constants';

import './ListItem.scss';

const ListItem = ({ item, nestingLevel, nestedList }) => {
  const context = useContext(SelectOrgstructContext);
  const { controlProps = {}, renderListItem, currentTab } = context;
  const { allowedAuthorityTypes, allowedGroupTypes, allowedGroupSubTypes } = controlProps;

  const itemAuthorityType = get(item, 'attributes.authorityType');
  const itemGroupType = get(item, 'attributes.groupType', '').toUpperCase();
  const itemGroupSubType = get(item, 'attributes.groupSubType', '');

  const isAllUsers = currentTab === TabTypes.USERS;
  const isAllowedSelect =
    allowedAuthorityTypes.includes(itemAuthorityType) &&
    (itemAuthorityType === AUTHORITY_TYPE_USER ||
      (itemAuthorityType === AUTHORITY_TYPE_GROUP &&
        allowedGroupTypes.includes(itemGroupType) &&
        (allowedGroupSubTypes.length === 0 || allowedGroupSubTypes.includes(itemGroupSubType))));

  const onClickLabel = () => {
    if (item.hasChildren) {
      context.onToggleCollapse(item);
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
      const collapseHandlerClassNames = classNames('icon select-orgstruct__collapse-handler', {
        'icon-small-right': !item.isOpen,
        'icon-small-down': item.isOpen
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
    'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren
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
