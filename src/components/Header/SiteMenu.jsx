import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { EcosDropdownMenu, Icon, Tooltip } from '../common';
import { IcoBtn } from '../common/btns';

import { goToPageFromSiteMenu } from '@/actions/header';
import { DropdownMenuItem } from '@/components/common/EcosDropdownMenu';
import { MenuModes } from '@/components/common/EcosDropdownMenu/DropdownMenu';
import { getIconUpDown } from '@/helpers/icon';
import { processMenuItemsFromOldMenu } from '@/helpers/menu';
import { extractLabel } from '@/helpers/util';

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

  handleClickItem = data => {
    this.toggle();

    if (data.onClick) {
      data.onClick(data);
    } else {
      this.props.goToPage(data);
    }
  };

  render() {
    const { dropdownOpen } = this.state;
    const { items, legacyItems, theme } = this.props;
    const classNameIcoBtn = classNames(
      'ecos-header-site__btn',
      `ecos-btn_theme_${theme}`,
      'ecos-btn_padding_small',
      'ecos-btn_r_6',
      'ecos-btn_blue-classic'
    );

    let menuItems;
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
          <IcoBtn invert className={classNameIcoBtn} icon={getIconUpDown(dropdownOpen)}>
            <Icon className="icon-settings" />
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className="ecos-header-site__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
          <EcosDropdownMenu
            items={menuItems}
            mode={MenuModes.CUSTOM}
            renderItem={(item, key) => (
              <Tooltip key={item.id || key} target={item.id} uncontrolled showAsNeeded text={extractLabel(get(item, 'label'))}>
                <DropdownMenuItem key={item.id || key} data={item} onClick={this.handleClickItem} />
              </Tooltip>
            )}
          />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SiteMenu);
