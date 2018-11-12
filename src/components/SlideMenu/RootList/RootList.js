import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import List from '../List';
import connect from 'react-redux/es/connect/connect';

const mapStateToProps = state => ({
  items: state.slideMenu.items
});

const RootList = ({ items, toggleSlideMenu }) => {
  const scrollBarStyle = { height: 'calc(100% - 40px)' };
  const verticalTrack = props => <div {...props} className="slide-menu-list__vertical-track" />;

  return (
    <Scrollbars className="slide-menu-list" autoHide style={scrollBarStyle} renderTrackVertical={verticalTrack}>
      <nav>
        <List items={items} toggleSlideMenu={toggleSlideMenu} isExpanded />
      </nav>
    </Scrollbars>
  );
};

export default connect(mapStateToProps)(RootList);
