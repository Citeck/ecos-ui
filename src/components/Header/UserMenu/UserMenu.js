import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import DropDownMenuItem from '../DropdownMenuItem';

const UserMenu = ({ userFullName, userPhotoUrl, items, isMobile }) => {
  let userImage = userPhotoUrl ? (
    <div className="user-photo-header">
      <div style={{ backgroundImage: 'url(' + userPhotoUrl + ')' }} />
    </div>
  ) : null;

  if (userImage === null && isMobile) {
    userImage = <FontAwesomeIcon icon={faUser} color="white" size="lg" />;
  }

  let menuListItems = null;
  if (Array.isArray(items) && items.length > 0) {
    menuListItems = items.map((item, key) => <DropDownMenuItem key={key} data={item} />);
  }

  return (
    <div id="HEADER_USER_MENU">
      <UncontrolledDropdown className="custom-dropdown-menu">
        <DropdownToggle tag="span" className="user-dropdown-menu__toggle custom-dropdown-menu__toggle">
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
  items: state.header.userMenu.items,
  isMobile: state.view.isMobile
});

export default connect(mapStateToProps)(UserMenu);
