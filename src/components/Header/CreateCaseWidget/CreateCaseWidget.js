import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import DropDownMenuGroup from '../DropdownMenuGroup';
import DropdownMenuCascade from '../DropdownMenuCascade';

const CreateCaseWidget = ({ items, isCascade }) => {
  if (!items) {
    return null;
  }

  let menuListItems = [];
  if (Array.isArray(items) && items.length > 0) {
    menuListItems = items.map((item, key) => {
      return isCascade ? (
        <DropdownMenuCascade key={key} label={item.label} items={item.items} id={item.id} />
      ) : (
        <DropDownMenuGroup key={key} label={item.label} items={item.items} id={item.id} />
      );
    });
  }

  let dropdownMenuClasses = ['custom-dropdown-menu__body'];
  if (isCascade) {
    dropdownMenuClasses.push('cascade');
  }

  return (
    <div id="HEADER_CREATE_CASE">
      <UncontrolledDropdown className="custom-dropdown-menu">
        <DropdownToggle tag="span" className="create-case-dropdown-menu__toggle custom-dropdown-menu__toggle">
          <FontAwesomeIcon icon={faPlus} color="white" size="lg" />
        </DropdownToggle>
        <DropdownMenu className={dropdownMenuClasses.join(' ')} id="HEADER_CREATE_CASE__DROPDOWN">
          {menuListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </div>
  );
};

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isCascade: state.header.createCaseWidget.isCascade
});

export default connect(mapStateToProps)(CreateCaseWidget);
