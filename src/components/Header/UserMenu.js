import React from 'react';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { DropdownMenu as Menu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  items: state.header.userMenu.items
});

class UserMenu extends React.Component {
  className = 'ecos-header-user';

  render() {
    const { userFullName, items } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));

    return (
      <UncontrolledDropdown className={`${this.className} ecos-header-dropdown`}>
        <DropdownToggle tag="div">
          <IcoBtn
            invert={'true'}
            icon={'icon-down'}
            className={`${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_tight ecos-btn_r_6`}
            title={t('create_case.label')}
            disabled={disabled}
          >
            {userFullName}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right`}>
          <Menu items={items} />
        </DropdownMenu>
      </UncontrolledDropdown>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
