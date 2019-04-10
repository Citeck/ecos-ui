import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SelectModalContext } from '../../SelectModalContext';
import './ListItem.scss';

const ListItem = ({ item, nestingLevel, nestedList }) => {
  const context = useContext(SelectModalContext);

  let collapseHandler = null;
  let onClickLabel = null;
  if (item.hasChildren) {
    const collapseHandlerClassNames = classNames('icon', 'select-orgstruct__collapse-handler', {
      'icon-right': !item.isOpen,
      'icon-down': item.isOpen
    });
    collapseHandler = <span className={collapseHandlerClassNames} />;
    onClickLabel = () => {
      context.onToggleCollapse(item);
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
        context.onToggleSelectItem(item);
      }}
    />
  );

  const listItemClassNames = classNames('select-orgstruct__list-item', `select-orgstruct__list-item_level-${nestingLevel}`, {
    'select-orgstruct__list-item_strong': item.isStrong
  });

  const listItemLabelClassNames = classNames('select-orgstruct__list-item-label', {
    'select-orgstruct__list-item-label_clickable': item.hasChildren,
    'select-orgstruct__list-item-label_margin-left': nestingLevel > 0 && !item.hasChildren
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
  hasChildren: PropTypes.bool,
  isOpen: PropTypes.bool,
  isSelected: PropTypes.bool,
  isStrong: PropTypes.bool,
  parentId: PropTypes.string
});

ListItem.propTypes = {
  item: itemPropType,
  nestingLevel: PropTypes.number,
  nestedList: PropTypes.node
};

export default ListItem;
