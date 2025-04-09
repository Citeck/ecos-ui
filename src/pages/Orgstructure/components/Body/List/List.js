import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { Suspense, useState, useCallback } from 'react';
import { Collapse } from 'reactstrap';

import Records from '../../../../../components/Records';
import { useOrgstructContext } from '../../../../../components/common/Orgstruct/OrgstructContext';
import ListItem, { itemPropType } from '../ListItem';

import './List.scss';
import { Loader } from '@/components/common';

const List = ({ items, nestingLevel = 0, tabId, toggleToFirstTab, previousParent }) => {
  const { currentTab, tabItems, openedItems } = useOrgstructContext();

  const [selectedId, setSelectedId] = useState('');

  const getGroups = useCallback(item => get(item, 'attributes.groups', []), []);
  const deletePersonItem = useCallback(item => {
    const record = Records.get(item.id);

    record.att('att_rem_authorityGroups', item.parentId);

    return record.save();
  });

  return (
    <ul className={'select-orgstruct__list'}>
      {items.map((item, index) => {
        let nestedList = null;

        if (item.hasChildren) {
          const children = tabItems[currentTab].filter(i => i.parentId === item.id || getGroups(i).includes(item.id));

          nestedList = (
            <Collapse
              isOpen={
                previousParent && openedItems[item.id] && openedItems[item.id].length >= 0
                  ? openedItems[item.id].includes(previousParent)
                  : item.isOpen
              }
            >
              <Suspense fallback={<Loader type="points" />}>
                <List
                  previousParent={item.id}
                  items={children}
                  nestingLevel={nestingLevel + 1}
                  tabId={tabId}
                  toggleToFirstTab={toggleToFirstTab}
                />
              </Suspense>
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

export default React.memo(List);
