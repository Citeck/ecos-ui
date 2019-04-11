import React, { useContext } from 'react';
import List from './List';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import './Body.scss';

const Body = () => {
  const context = useContext(SelectOrgstructContext);
  const { currentTab, tabItems } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <List items={children} />
    </div>
  );
};

export default Body;
