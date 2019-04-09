import React from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import ListItem, { itemPropType } from '../ListItem';

const List = ({ items, nestingLevel = 0 }) => {
  return (
    <ul className={'select-orgstruct__list'}>
      {items.map(item => {
        let nestedList = null;
        if (item.isGroup) {
          nestedList = (
            <Collapse isOpen={item.isOpen}>
              <List items={item.items} nestingLevel={nestingLevel + 1} />
            </Collapse>
          );
        }

        return <ListItem key={item.id} item={item} nestingLevel={nestingLevel} nestedList={nestedList} />;
      })}
    </ul>
  );
};

List.propTypes = {
  items: PropTypes.arrayOf(itemPropType),
  nestingLevel: PropTypes.number
};

export default List;
