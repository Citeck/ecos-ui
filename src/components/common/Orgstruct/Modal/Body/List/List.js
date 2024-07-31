import React from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import ListItem, { itemPropType } from '../ListItem';
import { useOrgstructContext } from '../../../OrgstructContext';
import get from 'lodash/get';
import './List.scss';

const List = ({ items, nestingLevel = 0, previousParent }) => {
  const context = useOrgstructContext();

  const groups = item => get(item, 'attributes.groups', []);

  return (
    <ul className={'select-orgstruct__list'}>
      {items.map(item => {
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
              <List previousParent={item.id} items={children} nestingLevel={nestingLevel + 1} />
            </Collapse>
          );
        }

        return <ListItem previousParent={previousParent} key={item.id} item={item} nestingLevel={nestingLevel} nestedList={nestedList} />;
      })}
    </ul>
  );
};

List.propTypes = {
  items: PropTypes.arrayOf(itemPropType),
  nestingLevel: PropTypes.number
};

export default List;
