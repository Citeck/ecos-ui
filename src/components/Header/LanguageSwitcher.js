import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import get from 'lodash/get';

import { EcosDropdownMenu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';
import { getCurrentLocale, setCookie } from '../../helpers/util';
import { COOKIE_KEY_LOCALE, COOKIE_KEY_LOCALE_MAX_AGE } from '../../constants/alfresco';
import { allowedLanguages, LANGUAGE_EN } from '../../constants/lang';

export default class LanguageSwitcher extends React.Component {
  static defaultProps = {
    items: allowedLanguages
  };

  state = {
    language: null,
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  switchLanguage = ({ id: language }) => {
    setCookie(COOKIE_KEY_LOCALE, language, { 'max-age': COOKIE_KEY_LOCALE_MAX_AGE });

    window.location.reload();
  };

  componentDidMount() {
    const { items } = this.props;
    const currentLang = getCurrentLocale();
    let language = get(items.find(item => item.id === currentLang), 'id');

    if (!language) {
      language = get(allowedLanguages, '0.id', currentLang);
    }

    this.setState({ language });
  }

  render() {
    const { language, dropdownOpen } = this.state;
    const { items, theme } = this.props;

    if (!language) {
      return null;
    }

    const classNameIcoBtn = classNames(
      'ecos-header-lang__btn',
      `ecos-btn_theme_${theme}`,
      'ecos-btn_padding_small',
      'ecos-btn_r_6',
      'ecos-btn_blue-classic'
    );

    const currentLanguage = items.find(item => item.id === language) || get(allowedLanguages, '0');

    if (!currentLanguage) {
      return null;
    }

    const selectableLanguages = items.filter(item => item.id !== language);

    return (
      <Dropdown className="ecos-header-lang ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn invert className={classNameIcoBtn} icon={dropdownOpen ? 'icon-small-up' : 'icon-small-down'}>
            <img className="ecos-header-lang__img" src={currentLanguage.img} alt={language} />
            {currentLanguage.label}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className="ecos-header-lang__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
          <EcosDropdownMenu items={selectableLanguages} onClick={this.switchLanguage} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

LanguageSwitcher.propTypes = {
  theme: PropTypes.string
};
