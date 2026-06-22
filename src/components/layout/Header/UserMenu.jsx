import { COOKIE_KEY_LOCALE, COOKIE_KEY_LOCALE_MAX_AGE } from '@citeck/constants/alfresco';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { Avatar, EcosDropdownMenu, Tooltip, EcosIcon } from '@/components/common';
import { IcoBtn } from '@/components/common/btns';
import AvatarBtn from '@/components/common/btns/AvatarBtn';

import { extractIcon, getIconObjectWeb, getIconUpDown } from '@/helpers/icon';
import { getFitnesseClassName } from '@/helpers/tools';
import { extractLabel, getCurrentLocale, setCookie, t } from '@/helpers/util';
import { allowedLanguages } from '@/i18n/lang';
import MenuService from '@/services/MenuService';
import UserService from '@/services/UserService';

const mapStateToProps = state => ({
  userFullName: state.user.fullName,
  userPhotoUrl: UserService.getAvatarUrl(state.user.thumbnail),
  items: state.header.userMenu.items,
  isLoading: state.header.userMenu.isLoading,
  theme: state.view.theme
});

const Labels = {
  EMPTY: 'header.menu.msg.empty-list',
  LOADING: 'header.menu.msg.loading',
  LANGUAGE: 'header.user-menu.language'
};

class UserMenu extends PureComponent {
  static propTypes = {
    isMobile: PropTypes.bool,
    widthParent: PropTypes.number
  };

  static defaultProps = {
    isMobile: false
  };

  state = {
    dropdownOpen: false,
    currentLocale: getCurrentLocale()
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  switchLanguage = language => {
    setCookie(COOKIE_KEY_LOCALE, language, { 'max-age': COOKIE_KEY_LOCALE_MAX_AGE });
    window.location.reload();
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
        {icon && <EcosIcon data={{ ...getIconObjectWeb(item.icon), color: '#B7B7B7' }} />}
        <span className="ecos-header-user__menu-item-label">{extractLabel(item.label)}</span>
      </button>
    );
  };

  renderLanguageSection = () => {
    const { currentLocale } = this.state;

    return (
      <div className="ecos-header-user__menu-section">
        <div className="ecos-header-user__menu-section-title">{t(Labels.LANGUAGE)}</div>
        <div className="ecos-header-user__menu-section-options">
          {allowedLanguages.map(lang => (
            <button
              key={lang.id}
              className={classNames('ecos-header-user__menu-option', {
                'ecos-header-user__menu-option_active': lang.id === currentLocale
              })}
              onClick={() => this.switchLanguage(lang.id)}
            >
              <img className="ecos-header-user__menu-option-flag" src={lang.img} alt={lang.id} />
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { dropdownOpen } = this.state;
    const { userFullName, items, isMobile, widthParent, userPhotoUrl, theme, isLoading } = this.props;
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
        'ecos-btn-with-avatar': !mob
      }
    );

    return (
      <>
        <Dropdown className="ecos-header-user ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
          <DropdownToggle tag="div" className="ecos-header-dropdown__toggle" id="ecos-header-dropdown--user-name">
            <Tooltip target="ecos-header-dropdown--user-name" text={userFullName} placement={'left'} uncontrolled showAsNeeded>
              {mob ? <Avatar className="ecos-header-user-avatar" theme={theme} url={userPhotoUrl} /> : null}
              {mob && (
                <IcoBtn invert={true} icon={getIconUpDown(dropdownOpen)} className={classNameIcoBtn}>
                  {!mob && userFullName}
                </IcoBtn>
              )}
              {!mob && <AvatarBtn icon={getIconUpDown(dropdownOpen)} className={classNameIcoBtn} />}
            </Tooltip>
          </DropdownToggle>
          <DropdownMenu className="ecos-header-user__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
            <EcosDropdownMenu
              items={items}
              mode={'custom'}
              emptyMessage={isLoading ? t(Labels.LOADING) : t(Labels.EMPTY)}
              renderItem={this.renderMenuItem}
            />
            {this.renderLanguageSection()}
          </DropdownMenu>
        </Dropdown>
      </>
    );
  }
}

export default connect(mapStateToProps)(UserMenu);
