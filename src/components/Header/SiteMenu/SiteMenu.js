import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import DropDownMenuItem from '../DropdownMenuItem';

const SiteMenu = ({ items }) => {
  if (!Array.isArray(items) || items.length < 1) {
    return null;
  }

  const menuListItems = items.map((item, key) => <DropDownMenuItem key={key} data={item} />);

  return (
    <div id="HEADER_SITE_MENU">
      <UncontrolledDropdown className="custom-dropdown-menu">
        <DropdownToggle tag="div" className="site-dropdown-menu__toggle custom-dropdown-menu__toggle">
          <FontAwesomeIcon icon={faCog} color="white" size="lg" />
        </DropdownToggle>
        <DropdownMenu className="custom-dropdown-menu__body" id="HEADER_SITE_MENU__DROPDOWN" right>
          {menuListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </div>
  );
};

const mapStateToProps = state => ({
  items: state.header.siteMenu.items
});

export default connect(mapStateToProps)(SiteMenu);
