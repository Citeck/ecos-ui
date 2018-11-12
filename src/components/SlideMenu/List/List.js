import React from 'react';
import { connect } from 'react-redux';
import { toggleExpanded } from '../../../actions/slideMenu';
import ListItem from '../ListItem';

const mapStateToProps = state => ({
  expandableItems: state.slideMenu.expandableItems
});

const mapDispatchToProps = dispatch => ({
  setExpanded: id => dispatch(toggleExpanded(id))
});

const ListPure = ({ items, toggleSlideMenu, isExpanded, isNested, setExpanded, expandableItems }) => {
  const listContent = items.map(item => {
    const isSelected = false;

    let nestedList = null;
    let isNestedListExpanded = false;
    if (item.items && item.items.length > 0) {
      if (expandableItems && expandableItems.length > 0) {
        const expandableItem = expandableItems.find(fi => fi.id === item.id);
        isNestedListExpanded = expandableItem.isNestedListExpanded;
      }

      nestedList = (
        <List items={item.items} toggleSlideMenu={toggleSlideMenu} isNested={!item.sectionTitle} isExpanded={isNestedListExpanded} />
      );
    }

    let toggleCollapse = null;
    if (nestedList) {
      let classes = ['slide-menu-list__toggle-collapse'];
      if (isNestedListExpanded) {
        classes.push('slide-menu-list__toggle-collapse_expanded');
      }

      toggleCollapse = <div className={classes.join(' ')} onClick={() => setExpanded(item.id)} />;
    }

    return (
      <ListItem
        key={item.id}
        toggleSlideMenu={toggleSlideMenu}
        item={item}
        isSelected={isSelected}
        nestedList={nestedList}
        toggleCollapse={toggleCollapse}
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

const List = connect(
  mapStateToProps,
  mapDispatchToProps
)(ListPure);
export default List;
