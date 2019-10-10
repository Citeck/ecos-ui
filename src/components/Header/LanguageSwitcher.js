import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { DropdownMenu as Menu } from '../common';
import IcoBtn from '../common/btns/IcoBtn';
import { getCurrentLocale, setCookie } from '../../helpers/util';
import { COOKIE_KEY_LOCALE, COOKIE_KEY_LOCALE_MAX_AGE } from '../../constants/alfresco';
import { DEFAULT_THEME } from '../../constants/theme';

const LANGUAGE_RU = 'ru';
const LANGUAGE_EN = 'en';
const IMG_V = '2';

export default class LanguageSwitcher extends React.Component {
  static defaultProps = {
    items: [
      {
        id: LANGUAGE_EN,
        label: 'Eng',
        img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_EN}.png?v=${IMG_V}`
      },
      {
        id: LANGUAGE_RU,
        label: 'Рус',
        img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_RU}.png?v=${IMG_V}`
      }
    ]
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
    this.setState({
      language: getCurrentLocale()
    });
  }

  render() {
    const { language, dropdownOpen } = this.state;
    const { items, theme } = this.props;

    if (!language) {
      return null;
    }

    const classNameIcoBtn = classNames('ecos-header-lang__btn ecos-btn_padding_small ecos-btn_r_6', {
      'ecos-btn_blue ecos-btn_hover_t-blue': theme === DEFAULT_THEME,
      [`ecos-btn_theme_${theme}`]: theme !== DEFAULT_THEME,
      'ecos-btn_active_blue': dropdownOpen && theme === DEFAULT_THEME,
      'ecos-btn_active_blue2': !dropdownOpen && theme === DEFAULT_THEME
    });

    const currentLanguage = items.find(item => item.id === language);
    if (!currentLanguage) {
      return null;
    }

    const selectableLanguages = items.filter(item => item.id !== language);

    return (
      <Dropdown className="ecos-header-lang ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn invert className={classNameIcoBtn} icon={dropdownOpen ? 'icon-up' : 'icon-down'}>
            <img className="ecos-header-lang__img" src={currentLanguage.img} alt={language} />
            {currentLanguage.label}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className="ecos-header-lang__menu ecos-dropdown__menu ecos-dropdown__menu_right ecos-dropdown__menu_links">
          <Menu items={selectableLanguages} onClick={this.switchLanguage} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

LanguageSwitcher.propTypes = {
  theme: PropTypes.string
};
