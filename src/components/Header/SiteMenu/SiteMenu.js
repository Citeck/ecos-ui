import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isArray, isEmpty } from 'lodash';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { DropdownMenuItem } from '../../common/form/DropdownMenu';
import { goToPageFromSiteMenu } from '../../../actions/header';

const mapStateToProps = state => ({
  items: state.header.siteMenu.items
});

const mapDispatchToProps = dispatch => ({
  goToPage: payload => dispatch(goToPageFromSiteMenu(payload))
});

const SiteMenu = ({ items, goToPage }) => {
  if (isEmpty(items) || !isArray(items)) {
    return null;
  }

  const menuListItems = items.map((item, key) => <DropdownMenuItem key={key} data={item} onClick={goToPage} />);

  return (
    <div id="HEADER_SITE_MENU">
      <UncontrolledDropdown className="custom-dropdown-menu">
        <DropdownToggle tag="div" className="site-dropdown-menu__toggle custom-dropdown-menu__toggle">
          <i className={'fa fa-cog'} />
        </DropdownToggle>
        <DropdownMenu className="custom-dropdown-menu__body" id="HEADER_SITE_MENU__DROPDOWN" right>
          {menuListItems}
        </DropdownMenu>
      </UncontrolledDropdown>
    </div>
  );
};

SiteMenu.propTypes = {
  items: PropTypes.array.isRequired
};

SiteMenu.defaultProps = {
  items: []
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteMenu);
