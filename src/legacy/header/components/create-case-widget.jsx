import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import DropDownMenuGroup from './dropdown-menu-group';
import DropdownMenuCascade from './dropdown-menu-cascade';
import { t } from '../../common/util';

const CreateCaseWidget = ({ items, isCascade }) => {
  let menuListItems = null;
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
      <UncontrolledDropdown className="custom-dropdown-menu" pullLeft>
        <DropdownToggle tag="span" className="create-case-dropdown-menu__toggle custom-dropdown-menu__toggle">
          <div>
            <i className={'fa fa-plus'} />
            <span>{t('create_case.label')}</span>
          </div>
        </DropdownToggle>
        <DropdownMenu className={dropdownMenuClasses.join(' ')} id="HEADER_CREATE_CASE__DROPDOWN">
          {menuListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </div>
  );
};

const mapStateToProps = state => ({
  items: state.caseMenu.items,
  isCascade: state.caseMenu.isCascade
});

export default connect(mapStateToProps)(CreateCaseWidget);
