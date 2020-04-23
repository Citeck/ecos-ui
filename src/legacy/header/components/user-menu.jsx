import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import DropDownMenuItem from './dropdown-menu-item';

const UserMenu = ({ userFullName, userPhotoUrl, items, isMobile }) => {
  let userImage = userPhotoUrl ? (
    <div className="user-photo-header">
      <div style={{ backgroundImage: 'url(' + userPhotoUrl + ')' }} />
    </div>
  ) : null;

  if (userImage === null && isMobile) {
    userImage = <i className={'fa fa-user'} />;
  }

  let menuListItems = null;
  if (Array.isArray(items) && items.length > 0) {
    menuListItems = items.map((item, key) => <DropDownMenuItem key={key} data={item} />);
  }

  return (
    <div id="HEADER_USER_MENU">
      <UncontrolledDropdown className="custom-dropdown-menu">
        <DropdownToggle tag="div" className="user-dropdown-menu__toggle custom-dropdown-menu__toggle">
          <span className="user-menu-username">{userFullName}</span>
          {userImage}
        </DropdownToggle>
        <DropdownMenu right className="custom-dropdown-menu__body" id="HEADER_USER_MENU__DROPDOWN">
          {menuListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </div>
  );
};

const mapStateToProps = state => ({
  userPhotoUrl: state.user.photo,
  userFullName: state.user.fullName,
  items: state.userMenu.items,
  isMobile: state.view.isMobile
});

export default connect(mapStateToProps)(UserMenu);
