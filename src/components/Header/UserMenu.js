import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { DropdownMenu as Menu } from '../common';
import { IcoBtn } from '../common/btns';
import { Avatar } from '../common';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: state.user.thumbnail,
  items: state.header.userMenu.items
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
    const { userFullName, items, isMobile, widthParent, userPhotoUrl } = this.props;
    const medium = widthParent > 600 && widthParent < 910;
    const disabled = !(!isEmpty(items) && isArray(items));
    const mob = isMobile || medium;
    const classNameIcoBtn = classNames(
      `${this.className}__btn ecos-btn_tight ecos-btn_r_6`,
      { 'ecos-btn_blue ecos-btn_hover_t-blue': !mob },
      { 'ecos-btn_active_blue': dropdownOpen && !mob },
      { 'ecos-btn_active_blue2': !dropdownOpen && !mob },
      { 'ecos-btn_no-back ecos-btn_width_auto': mob }
    );

    return (
      <React.Fragment>
        {!mob ? <Avatar url={userPhotoUrl} /> : null}
        <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className={'ecos-header-dropdown__toggle'}>
            {mob ? <Avatar url={userPhotoUrl} /> : null}
            <IcoBtn
              invert={true}
              icon={dropdownOpen ? 'icon-up' : 'icon-down'}
              className={classNameIcoBtn}
              title={t('create_case.label')}
              disabled={disabled}
            >
              {!mob && userFullName}
            </IcoBtn>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links`}>
            <Menu items={items} />
          </DropdownMenu>
        </Dropdown>
      </React.Fragment>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
