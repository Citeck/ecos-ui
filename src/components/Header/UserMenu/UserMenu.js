import React from 'react';
import PropTypes from 'prop-types';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { t } from '../../../helpers/util';
import DropDownMenuItem from '../DropdownMenuItem';
import IcoBtn from '../../common/btns/IcoBtn';

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

  renderMenuListItems() {
    const { items } = this.props;

    return items.map((item, key) => <DropDownMenuItem key={key} data={item} />);
  }

  render() {
    const { userFullName, isMobile, isSmallMode, items } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));

    return (
      <div className={`${this.className}__container`}>
        {this.renderPhoto()}
        <UncontrolledDropdown className={`${this.className}__menu`}>
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
          <DropdownMenu right className={`${this.className}__menu ecos-dropdown__menu`}>
            {!disabled && this.renderMenuListItems()}
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
