import React, { Fragment } from 'react';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronCircleDown } from '@fortawesome/free-solid-svg-icons';
import DropDownMenuItem from '../../DropdownMenuItem';

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
          <FontAwesomeIcon icon={faChevronCircleDown} color="#989898" />
        </DropdownToggle>
        <DropdownMenu className="custom-dropdown-menu__body" id="HEADER_SEARCH__DROPDOWN">
          {searchDropdownListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </Fragment>
  );
};

export default SearchDropdown;
