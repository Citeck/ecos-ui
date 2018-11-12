import React from 'react';
import { connect } from 'react-redux';
import { setSelectedId } from '../../../actions/slideMenu';
import { t } from '../../../helpers/util';

const selectedMenuItemIdKey = 'selectedMenuItemId';

const mapStateToProps = (state, ownProps) => ({
  isSelected: state.slideMenu.selectedId === ownProps.item.id
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onSelectItem: id => {
    sessionStorage && sessionStorage.setItem && sessionStorage.setItem(selectedMenuItemIdKey, id);
    ownProps.toggleSlideMenu();
    dispatch(setSelectedId(id));
  }
});

const ListItem = ({ item, onSelectItem, isSelected, nestedList, toggleCollapse }) => {
  if (item.sectionTitle) {
    return (
      <li id={item.id} className="slide-menu-list__item list-divider">
        <span className="list-divider__text">{t(item.sectionTitle)}</span>
        {nestedList}
      </li>
    );
  }

  let label = t(item.label || `header.${item.id}.label`);
  let icon = <i className={`fa fa-menu-default-icon ${item.id}`} />;
  let targetUrl = null;
  if (item.url) {
    targetUrl = item.url;
  }

  // TODO handleControl
  let clickHandler = null;
  // if (item.control && item.control.type) {
  //     clickHandler = event => {
  //         event.preventDefault();
  //         handleControl(control.type, control.payload, dispatch);
  //     };
  // }
  if (item.clickEvent) {
    clickHandler = item.clickEvent;
  }

  let classes = ['slide-menu-list__link'];
  if (isSelected) {
    classes.push('slide-menu-list__link_selected');
  }

  return (
    <li id={item.id} className="slide-menu-list__item">
      {toggleCollapse}
      <a
        href={targetUrl}
        onClick={() => {
          onSelectItem(item.id);
          // eval(clickHandler);
          console.log('clickHandler', clickHandler);
        }}
        className={classes.join(' ')}
      >
        {icon}
        <span className={'slide-menu-list__link-label'}>{label}</span>
      </a>
      {nestedList}
    </li>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListItem);
