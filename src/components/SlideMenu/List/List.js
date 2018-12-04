import React from 'react';
import { connect } from 'react-redux';
import ListItem from '../ListItem';

const mapStateToProps = state => ({
  expandableItems: state.slideMenu.expandableItems
});

const ListPure = ({ items, toggleSlideMenu, isExpanded, isNested, expandableItems }) => {
  const listContent = items.map(item => {
    let nestedList = null;
    let isNestedListExpanded = false;
    if (item.items && item.items.length > 0) {
      if (expandableItems && expandableItems.length > 0) {
        const expandableItem = expandableItems.find(fi => fi.id === item.id);
        isNestedListExpanded = expandableItem.isNestedListExpanded;
      }

      nestedList = <List items={item.items} toggleSlideMenu={toggleSlideMenu} isNested={true} isExpanded={isNestedListExpanded} />;
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

  let classes = ['slide-menu-collapsible-list'];

  if (isExpanded) {
    classes.push('slide-menu-collapsible-list_expanded');
  }

  if (isNested) {
    classes.push('slide-menu-collapsible-list_nested');
  }

  return <ul className={classes.join(' ')}>{listContent}</ul>;
};

const List = connect(mapStateToProps)(ListPure);
export default List;
