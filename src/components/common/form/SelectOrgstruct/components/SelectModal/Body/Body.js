import React, { useContext } from 'react';
import List from './List';
import { SelectModalContext } from '../SelectModalContext';
import './Body.scss';

const Body = () => {
  const context = useContext(SelectModalContext);
  const { currentTab, tabItems } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <List items={children} />
    </div>
  );
};

export default Body;
