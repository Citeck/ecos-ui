import React from 'react';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import List from '../List';
import { t } from '../../../helpers/util';

const mapStateToProps = state => ({
  items: state.slideMenu.items
});

const RootList = ({ items, toggleSlideMenu }) => {
  const scrollBarStyle = { height: 'calc(100% - 40px)' };
  const verticalTrack = props => <div {...props} className="slide-menu-list__vertical-track" />;

  const rootListItems = items.map(item => {
    const nestedList = <List items={item.items} toggleSlideMenu={toggleSlideMenu} isExpanded />;

    return (
      <li key={item.id} id={item.id} className="slide-menu-list__item list-divider">
        <span className="list-divider__text">{t(item.label)}</span>
        {nestedList}
      </li>
    );
  });

  return (
    <Scrollbars className="slide-menu-list" autoHide style={scrollBarStyle} renderTrackVertical={verticalTrack}>
      <nav>
        <ul className="slide-menu-collapsible-list slide-menu-collapsible-list_expanded">{rootListItems}</ul>
      </nav>
    </Scrollbars>
  );
};

export default connect(mapStateToProps)(RootList);
