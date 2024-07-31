import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import get from 'lodash/get';

import ListItem, { itemPropType } from '../ListItem';
import { useOrgstructContext } from '../../../../../components/common/Orgstruct/OrgstructContext';
import Records from '../../../../../components/Records';

import './List.scss';

const List = ({ items, nestingLevel = 0, tabId, toggleToFirstTab, previousParent }) => {
  const context = useOrgstructContext();

  const [selectedId, setSelectedId] = useState('');

  const groups = item => get(item, 'attributes.groups', []);
  const deletePersonItem = item => {
    const record = Records.get(item.id);

    record.att('att_rem_authorityGroups', item.parentId);

    return record.save();
  };

  return (
    <ul className={'select-orgstruct__list'}>
      {items.map((item, index) => {
        let nestedList = null;

        if (item.hasChildren) {
          const { currentTab, tabItems, openedItems } = context;
          const children = tabItems[currentTab].filter(i => i.parentId === item.id || groups(i).includes(item.id));

          nestedList = (
            <Collapse
              isOpen={
                previousParent && openedItems[item.id] && openedItems[item.id].length >= 0
                  ? openedItems[item.id].includes(previousParent)
                  : item.isOpen
              }
            >
              <List
                previousParent={item.id}
                items={children}
                nestingLevel={nestingLevel + 1}
                tabId={tabId}
                toggleToFirstTab={toggleToFirstTab}
              />
            </Collapse>
          );
        }

        return (
          <ListItem
            previousParent={previousParent}
            key={`${index}-${nestingLevel}-${item.id}`}
            item={item}
            nestingLevel={nestingLevel}
            nestedList={nestedList}
            deleteItem={deletePersonItem}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            tabId={tabId}
            toggleToFirstTab={toggleToFirstTab}
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
