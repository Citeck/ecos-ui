import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './ListItem.scss';

const ListItem = ({ item, nestingLevel, nestedList }) => {
  let collapseHandler = null;
  let onClickLabel = null;
  if (item.isGroup) {
    const collapseHandlerClassNames = classNames('icon', 'select-orgstruct__collapse-handler', {
      'icon-right': !item.isOpen,
      'icon-down': item.isOpen
    });
    collapseHandler = <span className={collapseHandlerClassNames} />;
    onClickLabel = () => {
      console.log('click collapseHandler', item.id);
    };
  }

  const selectHandlerClassNames = classNames('icon', 'select-orgstruct__select-handler', {
    'icon-plus': !item.isSelected,
    'select-orgstruct__select-handler_not-selected': !item.isSelected,
    'icon-close': item.isSelected,
    'select-orgstruct__select-handler_selected': item.isSelected
  });

  const selectHandler = (
    <span
      className={selectHandlerClassNames}
      onClick={() => {
        console.log('click selectHandler', item.id);
      }}
    />
  );

  const listItemClassNames = classNames('select-orgstruct__list-item', `select-orgstruct__list-item_level-${nestingLevel}`, {
    'select-orgstruct__list-item_strong': item.isStrong
  });

  const listItemLabelClassNames = classNames('select-orgstruct__list-item-label', {
    'select-orgstruct__list-item-label_clickable': item.isGroup,
    'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.isGroup
  });

  return (
    <li>
      <div className={listItemClassNames}>
        <div className={listItemLabelClassNames} onClick={onClickLabel}>
          {collapseHandler}
          {item.label}
        </div>
        {selectHandler}
      </div>
      {nestedList}
    </li>
  );
};

export const itemPropType = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string,
  isGroup: PropTypes.bool,
  isOpen: PropTypes.bool,
  isSelected: PropTypes.bool,
  isStrong: PropTypes.bool,
  items: PropTypes.array
});

ListItem.propTypes = {
  item: itemPropType,
  nestingLevel: PropTypes.number,
  nestedList: PropTypes.node
};

export default ListItem;
