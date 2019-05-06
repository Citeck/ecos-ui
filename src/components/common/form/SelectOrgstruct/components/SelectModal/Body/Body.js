import React, { useContext } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import List from './List';
import { SelectOrgstructContext } from '../../../SelectOrgstructContext';
import './Body.scss';

const Body = () => {
  const context = useContext(SelectOrgstructContext);
  const { currentTab, tabItems } = context;

  const children = tabItems[currentTab].filter(i => !i.parentId);

  return (
    <div className="select-orgstruct__body">
      <Scrollbars className="slide-menu-list" autoHide autoHeight autoHeightMin={0} autoHeightMax={400}>
        <div className="select-orgstruct__list-wrapper">
          <List items={children} />
        </div>
      </Scrollbars>
    </div>
  );
};

export default Body;
