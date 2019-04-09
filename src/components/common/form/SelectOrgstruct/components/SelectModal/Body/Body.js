import React, { useContext } from 'react';
import List from './List';
import { SelectModalContext } from '../SelectModalContext';
import { TAB_BY_LEVELS, TAB_ALL_USERS, TAB_ONLY_SELECTED } from '../constants';

const Body = () => {
  const context = useContext(SelectModalContext);
  const { itemsByLevels, itemsAllUsers, itemsSelected, currentTab } = context;
  let items = [];
  switch (currentTab) {
    case TAB_BY_LEVELS:
      items = itemsByLevels;
      break;
    case TAB_ALL_USERS:
      items = itemsAllUsers;
      break;
    case TAB_ONLY_SELECTED:
      items = itemsSelected;
      break;
    default:
      return null;
  }

  return (
    <div className="select-orgstruct__body">
      <List items={items} />
    </div>
  );
};

export default Body;
