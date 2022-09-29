import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import ListItem, { itemPropType } from '../ListItem';
import { SelectOrgstructContext } from '../../../../../components/common/form/SelectOrgstruct/SelectOrgstructContext';
import './List.scss';
import Records from '../../../../../components/Records';

const List = ({ items, nestingLevel = 0, reloadList }) => {
  const context = useContext(SelectOrgstructContext);

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
              <List items={children} nestingLevel={nestingLevel + 1} />
            </Collapse>
          );
        }
        return (
          <ListItem
            key={item.id}
            item={item}
            nestingLevel={nestingLevel}
            nestedList={nestedList}
            reloadList={reloadList}
            deleteItem={deleteItem}
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
