import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Avatar, DropdownMenu as Menu } from '../common';
import { IcoBtn } from '../common/btns';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: state.user.thumbnail,
  items: state.header.userMenu.items,
  theme: state.view.theme
});

class UserMenu extends React.Component {
  static propTypes = {
    isMobile: PropTypes.bool,
    widthParent: PropTypes.number
  };

  static defaultProps = {
    isMobile: false
  };

  className = 'ecos-header-user';

  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  render() {
    const { dropdownOpen } = this.state;
    const { userFullName, items, isMobile, widthParent, userPhotoUrl, theme } = this.props;
    const medium = widthParent > 600 && widthParent < 910;
    const disabled = !(!isEmpty(items) && isArray(items));
    const mob = isMobile || medium;
    const classNameIcoBtn = classNames(`${this.className}__btn ecos-btn_tight ecos-btn_r_6`, {
      [`ecos-btn_theme_${theme}`]: !mob,
      'ecos-btn_no-back ecos-btn_width_auto': mob
    });

    return (
      <>
        {!mob ? <Avatar theme={theme} url={userPhotoUrl} /> : null}
        <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className={'ecos-header-dropdown__toggle'}>
            {mob ? <Avatar theme={theme} url={userPhotoUrl} /> : null}
            <IcoBtn invert={true} icon={dropdownOpen ? 'icon-up' : 'icon-down'} className={classNameIcoBtn} disabled={disabled}>
              {!mob && userFullName}
            </IcoBtn>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links`}>
            <Menu items={items} />
          </DropdownMenu>
        </Dropdown>
      </>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
