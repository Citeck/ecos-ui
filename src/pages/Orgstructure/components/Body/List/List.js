import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';

import ListItem, { itemPropType } from '../ListItem';
import { SelectOrgstructContext } from '../../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import Records from '../../../../../components/Records';

import './List.scss';
import { useState } from 'react';

const List = ({ items, nestingLevel = 0, tabId }) => {
  const context = useContext(SelectOrgstructContext);
  const [selectedId, setSelectedId] = useState('');

  const deleteItem = item => Records.remove(item);

  return (
    <ul className={'select-orgstruct__list'}>
      {items.map(item => {
        let nestedList = null;

        if (item.hasChildren) {
          const { currentTab, tabItems } = context;
          const children = tabItems[currentTab].filter(i => i.parentId === item.id);

          nestedList = (
            <Collapse isOpen={item.isOpen}>
              <List items={children} nestingLevel={nestingLevel + 1} tabId={tabId} />
            </Collapse>
          );
        }
        return (
          <ListItem
            key={item.id}
            item={item}
            nestingLevel={nestingLevel}
            nestedList={nestedList}
            deleteItem={deleteItem}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            tabId={tabId}
          />
        );
      })}
    </ul>
  );
};

List.propTypes = {
  items: PropTypes.arrayOf(itemPropType),
  nestingLevel: PropTypes.number
};

export default List;
