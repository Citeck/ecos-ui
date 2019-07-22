import React from 'react';
import classNames from 'classnames';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { DropdownMenu as Menu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  items: state.header.userMenu.items
});

class UserMenu extends React.Component {
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
    const { userFullName, items } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));
    const classNameIcoBtn = classNames(
      `${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_tight ecos-btn_r_6`,
      { 'ecos-btn_active_blue': dropdownOpen },
      { 'ecos-btn_active_blue2': !dropdownOpen }
    );

    return (
      <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn
            invert={'true'}
            icon={dropdownOpen ? 'icon-up' : 'icon-down'}
            className={classNameIcoBtn}
            title={t('create_case.label')}
            disabled={disabled}
          >
            {userFullName}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right`}>
          <Menu items={items} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
