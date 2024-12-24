import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { extractLabel, t } from '../../helpers/util';
import { extractIcon, getIconObjectWeb, getIconUpDown } from '../../helpers/icon';
import MenuService from '../../services/MenuService';
import UserService from '../../services/UserService';
import { Avatar, EcosDropdownMenu, Tooltip, EcosIcon } from '../common';
import { IcoBtn } from '../common/btns';
import { getFitnesseClassName } from '../../helpers/tools';
import { selectIsViewNewJournal } from '../../selectors/view';
import AvatarBtn from '../common/btns/AvatarBtn';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: UserService.getAvatarUrl(state.user.thumbnail),
  items: state.header.userMenu.items,
  isLoading: state.header.userMenu.isLoading,
  theme: state.view.theme,
  isViewNewJournal: selectIsViewNewJournal(state)
});

const Labels = {
  EMPTY: 'header.menu.msg.empty-list',
  LOADING: 'header.menu.msg.loading'
};

class UserMenu extends React.Component {
  static propTypes = {
    isMobile: PropTypes.bool,
    widthParent: PropTypes.number
  };

  static defaultProps = {
    isMobile: false
  };

  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  renderMenuItem = (item, key) => {
    const icon = extractIcon(item.icon);
    const extraProps = {};

    if (item.info) {
      extraProps.title = extractLabel(item.info);
    }

    return (
      <button
        key={item.id || key}
        className={classNames('ecos-header-user__menu-item', getFitnesseClassName('header-user-menu', item.type))}
        onClick={() => MenuService.getUserMenuCallback(item)}
        {...extraProps}
      >
        {icon && <EcosIcon data={getIconObjectWeb(item.icon)} />}
        <span className="ecos-header-user__menu-item-label">{extractLabel(item.label)}</span>
      </button>
    );
  };

  render() {
    const { dropdownOpen } = this.state;
    const { userFullName, items, isMobile, widthParent, userPhotoUrl, theme, isLoading, isViewNewJournal } = this.props;
    const medium = widthParent > 600 && widthParent < 910;
    const mob = isMobile || medium;
    const classNameIcoBtn = classNames(
      'ecos-header-user__btn',
      'ecos-btn_tight',
      'ecos-btn_r_6',
      'ecos-btn_blue-classic',
      getFitnesseClassName('header-user-menu', 'toggle-button'),
      {
        [`ecos-btn_theme_${theme}`]: !mob && !!theme,
        'ecos-btn_no-back ecos-btn_width_auto': mob,
        'ecos-btn-with-avatar': !mob && isViewNewJournal
      }
    );

    return (
      <>
        {!mob && !isViewNewJournal ? <Avatar className="ecos-header-user-avatar" theme={theme} url={userPhotoUrl} /> : null}
        <Dropdown className="ecos-header-user ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className="ecos-header-dropdown__toggle" id="ecos-header-dropdown--user-name">
            <Tooltip target="ecos-header-dropdown--user-name" text={userFullName} placement={'left'} uncontrolled showAsNeeded>
              {mob ? <Avatar className="ecos-header-user-avatar" theme={theme} url={userPhotoUrl} /> : null}
              {(!isViewNewJournal || mob) && (
                <IcoBtn invert={true} icon={getIconUpDown(dropdownOpen)} className={classNameIcoBtn}>
                  {!mob && userFullName}
                </IcoBtn>
              )}
              {!mob && isViewNewJournal && <AvatarBtn icon={getIconUpDown(dropdownOpen)} className={classNameIcoBtn} />}
            </Tooltip>
          </DropdownToggle>
          <DropdownMenu className="ecos-header-user__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
            <EcosDropdownMenu
              items={items}
              mode={'custom'}
              emptyMessage={isLoading ? t(Labels.LOADING) : t(Labels.EMPTY)}
              renderItem={this.renderMenuItem}
            />
          </DropdownMenu>
        </Dropdown>
      </>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
