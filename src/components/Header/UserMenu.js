import React from 'react';
import PropTypes from 'prop-types';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { DropdownMenu as Menu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';

const mapStateToProps = state => ({
  userPhotoUrl: state.user.thumbnail,
  userFullName: state.user.fullName,
  items: state.header.userMenu.items
});

class UserMenu extends React.Component {
  static propTypes = {
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isSmallMode: false,
    isMobile: false
  };

  className = 'ecos-header-user';

  renderPhoto() {
    const { userPhotoUrl } = this.props;
    const className = `${this.className}__photo`;

    return (
      <div className={className}>
        {isEmpty(userPhotoUrl) ? (
          <i className={`${className}-icon icon-User_avatar`} />
        ) : (
          <div className={`${className}-image`} style={{ backgroundImage: 'url(' + userPhotoUrl + ')' }} />
        )}
      </div>
    );
  }

  render() {
    const { userFullName, isMobile, isSmallMode, items } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));

    return (
      <div className={`${this.className}__container`}>
        {this.renderPhoto()}
        <UncontrolledDropdown className={`ecos-header-dropdown`}>
          <DropdownToggle tag="div">
            <IcoBtn
              invert={true}
              icon={'icon-down'}
              className={`${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_tight`}
              title={t('create_case.label')}
              disabled={disabled}
            >
              {!(isSmallMode || isMobile) && userFullName}
            </IcoBtn>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_right`}>
            <Menu items={items} />
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
