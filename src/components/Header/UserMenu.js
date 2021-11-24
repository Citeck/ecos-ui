import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { extractLabel, t } from '../../helpers/util';
import { extractIcon, getIconObjectWeb } from '../../helpers/icon';
import MenuService from '../../services/MenuService';
import { Avatar, EcosDropdownMenu, Tooltip, EcosIcon } from '../common';
import { IcoBtn } from '../common/btns';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: state.user.avatar ? `${state.user.avatar}&width=150` : '',
  items: state.header.userMenu.items,
  isLoading: state.header.userMenu.isLoading,
  theme: state.view.theme
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
        className="ecos-header-user__menu-item"
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
    const { userFullName, items, isMobile, widthParent, userPhotoUrl, theme, isLoading } = this.props;
    const medium = widthParent > 600 && widthParent < 910;
    const mob = isMobile || medium;
    const classNameIcoBtn = classNames('ecos-header-user__btn', 'ecos-btn_tight', 'ecos-btn_r_6', 'ecos-btn_blue-classic', {
      [`ecos-btn_theme_${theme}`]: !mob && !!theme,
      'ecos-btn_no-back ecos-btn_width_auto': mob
    });

    return (
      <>
        {!mob ? <Avatar className="ecos-header-user-avatar" theme={theme} url={userPhotoUrl} /> : null}
        <Dropdown className="ecos-header-user ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className="ecos-header-dropdown__toggle" id="ecos-header-dropdown--user-name">
            <Tooltip target="ecos-header-dropdown--user-name" text={userFullName} placement={'left'} uncontrolled showAsNeeded>
              {mob ? <Avatar className="ecos-header-user-avatar" theme={theme} url={userPhotoUrl} /> : null}
              <IcoBtn invert={true} icon={dropdownOpen ? 'icon-small-up' : 'icon-small-down'} className={classNameIcoBtn}>
                {!mob && userFullName}
              </IcoBtn>
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
