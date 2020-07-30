import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { goToPageFromSiteMenu } from '../../actions/header';
import { processMenuItemsFromOldMenu } from '../../helpers/menu';
import { DropdownMenu as Menu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';
import Icon from '../common/icons/Icon/Icon';

const mapStateToProps = state => ({
  items: state.header.siteMenu.items,
  theme: state.view.theme
});

const mapDispatchToProps = dispatch => ({
  goToPage: payload => dispatch(goToPageFromSiteMenu(payload))
});

class SiteMenu extends React.Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    legacyItems: PropTypes.array
  };

  static defaultProps = {
    items: [],
    legacyItems: []
  };

  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  handelItem = data => {
    this.toggle();
    this.props.goToPage(data);
  };

  render() {
    const { dropdownOpen } = this.state;
    const { items, legacyItems, theme } = this.props;
    const classNameIcoBtn = classNames(`ecos-header-site__btn ecos-btn_theme_${theme} ecos-btn_padding_small ecos-btn_r_6`);

    let menuItems = [];
    if (Array.isArray(legacyItems) && legacyItems.length) {
      menuItems = processMenuItemsFromOldMenu(legacyItems);
    } else {
      menuItems = items;
    }

    if (isEmpty(menuItems)) {
      return null;
    }

    return (
      <Dropdown className="ecos-header-site ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn invert className={classNameIcoBtn} icon={dropdownOpen ? 'icon-small-up' : 'icon-small-down'}>
            <Icon className="icon-settings" />
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className="ecos-header-site__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
          <Menu items={menuItems} onClick={this.handelItem} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteMenu);
