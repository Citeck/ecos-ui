import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import ListItem from './ListItem';

const mapStateToProps = state => ({
  expandableItems: state.slideMenu.expandableItems
});

const ListPure = ({ items, toggleSlideMenu, isExpanded, isNested, expandableItems, className }) => {
  const listContent = items.map(item => {
    let nestedList = null;
    let isNestedListExpanded = false;

    if (!isEmpty(item.items)) {
      if (!isEmpty(expandableItems)) {
        const expandableItem = expandableItems.find(fi => fi.id === item.id);

        isNestedListExpanded = expandableItem.isNestedListExpanded;
      }

      nestedList = <List items={item.items} toggleSlideMenu={toggleSlideMenu} isNested isExpanded={isNestedListExpanded} />;
    }

    return (
      <ListItem
        key={item.id}
        toggleSlideMenu={toggleSlideMenu}
        item={item}
        nestedList={nestedList}
        isNestedListExpanded={isNestedListExpanded}
      />
    );
  });

  return <ul className="ecos-slide-menu-list_nested">{listContent}</ul>;
};

const List = connect(mapStateToProps)(ListPure);

List.propTypes = {
  items: PropTypes.array,
  toggleSlideMenu: PropTypes.func,
  isExpanded: PropTypes.bool,
  isNested: PropTypes.bool,
  expandableItems: PropTypes.array,
  className: PropTypes.string
};

List.defaultProps = {};

export default List;
