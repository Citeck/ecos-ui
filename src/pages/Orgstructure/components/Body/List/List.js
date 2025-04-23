import get from 'lodash/get';
import PropTypes from 'prop-types';
import React from 'react';

import ListItem, { itemPropType } from '../ListItem';

import './List.scss';
const List = ({ items, counting, tabId, toggleToFirstTab }) => {
  return (
    <ul className={`select-orgstruct__list`}>
      {items.map((item, index) => {
        return <ListItem key={`${index}-${item.id}`} path={`root`} item={item} tabId={tabId} toggleToFirstTab={toggleToFirstTab} />;
      })}
    </ul>
  );
};

List.propTypes = {
  items: PropTypes.arrayOf(itemPropType),
  nestingLevel: PropTypes.number
};

export default React.memo(List);
