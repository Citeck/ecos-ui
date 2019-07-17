import React, { Fragment } from 'react';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import DropDownMenuItem from '../../common/DropdownMenu/DropdownMenuItem';

const SearchDropdown = () => {
  const searchDropdownListItems = [
    <DropDownMenuItem
      key={0}
      data={{
        id: 'HEADER_SEARCH_BOX_ADVANCED_SEARCH',
        label: 'header.advanced-search.label',
        targetUrl: '/share/page/site/hr/advsearch'
      }}
    />
  ];

  return (
    <Fragment>
      <UncontrolledDropdown className="search-dropdown-menu">
        <DropdownToggle tag="span" className="search-dropdown-menu__toggle">
          <i className={'fa fa-chevron-circle-down'} />
        </DropdownToggle>
        <DropdownMenu id="HEADER_SEARCH__DROPDOWN">{searchDropdownListItems}</DropdownMenu>
      </UncontrolledDropdown>
    </Fragment>
  );
};

export default SearchDropdown;
